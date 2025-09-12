/**
 * @file       structureTools.js
 * @description Утилиты генерации скелета и перенумерации глав/сцен
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, safeCreateFile, findProjectRoot, litSettingsService
 * @created    2025-09-10
 * @updated    2025-09-10
 * @docs       docs/project.md
 */

/**
 * Запрашивает у пользователя значение с обработкой пустых вводов
 */
async function promptNumber(plugin, message, fallback) {
    try {
        const value = plugin.prompt
            ? await plugin.prompt(message, String(fallback ?? ''))
            : String(fallback ?? '');
        const n = parseInt((value || '').trim(), 10);
        return Number.isFinite(n) && n > 0 ? n : fallback;
    } catch (_) {
        return fallback;
    }
}

/**
 * Определяет проект и (опционально) произведение
 */
async function resolveProjectAndWork(plugin, startPath) {
    let projectRoot = '';
    let workName = '';
    try {
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath || '');
            projectRoot = ctx.projectRoot || '';
            workName = ctx.workName || '';
        }
    } catch (_) {}
    if (!projectRoot) {
        const active = plugin.app.workspace.getActiveFile();
        const parent = active && active.parent ? active.parent.path : '';
        if (parent) projectRoot = (window.findProjectRoot?.(plugin.app, parent)) || parent;
    }
    return { projectRoot, workName };
}

/**
 * Создает скелет: главы (и опционально сцены) в выбранном произведении или глобально
 */
async function generateSkeleton(plugin, startPath = '') {
    try {
        if (plugin.logDebug) await plugin.logDebug('=== generateSkeleton старт ===');
        let { projectRoot, workName } = await resolveProjectAndWork(plugin, startPath);
        if (!projectRoot) { new Notice('Проект не найден'); return; }

        // Запрос области генерации, если произведение не определено явно
        try {
            const scopeOptions = ['В общем разделе рукописи', 'В конкретном произведении'];
            const scope = plugin.suggester
                ? await plugin.suggester(scopeOptions, scopeOptions, 'Где сгенерировать скелет?')
                : scopeOptions[0];
            if (scope === scopeOptions[1]) {
                // Выбор произведения
                const worksRoot = `${projectRoot}/1_Рукопись/Произведения`;
                const worksFolder = plugin.app.vault.getAbstractFileByPath(worksRoot);
                let workChoices = [];
                if (worksFolder && worksFolder.children) {
                    workChoices = worksFolder.children.filter(ch => ch && ch.children).map(ch => ch.name);
                }
                if (workChoices.length === 0) {
                    new Notice('Произведения не найдены. Сначала создайте произведение.');
                    return;
                }
                const chosen = plugin.suggester
                    ? await plugin.suggester(workChoices, workChoices, 'Выберите произведение')
                    : workChoices[0];
                if (!chosen) return;
                workName = chosen;
            } else if (scope !== scopeOptions[0]) {
                // Если пользователь отменил выбор — выходим
                return;
            }
        } catch (_) {}

        const chaptersCount = await promptNumber(plugin, 'Количество глав (число):', 3);
        const scenesPerChapter = await promptNumber(plugin, 'Сцен на главу (0 = не создавать):', 0);

        // Целевая папка глав
        const chaptersFolder = workName
            ? `${projectRoot}/1_Рукопись/Произведения/${workName}/Главы`
            : `${projectRoot}/1_Рукопись/Главы`;
        await plugin.app.vault.createFolder(chaptersFolder).catch(()=>{});

        // Определяем начальный номер по выбранной папке глав
        let next = 1;
        try {
            const startModeOptions = ['Начать с 001', 'Продолжить нумерацию'];
            const startMode = plugin.suggester
                ? await plugin.suggester(startModeOptions, startModeOptions, 'Нумерация глав')
                : startModeOptions[1];
            // Получаем список папок глав только в целевой папке
            const chaptersDir = plugin.app.vault.getAbstractFileByPath(chaptersFolder);
            const chapterFolders = (chaptersDir && chaptersDir.children)
                ? chaptersDir.children.filter(ch => ch && ch.children && /^Глава_\d{3}[-_]/.test(ch.name))
                : [];
            if (startMode === startModeOptions[1]) {
                // Продолжить: найти максимальный номер и +1
                let maxNum = 0;
                for (const cf of chapterFolders) {
                    const m = cf.name.match(/^Глава_(\d{3})_/);
                    if (m) {
                        const n = parseInt(m[1], 10);
                        if (Number.isFinite(n) && n > maxNum) maxNum = n;
                    }
                }
                next = maxNum + 1;
                if (next < 1) next = 1;
            } else {
                // Начать с конкретного числа
                next = await promptNumber(plugin, 'Начать с номера (число):', 1) || 1;
            }
        } catch (_) {}

        // Загружаем шаблон главы
        let chapterTpl = '';
        try { chapterTpl = await plugin.readTemplateFile('Новая_глава'); } catch (_) {}
        // Загружаем шаблон сцены
        let sceneTpl = '';
        try { sceneTpl = await plugin.readTemplateFile('Новая_сцена'); } catch (_) {}

        for (let i = 0; i < chaptersCount; i++) {
            const num = (next + i).toString().padStart(3, '0');
            // Папка и индексный файл главы теперь с дефисом между номером и именем
            const cleanName = `Глава_${num}-Глава_${num}`;
            const chapterDir = `${chaptersFolder}/${cleanName}`;
            await plugin.app.vault.createFolder(chapterDir).catch(()=>{});

            // Создаем файл главы
            const chapterFile = `${chapterDir}/Глава_${num}-Глава_${num}.md`;
            if (chapterTpl && typeof window.fillTemplate === 'function') {
                const content = await window.fillTemplate(chapterTpl, {
                    projectName: projectRoot.split('/').pop(),
                    workName: workName || '',
                    chapterNum: num,
                    chapterName: `Глава ${num}`,
                    characterTags: '',
                    locationTags: '',
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0,10)
                });
                await window.safeCreateFile?.(chapterFile, content, plugin.app);
            } else {
                await window.safeCreateFile?.(chapterFile, `# Глава ${num}\n`, plugin.app);
            }

            // Создаем сцены, если требуется
            for (let s = 1; s <= scenesPerChapter; s++) {
                const sNum = s.toString().padStart(2, '0');
                const sceneFile = `${chapterDir}/Сцена_${sNum}_Сцена_${sNum}.md`;
                if (sceneTpl && typeof window.fillTemplate === 'function') {
                    const content = await window.fillTemplate(sceneTpl, {
                        projectName: projectRoot.split('/').pop(),
                        workName: workName || '',
                        chapterName: `Глава ${num}`,
                        chapterNum: num,
                        sceneNum: sNum,
                        sceneName: `Сцена ${sNum}`,
                        characterTags: '',
                        locationTags: '',
                        tags: '' ,
                        date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0,10)
                    });
                    await window.safeCreateFile?.(sceneFile, content, plugin.app);
                } else {
                    await window.safeCreateFile?.(sceneFile, `# Сцена ${sNum}\n`, plugin.app);
                }
            }
        }
        new Notice('Скелет произведения создан');
    } catch (e) {
        new Notice('Ошибка генерации скелета: ' + e.message);
        await plugin.logDebug?.('Ошибка generateSkeleton: ' + e.message);
    }
}

/**
 * Перенумеровать папки глав в выбранном произведении/глобально
 */
async function renumberChapters(plugin, startPath = '') {
    try {
        const { projectRoot, workName } = await resolveProjectAndWork(plugin, startPath);
        if (!projectRoot) { new Notice('Проект не найден'); return; }
        const chaptersFolder = workName
            ? `${projectRoot}/1_Рукопись/Произведения/${workName}/Главы`
            : `${projectRoot}/1_Рукопись/Главы`;
        if (plugin.logDebug) await plugin.logDebug(`[renumberChapters] projectRoot=${projectRoot}, workName=${workName || '(none)'}`);
        if (plugin.logDebug) await plugin.logDebug(`[renumberChapters] chaptersFolder=${chaptersFolder}`);

        // Автосоздание целевой папки глав
        await plugin.app.vault.createFolder(chaptersFolder).catch(()=>{});

        const folder = plugin.app.vault.getAbstractFileByPath(chaptersFolder);
        if (!folder || !folder.children) { new Notice('Папка глав не найдена'); return; }

        const dirChildren = folder.children.filter(ch => ch && ch.children);
        // Сортируем по имени, затем переименовываем ННН и проставляем chapter_num во фронтматтере
        dirChildren.sort((a,b) => a.name.localeCompare(b.name, 'ru'));
        let counter = 1;
        for (const ch of dirChildren) {
            const num = counter.toString().padStart(3, '0');
            // Поддержка старых имён с дефисом и с подчёркиванием
            const rest = ch.name.replace(/^Глава_\d+[-_]?/, '');
            const newName = `Глава_${num}-${rest || ('Глава_'+num)}`;
            let newFolderPath = `${chaptersFolder}/${newName}`;
            if (newName !== ch.name) {
                await plugin.app.fileManager.renameFile(ch, newFolderPath);
            } else {
                newFolderPath = `${chaptersFolder}/${ch.name}`;
            }

            // Найти главный файл главы и проставить chapter_num
            try {
                const folderRef = plugin.app.vault.getAbstractFileByPath(newFolderPath);
                if (folderRef && folderRef.children) {
                    const indexFile = folderRef.children.find(f => f instanceof TFile && (/^Глава_\d{3}-/.test(f.name) || /^Глава_\d{3}_/.test(f.name)));
                    if (indexFile) {
                        await plugin.app.fileManager.processFrontMatter(indexFile, (fm) => {
                            fm.chapter_num = num;
                        });
                    }
                }
            } catch (_) {}
            counter++;
        }
        new Notice('Главы перенумерованы');
    } catch (e) {
        new Notice('Ошибка перенумерации глав: ' + e.message);
    }
}

/**
 * Перенумеровать сцены внутри выбранной папки главы
 */
async function renumberScenes(plugin, chapterFolderPath = '') {
    try {
        let target = chapterFolderPath;
        if (!target) {
            const active = plugin.app.workspace.getActiveFile();
            target = active && active.parent ? active.parent.path : '';
        }
        if (plugin.logDebug) await plugin.logDebug(`[renumberScenes] target=${target || '(empty)'}`);
        if (!target || !/\/Главы\/[^/]+\/Глава_\d{3}_[^/]+$/.test(target)) {
            // Разрешим также, если в target уже папка главы, без строгой проверки — дальше всё равно читаем детей
            await plugin.logDebug?.('[renumberScenes] target формат не распознан, продолжаю по содержимому папки');
        }
        const folder = plugin.app.vault.getAbstractFileByPath(target);
        if (!folder || !folder.children) { new Notice('Папка главы не найдена'); return; }

        // Рекурсивный сбор md-файлов
        const mdFiles = [];
        const walk = (node) => {
            for (const ch of (node.children || [])) {
                if (ch instanceof TFile && ch.extension === 'md') mdFiles.push(ch);
                else if (ch && ch.children) walk(ch);
            }
        };
        walk(folder);

        // Фильтруем только сцены по фронтматтеру type: сцена
        const sceneFiles = mdFiles.filter(f => {
            const cache = plugin.app.metadataCache.getFileCache(f) || {};
            const t = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
            return t === 'сцена';
        });
        if (plugin.logDebug) await plugin.logDebug(`[renumberScenes] найдено сцен: ${sceneFiles.length}`);
        if (sceneFiles.length === 0) { new Notice('Сцены в этой главе не найдены'); return; }

        // Сортируем по имени файла и/или существующему номеру
        sceneFiles.sort((a,b) => a.name.localeCompare(b.name, 'ru'));

        // Последовательно обновляем scene_num во фронтматтере и, опционально, имя файла
        let counter = 1;
        for (const f of sceneFiles) {
            const sNum = counter.toString().padStart(2, '0');
            // 1) Обновляем frontmatter
            await plugin.app.fileManager.processFrontMatter(f, (fm) => {
                fm.scene_num = sNum;
            });
            // 2) Переименовываем для консистентности префикса
            const rest = f.basename.replace(/^Сцена_\d+_?/, '');
            const newBase = `Сцена_${sNum}_${rest || ('Сцена_'+sNum)}`;
            if (newBase !== f.basename) {
                await plugin.app.fileManager.renameFile(f, `${target}/${newBase}.md`);
            }
            counter++;
        }
        new Notice('Сцены перенумерованы');
    } catch (e) {
        new Notice('Ошибка перенумерации сцен: ' + e.message);
    }
}

// Экспорт
module.exports = { generateSkeleton, renumberChapters, renumberScenes };

// Глобализация
if (typeof window !== 'undefined') {
    window.generateSkeleton = generateSkeleton;
    window.renumberChapters = renumberChapters;
    window.renumberScenes = renumberScenes;
}


