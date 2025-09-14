/**
 * @file       createScene.js
 * @description Функция создания сцены для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, SceneWizardModal.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание сцены
 */
var createScene = async function(plugin, startPath = '') {
    // Вспомогательная функция для безопасного логирования
    function logDebugSafe(...args) {
        try { console.log('[createScene]', ...args); } catch (_) {}
    }
    
    try {
        logDebugSafe('=== createScene вызвана ===');
        logDebugSafe('startPath: ' + startPath);
        // Используем резолвер контекста из настроек
        let projectRoot = '';
        let currentWork = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
            projectRoot = ctx.projectRoot || '';
            currentWork = ctx.workName || '';
        }
        
        // Fallback: старый способ
        if (!projectRoot && startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        }
        
        // Fallback для определения произведения
        if (!currentWork) {
            const activeFile = plugin.app.workspace.getActiveFile();
            const path = activeFile ? activeFile.path : startPath;
            if (path) {
                // Проверяем, находится ли путь внутри папки произведения
                const m = path.match(/(^|\/)1_Рукопись\/Произведения\/([^\/]+)\//);
                if (m && m[2]) {
                    currentWork = m[2];
                    logDebugSafe('Определено произведение из пути: ' + currentWork);
                }
            }
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
                // new Notice('Проекты не найдены!'); // Удален дублирующий Notice
                logDebugSafe('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;

        }
        logDebugSafe('project: ' + project);
        logDebugSafe('currentWork: ' + currentWork);
        logDebugSafe('[createScene] projectRoot: ' + (projectRoot || '(empty)'));
        logDebugSafe('[createScene] startPath: ' + (startPath || '(empty)'));
        // --- Автозаполнение ---
        // 1. Сюжетные линии (глобальные и локальные по произведениям)
        let plotLinesList = [];
        try {
            const parsePlotLines = (content) => {
                const lines = content.split('\n');
                const result = [];
                let currentTheme = null;
                const headerRe = /^#+\s*Тема\s*(\d+)\s*[-–—]\s*(.+)$/i;
                for (let i = 0; i < lines.length; i++) {
                    const raw = lines[i];
                    const line = raw.trim();
                    const h = line.match(headerRe);
                    if (h) {
                        if (currentTheme) {
                            result.push(currentTheme);
                        }
                        currentTheme = { id: h[1], name: h[2], description: '' };
                        continue;
                    }
                    if (currentTheme) {
                        if (line.startsWith('Описание:')) {
                            currentTheme.description = line.replace('Описание:', '').trim();
                            continue;
                        }
                        // возьмем первое непустое как краткое описание, если явного нет
                        if (!currentTheme.description && line.length > 0 && !line.startsWith('>')) {
                            currentTheme.description = line;
                        }
                    }
                }
                if (currentTheme) result.push(currentTheme);
                return result;
            };

            plotLinesList = [];
            // Глобальные
            try {
                const globalPath = `${project}/Сюжетные_линии.md`;
                const gf = plugin.app.vault.getAbstractFileByPath(globalPath);
                if (gf) {
                    const content = await plugin.app.vault.read(gf);
                    const items = parsePlotLines(content);
                    logDebugSafe(`[createScene] global plotlines from ${globalPath}: ${items.length}`);
                    plotLinesList.push(...items.map(p => ({ ...p, scope: 'global' })));
                }
            } catch (_) {}

            // Локальные по всем произведениям
            try {
                const worksRoot = `${project}/1_Рукопись/Произведения`;
                const worksFolder = plugin.app.vault.getAbstractFileByPath(worksRoot);
                if (worksFolder && worksFolder.children) {
                    for (const workDir of worksFolder.children) {
                        const isFolder = !!(workDir && workDir.children);
                        if (!isFolder) continue;
                        const localPath = `${workDir.path}/Сюжетные_линии.md`;
                        const lf = plugin.app.vault.getAbstractFileByPath(localPath);
                        if (lf) {
                            let content = await plugin.app.vault.read(lf);
                            let items = parsePlotLines(content);
                            // Если тем нет — автоматически создадим стартовые три
                            if (!items || items.length === 0) {
                                const starter = `\n## Тема1 - Основной конфликт\nОписание: Главный конфликт произведения, вокруг которого строится сюжет.\n\n## Тема2 - Романтическая линия\nОписание: Развитие отношений между главными персонажами.\n\n## Тема3 - Семейные отношения\nОписание: Взаимоотношения в семье главного героя.\n`;
                                try {
                                    await plugin.app.vault.modify(lf, content + starter);
                                    content = await plugin.app.vault.read(lf);
                                    items = parsePlotLines(content);
                                    logDebugSafe(`[createScene] starter plotlines added to ${localPath}`);
                                } catch (e) {
                                    logDebugSafe(`[createScene] failed to add starter plotlines: ${e.message}`);
                                }
                            }
                            logDebugSafe(`[createScene] local plotlines from ${localPath}: ${items.length}`);
                            plotLinesList.push(...items.map(p => ({ ...p, scope: 'local', work: workDir.name })));
                        }
                    }
                }
            } catch (_) {}

            // Удалим дубликаты по комбинации id+name+scope
            const seen = new Set();
            plotLinesList = plotLinesList.filter(p => {
                const key = `${p.scope || 'global'}:${p.id}:${p.name}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            logDebugSafe('[createScene] plotLinesList total: ' + plotLinesList.length);
            if (plotLinesList.length > 0) {
                const sample = plotLinesList.slice(0, 3).map(p => `${p.scope}:${p.id}:${p.name}`).join(' | ');
                logDebugSafe('[createScene] sample plotlines: ' + sample);
            }
        } catch (e) { plotLinesList = []; }
        // 2. Персонажи
        let charactersList = [];
        try {
            const charsFolder = `${project}/Персонажи`;
            logDebugSafe('charsFolder: ' + charsFolder);
            const folder = plugin.app.vault.getAbstractFileByPath(charsFolder);
            logDebugSafe('folder found: ' + (folder ? 'YES' : 'NO'));
            if (folder && folder.children) {
                charactersList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                logDebugSafe('charactersList: ' + charactersList.join(', '));
            } else {
                charactersList = [];
                logDebugSafe('No characters folder or no children');
            }
        } catch (e) { 
            charactersList = []; 
            logDebugSafe('Error loading characters: ' + e.message);
        }
        // 3. Локации
        let locationsList = [];
        try {
            const locsFolder = `${project}/Локации`;
            logDebugSafe('locsFolder: ' + locsFolder);
            const folder = plugin.app.vault.getAbstractFileByPath(locsFolder);
            logDebugSafe('folder found: ' + (folder ? 'YES' : 'NO'));
            if (folder && folder.children) {
                locationsList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                logDebugSafe('locationsList: ' + locationsList.join(', '));
            } else {
                locationsList = [];
                logDebugSafe('No locations folder or no children');
            }
        } catch (e) { 
            locationsList = []; 
            logDebugSafe('Error loading locations: ' + e.message);
        }
        
        // 4. Главы (для выбора существующей главы)
        // Пытаемся вычислить принудительный контекст из startPath/активного файла:
        // - forcedWork: произведение
        // - forcedChapterNum: номер главы (NNN) если находимся внутри конкретной главы
        let forcedWork = currentWork || ''; // Используем определённое произведение как приоритет
        let forcedChapterNum = '';
        try {
            const active = plugin.app.workspace.getActiveFile();
            const ctxPath = (startPath && startPath.trim()) ? startPath : (active ? active.path : '');
            if (ctxPath) {
                // Ветка: конкретная глава
                const mChapter = ctxPath.match(/\/(?:1_Рукопись\/Произведения\/([^\/]+)\/Главы\/Глава_(\d{3})[_-]|1_Рукопись\/Главы\/Глава_(\d{3})[_-])/);
                if (mChapter) {
                    if (mChapter[1]) forcedWork = mChapter[1];
                    forcedChapterNum = (mChapter[2] || mChapter[3] || '').trim();
                } else if (!forcedWork) {
                    // Ветка: в пределах произведения (только если forcedWork ещё не определён)
                    const mWork = ctxPath.match(/\/1_Рукопись\/Произведения\/([^\/]+)\//);
                    if (mWork && mWork[1]) forcedWork = mWork[1];
                }
            }
            logDebugSafe(`[createScene] forcedWork=${forcedWork || '(none)'} forcedChapterNum=${forcedChapterNum || '(none)'}`);
        } catch (e) {
            logDebugSafe('[createScene] forced context parse error: ' + e.message);
        }
        let chapterChoices = [];
        try {
            const collectChaptersFrom = (folderPath, decorateNameCb) => {
                try { console.log('[createScene] scan', folderPath); } catch (_) {}
                logDebugSafe('[createScene] Scan chapters in: ' + folderPath);
                const result = [];
                const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
                if (folder && folder.children) {
                    try { console.log('[createScene] children count =', folder.children.length); } catch (_) {}
                    logDebugSafe('[createScene] Found folder, children count: ' + folder.children.length);
                    folder.children.forEach(ch => {
                        const isFolder = !!(ch && ch.children);
                        if (isFolder && ch.name && ch.name.startsWith('Глава_')) {
                            const match = ch.name.match(/^Глава_(\d+)[_-]?(.+)?$/);
                            const baseName = match && match[2] ? match[2].replace(/_/g, ' ') : ch.name;
                            result.push({
                                num: match ? match[1] : ch.name,
                                name: decorateNameCb ? decorateNameCb(baseName) : baseName,
                                path: ch.path
                            });
                            try { console.log('[createScene] chapter found', result[result.length-1]); } catch (_) {}
                            logDebugSafe('[createScene] Chapter found: ' + JSON.stringify(result[result.length-1]));
                        }
                    });
                    try { console.log('[createScene] chapters from folder =', result.length); } catch (_) {}
                    logDebugSafe('[createScene] Chapters collected from folder: ' + result.length);
                }
                return result;
            };

            if (forcedChapterNum) {
                // Жёстко ограничиваемся текущей главой
                const baseFolder = forcedWork ? `${project}/1_Рукопись/Произведения/${forcedWork}/Главы` : `${project}/1_Рукопись/Главы`;
                const onlyThis = collectChaptersFrom(baseFolder);
                chapterChoices = onlyThis.filter(ch => ch.num === forcedChapterNum);
            } else if (forcedWork) {
                // Только главы выбранного произведения
                const workChapters = `${project}/1_Рукопись/Произведения/${forcedWork}/Главы`;
                const decorated = collectChaptersFrom(workChapters, (base) => `${base} (Произведение: ${forcedWork})`);
                chapterChoices = decorated;
            } else {
                // Главы без привязки к произведению
                const commonChaptersFolder = `${project}/1_Рукопись/Главы`;
                chapterChoices = chapterChoices.concat(collectChaptersFrom(commonChaptersFolder));

                // Главы внутри произведений
                const worksRoot = `${project}/1_Рукопись/Произведения`;
                const worksFolder = plugin.app.vault.getAbstractFileByPath(worksRoot);
                logDebugSafe('[createScene] Works root: ' + worksRoot + ', exists: ' + (worksFolder ? 'YES' : 'NO'));
                if (worksFolder && worksFolder.children) {
                    worksFolder.children.forEach(workDir => {
                        const isFolder = !!(workDir && workDir.children);
                        if (isFolder) {
                            const workChapters = `${workDir.path}/Главы`;
                            logDebugSafe('[createScene] Scan work chapters: ' + workChapters);
                            const decorated = collectChaptersFrom(workChapters, (base) => `${base} (Произведение: ${workDir.name})`);
                            chapterChoices = chapterChoices.concat(decorated);
                            logDebugSafe('[createScene] Added ' + decorated.length + ' chapters from work: ' + workDir.name);
                        }
                    });
                }
            }

            // Лог для отладки
            logDebugSafe('chapterChoices: ' + JSON.stringify(chapterChoices));
        } catch (e) {
            chapterChoices = [];
            logDebugSafe('Error loading chapters: ' + e.message);
        }

        // Если глав нет — предложить создать
        if (!chapterChoices || chapterChoices.length === 0) {
            // new Notice('Главы не найдены. Создайте главу — откроется мастер.'); // Удален дублирующий Notice
            logDebugSafe('[createScene] No chapters found. Trigger createChapter...');
            try {
                await window.createChapter(plugin, project);
                logDebugSafe('[createScene] createChapter finished');
            } catch (e) {
                logDebugSafe('Error auto-creating chapter: ' + e.message);
            }
            // Повторно собрать список после попытки создания (и в общих, и в произведениях)
            try {
                const refreshed = [];
                const collectChaptersFrom = (folderPath, decorateNameCb) => {
                    logDebugSafe('[createScene] Refresh scan: ' + folderPath);
                    const result = [];
                    const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
                    if (folder && folder.children) {
                        logDebugSafe('[createScene] Refresh folder children: ' + folder.children.length);
                        folder.children.forEach(ch => {
                            const isFolder = !!(ch && ch.children);
                            if (isFolder && ch.name && ch.name.startsWith('Глава_')) {
                                const match = ch.name.match(/^Глава_(\d+)[_-]?(.+)?$/);
                                const baseName = match && match[2] ? match[2].replace(/_/g, ' ') : ch.name;
                                result.push({
                                    num: match ? match[1] : ch.name,
                                    name: decorateNameCb ? decorateNameCb(baseName) : baseName,
                                    path: ch.path
                                });
                                logDebugSafe('[createScene] Refresh chapter found: ' + JSON.stringify(result[result.length-1]));
                            }
                        });
                    }
                    return result;
                };

                if (forcedChapterNum) {
                    const baseFolder = forcedWork ? `${project}/1_Рукопись/Произведения/${forcedWork}/Главы` : `${project}/1_Рукопись/Главы`;
                    refreshed.push(...collectChaptersFrom(baseFolder));
                    chapterChoices = refreshed.filter(ch => ch.num === forcedChapterNum);
                } else if (forcedWork) {
                    const workChapters = `${project}/1_Рукопись/Произведения/${forcedWork}/Главы`;
                    refreshed.push(...collectChaptersFrom(workChapters, (base) => `${base} (Произведение: ${forcedWork})`));
                    chapterChoices = refreshed;
                } else {
                    // Общие главы
                    refreshed.push(...collectChaptersFrom(`${project}/1_Рукопись/Главы`));
                    // Главы произведений
                    const worksRoot = `${project}/1_Рукопись/Произведения`;
                    const worksFolder = plugin.app.vault.getAbstractFileByPath(worksRoot);
                    if (worksFolder && worksFolder.children) {
                        worksFolder.children.forEach(workDir => {
                            const isFolder = !!(workDir && workDir.children);
                            if (isFolder) {
                                const workChapters = `${workDir.path}/Главы`;
                                refreshed.push(...collectChaptersFrom(workChapters, (base) => `${base} (Произведение: ${workDir.name})`));
                            }
                        });
                    }
                    chapterChoices = refreshed;
                }
                logDebugSafe('[createScene] Refreshed chapterChoices length: ' + chapterChoices.length);
            } catch (e) {
                logDebugSafe('Error refreshing chapters after create: ' + e.message);
            }
            if (!chapterChoices || chapterChoices.length === 0) {
                // new Notice('Сцена не может быть создана: главы по-прежнему не найдены.'); // Удален дублирующий Notice
                logDebugSafe('[createScene] Still no chapters after refresh. Abort.');
                return;
            }
        }

        // --- Запуск SceneWizardModal ---
        // Определяем проект и последнюю выбранную главу для преселекта
        const projectName = project.split('/').pop();
        const defaultChapterNum = (plugin.settings && plugin.settings.sceneDefaultChapterByProject && plugin.settings.sceneDefaultChapterByProject[projectName]) || '';

        const modal = new SceneWizardModal(
            plugin.app,
            Modal,
            Setting,
            Notice,
            { plotLinesList, charactersList, locationsList, chapterChoices, defaultChapterNum },
            async (sceneData) => {
            // После завершения мастера — создать файл сцены по шаблону
            const plotLinesLines = sceneData.plotLines.map(line => `"${line.line}"`).join(', ');
            const plotLinesDegree = sceneData.plotLines.map(line => `"${line.degree}"`).join(', ');
            const plotLinesDescription = sceneData.plotLines.map(line => `"${line.description}"`).join(', ');
            const plotLinesFileRel = `${project.split('/').pop()}/Сюжетные_линии.md`;
            const plotLinesSection = sceneData.plotLines.length > 0
                ? sceneData.plotLines.map(plotLine => `- **[[${plotLinesFileRel}#Тема${plotLine.id} - ${plotLine.line}|${plotLine.line}]]** (${plotLine.degree}): ${plotLine.description}`).join('\n')
                : '- Нет выбранных сюжетных линий';
            const characterTags = sceneData.characters.map(c => `"${c}"`).join(', ');
            const locationTags = sceneData.locations.map(l => `"${l}"`).join(', ');
            const charactersSection = sceneData.characters.length > 0 ? sceneData.characters.map(c => `[[${c}]]`).join(', ') : 'Не указаны';
            const locationsSection = sceneData.locations.length > 0 ? sceneData.locations.map(l => `[[${l}]]`).join(', ') : 'Не указаны';
            const tags = sceneData.tags.join(', ');
            
            // --- Генерация имени и пути ---
            // Найти выбранную главу в chapterChoices (используем chapterChoices из замыкания, а не this)
            logDebugSafe('[createScene] sceneData.chapterNum: ' + sceneData.chapterNum + ', sceneData.sceneName: ' + sceneData.sceneName);
            const selectedChapter = chapterChoices.find(ch => ch.num === sceneData.chapterNum);
            logDebugSafe('selectedChapter: ' + JSON.stringify(selectedChapter));
            if (!selectedChapter || !selectedChapter.path) {
                // new Notice('Ошибка: не удалось найти папку выбранной главы!'); // Удален дублирующий Notice
                logDebugSafe('Ошибка: не удалось найти папку выбранной главы!');
                return;
            }
            const chapterFolderPath = selectedChapter.path;
            logDebugSafe('chapterFolderPath: ' + chapterFolderPath);
            
            // Проверяем, существует ли папка главы
            const chapterFolder = plugin.app.vault.getAbstractFileByPath(chapterFolderPath);
            logDebugSafe('chapterFolder exists: ' + (chapterFolder ? 'YES' : 'NO'));
            if (!chapterFolder) {
                // new Notice('Ошибка: папка главы не найдена!'); // Удален дублирующий Notice
                logDebugSafe('Ошибка: папка главы не найдена!');
                return;
            }
            
            // --- Автоинкремент номера сцены внутри выбранной главы ---
            let nextSceneNumber = 1;
            try {
                const children = (chapterFolder && chapterFolder.children) ? chapterFolder.children : [];
                const existingNums = [];
                children.forEach(chFile => {
                    try {
                        if (chFile instanceof TFile && chFile.extension === 'md') {
                            const m = chFile.name.match(/^Сцена_(\d{2})_/);
                            if (m && m[1]) {
                                const n = parseInt(m[1], 10);
                                if (!Number.isNaN(n)) existingNums.push(n);
                            }
                        }
                    } catch (_) {}
                });
                if (existingNums.length > 0) {
                    nextSceneNumber = Math.max(...existingNums) + 1;
                }
            } catch (e) {
                logDebugSafe('[createScene] scan existing scenes error: ' + e.message);
            }

            // Формируем имя файла и проверяем коллизии: если занято — инкрементируем дальше
            const cleanSceneName = sceneData.sceneName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            let sceneNum = String(nextSceneNumber).padStart(2, '0');
            let fileName = `Сцена_${sceneNum}_${cleanSceneName}`;
            let targetPath = `${chapterFolderPath}/${fileName}.md`;
            let guard = 0;
            while (plugin.app.vault.getAbstractFileByPath(targetPath) && guard < 100) {
                nextSceneNumber += 1;
                sceneNum = String(nextSceneNumber).padStart(2, '0');
                fileName = `Сцена_${sceneNum}_${cleanSceneName}`;
                targetPath = `${chapterFolderPath}/${fileName}.md`;
                guard += 1;
            }
            logDebugSafe('[createScene] computed sceneNum=' + sceneNum + ', targetPath: ' + targetPath);
            
            // --- Формируем данные для шаблона ---
            // Определяем произведение по пути главы (если есть)
            const workMatch = chapterFolderPath.match(/\/Произведения\/([^\/]+)\/Главы/);
            const workName = workMatch ? workMatch[1] : '';
            logDebugSafe('[createScene] workName resolved: ' + (workName || '(none)'));

            // Наследуем default_* из фронтматтера главы
            let inheritedCharacters = [];
            let inheritedLocations = [];
            try {
                const chapterIndexFile = plugin.app.vault.getAbstractFileByPath(chapterFolderPath);
                if (chapterIndexFile && chapterIndexFile.children) {
                    // Ищем главный файл главы (Глава_NNN-*.md)
                    const idx = chapterIndexFile.children.find(f => f instanceof TFile && /^Глава_\d{3}-/.test(f.name));
                    if (idx) {
                        const fm = plugin.app.metadataCache.getFileCache(idx)?.frontmatter || {};
                        if (Array.isArray(fm.default_characters)) inheritedCharacters = fm.default_characters;
                        if (Array.isArray(fm.default_locations)) inheritedLocations = fm.default_locations;
                    }
                }
            } catch (e) { logDebugSafe('[createScene] inherit defaults error: ' + e.message); }

            // Сливаем без дублей
            const mergedCharacterTags = Array.from(new Set([...(inheritedCharacters || []).map(c => `"${c}"`), ...sceneData.characters.map(c => `"${c}"`)].filter(Boolean))).join(', ');
            const mergedLocationTags = Array.from(new Set([...(inheritedLocations || []).map(l => `"${l}"`), ...sceneData.locations.map(l => `"${l}"`)].filter(Boolean))).join(', ');
            const mergedCharactersSection = (inheritedCharacters || []).concat(sceneData.characters || []).filter(Boolean).map(c => `[[${c}]]`).join(', ') || 'Не указаны';
            const mergedLocationsSection = (inheritedLocations || []).concat(sceneData.locations || []).filter(Boolean).map(l => `[[${l}]]`).join(', ') || 'Не указаны';
            const data = {
                ...sceneData,
                projectRoot: projectRoot,
                sceneNum: sceneNum,
                chapterNum: selectedChapter.num,
                chapterName: selectedChapter.name,
                workName: workName,
                cleanSceneName: cleanSceneName,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                projectName: project.split('/').pop(),
                plotLinesLines: plotLinesLines,
                plotLinesDegree: plotLinesDegree,
                plotLinesDescription: plotLinesDescription,
                plotLinesSection: plotLinesSection,
                characterTags: mergedCharacterTags,
                locationTags: mergedLocationTags,
                charactersSection: mergedCharactersSection,
                locationsSection: mergedLocationsSection,
                tags: tags
            };
            logDebugSafe('data for template: ' + JSON.stringify(data));

            // --- Генерируем контент из шаблона (как в других мастерах) ---
            logDebugSafe('Reading template via plugin.readTemplateFile...');
            let templateContent = '';
            try {
                if (typeof plugin.readTemplateFile === 'function') {
                    templateContent = await plugin.readTemplateFile('Новая_сцена');
                }
            } catch (e) {
                logDebugSafe('readTemplateFile error: ' + e.message);
            }
            if (!templateContent) {
                // new Notice('Шаблон "Новая_сцена.md" не найден в templates'); // Удален дублирующий Notice
                logDebugSafe('Template Новая_сцена not found');
                return;
            }
            const fillFn = (typeof window !== 'undefined' && typeof window.fillTemplate === 'function')
                ? window.fillTemplate
                : ((typeof globalThis !== 'undefined' && typeof globalThis.fillTemplate === 'function') ? globalThis.fillTemplate : null);
            if (!fillFn) {
                // new Notice('Ошибка: функция заполнения шаблона недоступна'); // Удален дублирующий Notice
                logDebugSafe('fillTemplate not available');
                return;
            }
            const content = await fillFn(templateContent, data);
            logDebugSafe('Content generated, length: ' + content.length);
            logDebugSafe('Content preview: ' + content.substring(0, 200) + '...');
            
            // Сохраняем только в существующей папке главы
            logDebugSafe('Creating file...');
            try {
                const safeCreate = (typeof window !== 'undefined' && typeof window.safeCreateFile === 'function')
                    ? window.safeCreateFile
                    : (typeof safeCreateFile === 'function' ? safeCreateFile : null);
                if (!safeCreate) {
                    // new Notice('Ошибка: функция сохранения файла недоступна'); // Удален дублирующий Notice
                    logDebugSafe('safeCreateFile not available');
                    return;
                }
                const createdFile = await safeCreate(targetPath, content, plugin.app);
                logDebugSafe('File created successfully: ' + (createdFile ? 'YES' : 'NO'));
                logDebugSafe('Created file path: ' + targetPath);

                // Сохраняем выбранную главу как дефолтную для проекта
                try {
                    plugin.settings = plugin.settings || {};
                    plugin.settings.sceneDefaultChapterByProject = plugin.settings.sceneDefaultChapterByProject || {};
                    plugin.settings.sceneDefaultChapterByProject[projectName] = selectedChapter.num;
                    if (typeof plugin.saveSettings === 'function') {
                        await plugin.saveSettings();
                    }
                } catch (e) {
                    logDebugSafe('Failed to save default chapter: ' + e.message);
                }
                
                if (createdFile instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(createdFile);
                    logDebugSafe('File opened in workspace');
            }
            new Notice(`Сцена создана: ${fileName}`);
            } catch (createError) {
                logDebugSafe('Error creating file: ' + createError.message);
                console.error('[createScene] Ошибка при создании файла:', createError.message);
            }
        },
        plugin);
        modal.open();
    } catch (error) {
        console.error('[createScene] Ошибка при создании сцены:', error.message);
        logDebugSafe('Ошибка: ' + error.message);
    }
};

module.exports = { createScene };
