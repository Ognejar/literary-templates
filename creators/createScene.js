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
    try {
        plugin.logDebug('=== createScene вызвана ===');
        plugin.logDebug('startPath: ' + startPath);
        // Используем резолвер контекста из настроек
        let projectRoot = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
            projectRoot = ctx.projectRoot || '';
        }
        
        // Fallback: старый способ
        if (!projectRoot && startPath) {
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
                plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;

        }
        plugin.logDebug('project: ' + project);
        // --- Автозаполнение ---
        // 1. Сюжетные линии
        let plotLinesList = [];
        try {
            const plotLinesFile = `${project}/Сюжетные_линии.md`;
            const file = plugin.app.vault.getAbstractFileByPath(plotLinesFile);
            if (file) {
                const content = await plugin.app.vault.read(file);
                const lines = content.split('\n');
                let currentTheme = null;
                plotLinesList = [];
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
                        plotLinesList.push(currentTheme);
                        currentTheme = null;
                    }
                }
            }
        } catch (e) { plotLinesList = []; }
        // 2. Персонажи
        let charactersList = [];
        try {
            const charsFolder = `${project}/Персонажи`;
            plugin.logDebug('charsFolder: ' + charsFolder);
            const folder = plugin.app.vault.getAbstractFileByPath(charsFolder);
            plugin.logDebug('folder found: ' + (folder ? 'YES' : 'NO'));
            if (folder && folder.children) {
                charactersList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                plugin.logDebug('charactersList: ' + charactersList.join(', '));
            } else {
                charactersList = [];
                plugin.logDebug('No characters folder or no children');
            }
        } catch (e) { 
            charactersList = []; 
            plugin.logDebug('Error loading characters: ' + e.message);
        }
        // 3. Локации
        let locationsList = [];
        try {
            const locsFolder = `${project}/Локации`;
            plugin.logDebug('locsFolder: ' + locsFolder);
            const folder = plugin.app.vault.getAbstractFileByPath(locsFolder);
            plugin.logDebug('folder found: ' + (folder ? 'YES' : 'NO'));
            if (folder && folder.children) {
                locationsList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                plugin.logDebug('locationsList: ' + locationsList.join(', '));
            } else {
                locationsList = [];
                plugin.logDebug('No locations folder or no children');
            }
        } catch (e) { 
            locationsList = []; 
            plugin.logDebug('Error loading locations: ' + e.message);
        }
        
        // 4. Главы (для выбора существующей главы)
        let chapterChoices = [];
        try {
            const chaptersFolder = `${project}/Главы`;
            const folder = plugin.app.vault.getAbstractFileByPath(chaptersFolder);
            if (folder && folder.children) {
                chapterChoices = folder.children
                    .filter(f => f instanceof TFolder && f.name.startsWith('Глава_'))
                    .map(f => {
                        const match = f.name.match(/^Глава_(\d+)_?(.+)?$/);
                        return {
                            num: match ? match[1] : f.name,
                            name: match && match[2] ? match[2].replace(/_/g, ' ') : f.name,
                            path: f.path // <--- добавлено!
                        };
                    });
                plugin.logDebug('chapterChoices: ' + JSON.stringify(chapterChoices));
            } else {
                plugin.logDebug('No chapters folder or no children');
            }
        } catch (e) {
            chapterChoices = [];
            plugin.logDebug('Error loading chapters: ' + e.message);
        }

        // --- Запуск SceneWizardModal ---
        const modal = new SceneWizardModal(plugin.app, Modal, Setting, Notice, { plotLinesList, charactersList, locationsList, chapterChoices }, async (sceneData) => {
            // После завершения мастера — создать файл сцены по шаблону
            const plotLinesYaml = sceneData.plotLines.length > 0
                ? sceneData.plotLines.map(line => `- line: "${line.line}"\n  degree: "${line.degree}"\n  description: "${line.description}"`).join('\n')
                : '- line: ""\n  degree: ""\n  description: ""';
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
            const selectedChapter = chapterChoices.find(ch => ch.num === sceneData.chapterNum);
            plugin.logDebug('selectedChapter: ' + JSON.stringify(selectedChapter));
            if (!selectedChapter || !selectedChapter.path) {
                new Notice('Ошибка: не удалось найти папку выбранной главы!');
                plugin.logDebug('Ошибка: не удалось найти папку выбранной главы!');
                return;
            }
            const chapterFolderPath = selectedChapter.path;
            plugin.logDebug('chapterFolderPath: ' + chapterFolderPath);
            
            // Проверяем, существует ли папка главы
            const chapterFolder = plugin.app.vault.getAbstractFileByPath(chapterFolderPath);
            plugin.logDebug('chapterFolder exists: ' + (chapterFolder ? 'YES' : 'NO'));
            if (!chapterFolder) {
                new Notice('Ошибка: папка главы не найдена!');
                plugin.logDebug('Ошибка: папка главы не найдена!');
                return;
            }
            
            const sceneNum = '01'; // Можно доработать автоинкремент, если сцены будут нумероваться внутри главы
            const cleanSceneName = sceneData.sceneName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const fileName = `Сцена_${sceneNum}_${cleanSceneName}`;
            const targetPath = `${chapterFolderPath}/${fileName}.md`;
            plugin.logDebug('targetPath: ' + targetPath);
            
            // --- Формируем данные для шаблона ---
            const data = {
                ...sceneData,
                sceneNum: sceneNum,
                chapterNum: selectedChapter.num,
                chapterName: selectedChapter.name,
                cleanSceneName: cleanSceneName,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                projectName: project.split('/').pop(),
                plotLinesYaml: plotLinesYaml,
                plotLinesSection: plotLinesSection,
                characterTags: characterTags,
                locationTags: locationTags,
                charactersSection: charactersSection,
                locationsSection: locationsSection,
                tags: tags
            };
            plugin.logDebug('data for template: ' + JSON.stringify(data));

            // --- Генерируем контент из шаблона ---
            plugin.logDebug('Generating content from template...');
            const content = await generateFromTemplate('Новая_сцена', data, plugin);
            plugin.logDebug('Content generated, length: ' + content.length);
            plugin.logDebug('Content preview: ' + content.substring(0, 200) + '...');
            
            // Сохраняем только в существующей папке главы
            plugin.logDebug('Creating file...');
            try {
                const createdFile = await safeCreateFile(targetPath, content, plugin.app);
                plugin.logDebug('File created successfully: ' + (createdFile ? 'YES' : 'NO'));
                
                if (createdFile instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(createdFile);
                    plugin.logDebug('File opened in workspace');
            }
            new Notice(`Создана сцена: ${fileName}`);
            } catch (createError) {
                plugin.logDebug('Error creating file: ' + createError.message);
                new Notice('Ошибка при создании файла: ' + createError.message);
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании сцены: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createScene };
