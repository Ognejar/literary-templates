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
var createChapter = async function(plugin, projectRoot, options = {}) {
    try {
        await plugin.logDebug('=== createChapter вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);
        // 1. Найти projectRoot от startPath
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
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
                await plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;

        }
        await plugin.logDebug('project: ' + project);
        const projectName = project.split('/').pop();
        const chaptersFolder = `${project}/Главы`;
        await plugin.app.vault.createFolder(chaptersFolder).catch(()=>{});

        // 2. Генерация номера главы
        const chapterFiles = plugin.app.vault.getMarkdownFiles();
        let nextNum = 1;
        let chapterExists = true;
        while (chapterExists) {
            const testNum = nextNum.toString().padStart(3, '0');
            const prefix = `${chaptersFolder}/Глава_${testNum}_`;
            const found = chapterFiles.find(f => f.path.startsWith(prefix));
            if (!found) {
                chapterExists = false;
            } else {
                nextNum++;
            }
        }
        const chapterNum = nextNum.toString().padStart(3, '0');
        await plugin.logDebug('chapterNum: ' + chapterNum);

        // 3. Запрос названия главы
        const chapterName = await plugin.prompt('Название главы:');
        if (!chapterName) return;
        const cleanChapterName = chapterName.trim().replace(/\s+/g, '_').replace(/[^а-яА-ЯёЁ\w\s-.]/g, '');
        await plugin.logDebug('chapterName: ' + chapterName);
        await plugin.logDebug('cleanChapterName: ' + cleanChapterName);
        const chapterFolderPath = `${chaptersFolder}/Глава_${chapterNum}_${cleanChapterName}`;
        await plugin.app.vault.createFolder(chapterFolderPath).catch(()=>{});
        await plugin.logDebug('chapterFolderPath: ' + chapterFolderPath);

        // 4. Чтение и парсинг сюжетных линий
        const plotLinesFile = `${project}/Сюжетные_линии.md`;
        let plotLines = [];
        let plotLinesContent = '';
        try {
            plotLinesContent = await plugin.app.vault.adapter.read(plotLinesFile);
        } catch {
            plotLinesContent = '';
        }
        const lines = plotLinesContent.split('\n');
        let currentTheme = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('## Тема')) {
                const match = line.match(/## Тема(\d+) - (.+)/);
                if (match) {
                    currentTheme = {
                        id: match[1],
                        name: match[2],
                        description: ''
                    };
                }
            } else if (line.startsWith('Описание:') && currentTheme) {
                currentTheme.description = line.replace('Описание:', '').trim();
                plotLines.push(currentTheme);
                currentTheme = null;
            }
        }

        // 5. Выбор сюжетных линий
        const degrees = [
            { name: 'Прямая', value: 'прямая' },
            { name: 'Связанная', value: 'связанная' },
            { name: 'Фоновая', value: 'фоновая' }
        ];
        const selectedPlotLines = [];
        const plotLineChoices = plotLines.map(line => `${line.name} - ${line.description}`);
        let addMore = true;
        while (addMore && plotLines.length > 0) {
            const idx = await plugin.suggester(plotLineChoices, plotLineChoices, 'Выберите сюжетную линию (или Esc для завершения)');
            if (idx === null) {
                addMore = false;
            } else {
                const selectedLine = plotLines[idx];
                const degree = await plugin.suggester(degrees.map(d => d.name), degrees.map(d => d.value), 'Выберите степень участия:');
                if (degree) {
                    selectedPlotLines.push({
                        theme: selectedLine.name,
                        degree: degree
                    });
                }
            }
        }

        // 6. Формируем данные для шаблона
        const data = {
            chapterName: chapterName,
            cleanChapterName: cleanChapterName,
            chapterNum: chapterNum,
            projectName: projectName,
            plotLines: selectedPlotLines,
            date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)
        };

        // 7. Генерируем контент из шаблона
        const content = await generateFromTemplate('Новая_глава', data, plugin);
        
        const fileName = `Глава_${chapterNum}-${cleanChapterName}`;
        const targetPath = `${chapterFolderPath}/${fileName}.md`;
                    await safeCreateFile(targetPath, content, plugin.app);

            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
        }
        new Notice(`Создана глава: ${fileName}`);
    } catch (error) {
        new Notice('Ошибка при создании главы: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createChapter };
