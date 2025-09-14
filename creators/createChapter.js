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
        plugin.logDebug('=== createChapter вызвана === ' + new Date().toISOString());
        if (window._chapterCreateCallCount === undefined) window._chapterCreateCallCount = 0;
        window._chapterCreateCallCount++;
        plugin.logDebug('createChapter вызван раз: ' + window._chapterCreateCallCount);
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
        if (!projectRoot || !currentWork) {
            try {
                if (startPath) projectRoot = findProjectRoot(plugin.app, startPath) || '';
                if (!projectRoot) {
                    const activeFile = plugin.app.workspace.getActiveFile();
                    const parent = activeFile && activeFile.parent ? activeFile.parent.path : '';
                    if (parent) projectRoot = findProjectRoot(plugin.app, parent) || '';
                }
                
                // Определяем произведение из активного файла или стартового пути
                if (!currentWork) {
                    plugin.logDebug('currentWork не определён, пробуем fallback логику');
                    const activeFile = plugin.app.workspace.getActiveFile();
                    const path = activeFile ? activeFile.path : startPath;
                    plugin.logDebug('activeFile: ' + (activeFile ? activeFile.path : 'null'));
                    plugin.logDebug('startPath: ' + startPath);
                    plugin.logDebug('path для анализа: ' + path);
                    if (path) {
                        // Проверяем, находится ли путь внутри папки произведения
                        const m = path.match(/(^|\/)1_Рукопись\/Произведения\/([^\/]+)\//);
                        plugin.logDebug('regex match: ' + (m ? JSON.stringify(m) : 'null'));
                        if (m && m[2]) {
                            currentWork = m[2];
                            plugin.logDebug('Определено произведение из пути: ' + currentWork);
                        } else {
                            plugin.logDebug('Произведение не найдено в пути');
                        }
                    } else {
                        plugin.logDebug('path пуст, произведение не определено');
                    }
                } else {
                    plugin.logDebug('currentWork уже определён: ' + currentWork);
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
        plugin.logDebug('currentWork: ' + currentWork);
        plugin.logDebug('startPath: ' + startPath);
        const projectName = project.split('/').pop();
        let chaptersFolder = '';
        let chosenWork = currentWork || '';
        // --- Новый блок: определяем папку главы ДО выбора scope ---
        // Получаем список произведений
        const worksRoot = `${project}/1_Рукопись/Произведения`;
        let workChoices = [];
        try {
            const folder = plugin.app.vault.getAbstractFileByPath(worksRoot);
            if (folder && folder.children) {
                workChoices = folder.children.filter(ch => ch && ch.children).map(ch => ch.name);
            }
        } catch (e) {}
        // Если произведение не определено или не найдено в списке — спрашиваем у пользователя
        if (!chosenWork || (workChoices.length > 0 && !workChoices.includes(chosenWork))) {
            if (workChoices.length > 0) {
                plugin.logDebug('Произведение не определено, запрашиваем у пользователя');
                chosenWork = await plugin.suggester(workChoices, workChoices, 'Выберите произведение для новой главы (или Esc для создания в корне)');
            }
        }
        if (chosenWork) {
            chaptersFolder = `${project}/1_Рукопись/Произведения/${chosenWork}/Главы`;
            plugin.logDebug('Глава будет создана в папке произведения: ' + chaptersFolder);
        } else {
            chaptersFolder = `${project}/1_Рукопись/Главы`;
            plugin.logDebug('Глава будет создана в корневой папке: ' + chaptersFolder);
        }
        await plugin.app.vault.createFolder(chaptersFolder).catch(()=>{});

        // Генерация номера главы внутри выбранной папки
        const allFiles = plugin.app.vault.getFiles();
        let nextNum = 1;
        while (true) {
            const test = nextNum.toString().padStart(3, '0');
            const hasFilesWithNumber = allFiles.some(f => {
                const path = f.path;
                return path.startsWith(chaptersFolder) && 
                       (path.includes(`Глава_${test}_`) || path.includes(`Глава_${test}-`));
            });
            if (!hasFilesWithNumber) break;
            nextNum++;
        }
        const chapterNum = nextNum.toString().padStart(3, '0');
        plugin.logDebug('chapterNum: ' + chapterNum);
        plugin.logDebug('chaptersFolder: ' + chaptersFolder);

        // Запрос названия главы
        const chapterName = await plugin.prompt('Название главы:');
        if (!chapterName) return;
        const cleanChapterName = chapterName.trim().replace(/\s+/g, '_').replace(/[^а-яА-ЯёЁ\w\s-.]/g, '');
        plugin.logDebug('chapterName: ' + chapterName);
        plugin.logDebug('cleanChapterName: ' + cleanChapterName);
        const chapterFolderPath = `${chaptersFolder}/Глава_${chapterNum}-${cleanChapterName}`;
        await plugin.app.vault.createFolder(chapterFolderPath).catch(()=>{});
        plugin.logDebug('chapterFolderPath: ' + chapterFolderPath);

        // Формируем данные для шаблона
        const data = {
            chapterName: chapterName,
            cleanChapterName: cleanChapterName,
            chapterNum: chapterNum,
            projectName: projectName,
            workName: chosenWork || '',
            plotLines: [], // Больше не подставляем автоматически
            characterTags: '',
            locationTags: '',
            date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)
        };

        // Генерируем контент из шаблона
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
        plugin.logDebug('Попытка создать файл: ' + targetPath);
        // Перебор файлов в папке главы и логирование
        const folder = plugin.app.vault.getAbstractFileByPath(chapterFolderPath);
        let foundFile = null;
        if (folder && folder.children) {
            for (const child of folder.children) {
                plugin.logDebug(`В папке главы найден файл: ${child.name} (${child.path})`);
                if (child.name === fileName + '.md') {
                    foundFile = child;
                    break;
                }
            }
        }
        if (foundFile) {
            plugin.logDebug(`Файл найден: ${foundFile.path}, перезаписываем содержимое.`);
            await plugin.app.vault.modify(foundFile, content);
            await plugin.app.workspace.getLeaf().openFile(foundFile);
            new Notice(`Глава обновлена: ${fileName}`);
            return;
        } else {
            plugin.logDebug(`Файл не найден, создаём новый: ${targetPath}`);
            const createdFile = await safeCreateFile(targetPath, content, plugin.app);
            plugin.logDebug('Результат safeCreateFile: ' + (createdFile ? 'успех' : 'уже существует'));
            if (createdFile) {
                await plugin.app.workspace.getLeaf().openFile(createdFile);
                new Notice(`Глава создана: ${fileName}`);
            } else {
                plugin.logError(`Ошибка создания главы: ${fileName}`);
            }
            return;
        }
    } catch (error) {
        new Notice('Ошибка при создании главы: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createChapter };
