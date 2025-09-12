/**
 * @file       createChapter.js
 * @description Функция создания главы для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, modals.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание главы
 */
var createChapter = async function(plugin, startPath = '', options = {}) {
    try {
        plugin.logDebug('=== createChapter вызвана ===');
        // 1. Резолвим контекст (мир/произведение) из настроек/активного файла/стартового пути
        let projectRoot = '';
        let currentWork = '';
        try {
            if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
                const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
                projectRoot = ctx.projectRoot || '';
                currentWork = ctx.workName || '';
            }
        } catch (e) {}
        // Fallback, если сервис недоступен
        if (!projectRoot) {
            try {
                if (startPath) projectRoot = findProjectRoot(plugin.app, startPath) || '';
                if (!projectRoot) {
                    const activeFile = plugin.app.workspace.getActiveFile();
                    const parent = activeFile && activeFile.parent ? activeFile.parent.path : '';
                    if (parent) projectRoot = findProjectRoot(plugin.app, parent) || '';
                }
            } catch (e) {}
        }
        let project = '';

        if (projectRoot) {
            project = projectRoot;
        } else {
            // Fallback: выбор из всех проектов
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            if (projects.length === 0) {
                new Notice('Проекты не найдены!');
                plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;

        }
        plugin.logDebug('project: ' + project);
        const projectName = project.split('/').pop();
        let chaptersFolder = '';

        // Папка глав определяется после выбора области сюжетных линий

        // Запрос названия главы перенесён ниже, после вычисления chapterNum

        // 4. Выбор области сюжетных линий (глобальные/по произведению/оба) и чтение файлов
        const scopeOptions = ['Глобальные сюжетные линии', 'Сюжетные линии выбранного произведения', 'Объединить глобальные и выбранного произведения'];
        const scope = await plugin.suggester(scopeOptions, scopeOptions, 'Источник сюжетных линий');
        let chosenWork = currentWork || '';
        let plotLines = [];

        const parsePlotLines = (content) => {
            const parsed = [];
            const ls = String(content || '').split('\n');
            let currentTheme = null;
            for (let i = 0; i < ls.length; i++) {
                const line = ls[i].trim();
                if (line.startsWith('## Тема')) {
                    const match = line.match(/## Тема(\d+) - (.+)/);
                    if (match) {
                        currentTheme = { id: match[1], name: match[2], description: '' };
                    }
                } else if (line.startsWith('Описание:') && currentTheme) {
                    currentTheme.description = line.replace('Описание:', '').trim();
                    parsed.push(currentTheme);
                    currentTheme = null;
                }
            }
            return parsed;
        };

        const readText = async (path) => {
            try { return await plugin.app.vault.adapter.read(path); } catch (e) { return ''; }
        };

        const globalPlotPath = `${project}/Сюжетные_линии.md`;
        const worksRoot = `${project}/1_Рукопись/Произведения`;

        let globalLines = [];
        let workLines = [];

        if (scope === scopeOptions[0] || scope === scopeOptions[2]) {
            const content = await readText(globalPlotPath);
            globalLines = parsePlotLines(content).map(x => ({ ...x, __scope: 'Глобальные' }));
        }

        if (scope === scopeOptions[1] || scope === scopeOptions[2]) {
            // Выбор произведения
            let workChoices = [];
            try {
                const folder = plugin.app.vault.getAbstractFileByPath(worksRoot);
                if (folder && folder.children) {
                    workChoices = folder.children.filter(ch => ch && ch.children).map(ch => ch.name);
                }
            } catch (e) {}
            if (workChoices.length === 0) {
                new Notice('Произведения не найдены в проекте');
            } else {
                chosenWork = await plugin.suggester(workChoices, workChoices, 'Выберите произведение');
                if (chosenWork) {
                    const workPlotPath = `${worksRoot}/${chosenWork}/Сюжетные_линии.md`;
                    const content = await readText(workPlotPath);
                    workLines = parsePlotLines(content).map(x => ({ ...x, __scope: `Произведение: ${chosenWork}` }));

                    // Предложить миграцию глобальных линий в выбранное произведение
                    if ((scope === scopeOptions[1] || scope === scopeOptions[2]) && globalLines.length > 0) {
                        const migrate = await plugin.confirm?.(`Перенести ${globalLines.length} глобальных линий в «${chosenWork}» и очистить глобальный файл?`);
                        if (migrate) {
                            // Бэкап глобального файла
                            try {
                                const backupPath = `${project}/Сюжетные_линии_backup.md`;
                                const gContent = await readText(globalPlotPath);
                                await plugin.app.vault.adapter.write(backupPath, gContent);
                            } catch (e) {}
                            // Запись в файл произведения (добавление секций)
                            try {
                                const workPlotPath2 = `${worksRoot}/${chosenWork}/Сюжетные_линии.md`;
                                let existing = await readText(workPlotPath2);
                                if (!existing.includes('# Сюжетные линии')) {
                                    existing = '# Сюжетные линии\n\n';
                                }
                                const toAppend = globalLines.map((pl, idx) => `## Тема${pl.id || idx + 1} - ${pl.name}\nОписание: ${pl.description}\n`).join('\n');
                                await plugin.app.vault.adapter.write(workPlotPath2, existing + (existing.endsWith('\n') ? '' : '\n') + toAppend + '\n');
                            } catch (e) {}
                            // Очистка глобального
                            try { await plugin.app.vault.adapter.write(globalPlotPath, '# Сюжетные линии\n\n'); } catch (e) {}
                            // Обновляем локальные массивы после миграции
                            workLines = workLines.concat(globalLines.map(x => ({ ...x, __scope: `Произведение: ${chosenWork}` })));
                            globalLines = [];
                        }
                    }
                }
            }
        }

        plotLines = [...globalLines, ...workLines];

        // 4.1 Определяем папку глав в зависимости от области (работает и без выбора произведения)
        if (scope === scopeOptions[1] || scope === scopeOptions[2]) {
            if (chosenWork) {
                chaptersFolder = `${project}/1_Рукопись/Произведения/${chosenWork}/Главы`;
            } else {
                chaptersFolder = `${project}/1_Рукопись/Главы`;
            }
        } else {
            chaptersFolder = `${project}/1_Рукопись/Главы`;
        }
        await plugin.app.vault.createFolder(chaptersFolder).catch(()=>{});

        // 4.2 Генерация номера главы внутри выбранной папки
        const allMd = plugin.app.vault.getMarkdownFiles();
        let nextNum = 1;
        while (true) {
            const test = nextNum.toString().padStart(3, '0');
            const prefix = `${chaptersFolder}/Глава_${test}_`;
            const exists = allMd.some(f => f.path.startsWith(prefix));
            if (!exists) break;
            nextNum++;
        }
        const chapterNum = nextNum.toString().padStart(3, '0');
        plugin.logDebug('chapterNum: ' + chapterNum);

        // 5. Запрос названия главы (после вычисления номера и папки)
        const chapterName = await plugin.prompt('Название главы:');
        if (!chapterName) return;
        const cleanChapterName = chapterName.trim().replace(/\s+/g, '_').replace(/[^а-яА-ЯёЁ\w\s-.]/g, '');
        plugin.logDebug('chapterName: ' + chapterName);
        plugin.logDebug('cleanChapterName: ' + cleanChapterName);
        // Папку главы называем с дефисом, чтобы совпадало с именем индексного файла
        const chapterFolderPath = `${chaptersFolder}/Глава_${chapterNum}-${cleanChapterName}`;
        await plugin.app.vault.createFolder(chapterFolderPath).catch(()=>{});
        plugin.logDebug('chapterFolderPath: ' + chapterFolderPath);

        // 6. Выбор сюжетных линий
        const degrees = [
            { name: 'Прямая', value: 'прямая' },
            { name: 'Связанная', value: 'связанная' },
            { name: 'Фоновая', value: 'фоновая' }
        ];
        const selectedPlotLines = [];
        const plotLineChoices = plotLines.map(line => `${line.name} - ${line.description}`);
        let addMore = true;
        while (addMore && plotLines.length > 0) {
            const choice = await plugin.suggester(plotLineChoices, plotLineChoices, 'Выберите сюжетную линию (или Esc для завершения)');
            if (choice === null) {
                addMore = false;
            } else {
                const idx = plotLineChoices.indexOf(choice);
                if (idx < 0) { addMore = false; break; }
                const selectedLine = plotLines[idx];
                const degree = await plugin.suggester(degrees.map(d => d.name), degrees.map(d => d.value), 'Выберите степень участия:');
                if (degree && selectedLine && selectedLine.name) {
                    selectedPlotLines.push({ theme: selectedLine.name, degree });
                }
            }
        }

        // 7. Формируем данные для шаблона
        const plotLinesYaml = selectedPlotLines.length > 0
            ? selectedPlotLines.map(line => `  - line: "${line.theme}"\n    degree: "${line.degree}"\n    description: ""`).join('\n')
            : '  - line: ""\n    degree: ""\n    description: ""';
            
        const data = {
            chapterName: chapterName,
            cleanChapterName: cleanChapterName,
            chapterNum: chapterNum,
            projectName: projectName,
            workName: chosenWork || '',
            plotLines: selectedPlotLines,
            plotLinesYaml: plotLinesYaml,
            characterTags: '', // Пока пусто, можно добавить позже
            locationTags: '',  // Пока пусто, можно добавить позже
            date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)
        };

        // 8. Генерируем контент из шаблона
        let templateContent = '';
        try {
            templateContent = await plugin.readTemplateFile('Новая_глава');
        } catch (e) {
            plugin.logDebug('Шаблон "Новая_глава.md" не найден: ' + e.message);
            new Notice('Шаблон "Новая_глава.md" не найден в templates!', 6000);
            return;
        }
        const content = await window.fillTemplate(templateContent, data);
        
        const fileName = `Глава_${chapterNum}-${cleanChapterName}`;
        const targetPath = `${chapterFolderPath}/${fileName}.md`;
        await safeCreateFile(targetPath, content, plugin.app);

            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
        }
        // Удаляем возможный дубликат с подчёркиванием в имени (если он существует)
        try {
            const underscoreVariant = `${chapterFolderPath}/Глава_${chapterNum}_${cleanChapterName}.md`;
            const dup = plugin.app.vault.getAbstractFileByPath(underscoreVariant);
            if (dup && dup instanceof TFile) {
                await plugin.app.vault.delete(dup);
                plugin.logDebug('Удалён дублирующий файл главы: ' + underscoreVariant);
            }
        } catch (e) { /* ignore */ }
        new Notice(`Создана глава: ${fileName}`);
    } catch (error) {
        new Notice('Ошибка при создании главы: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createChapter };
