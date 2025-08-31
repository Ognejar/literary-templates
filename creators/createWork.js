/**
 * @file       createWork.js
 * @description Создание нового произведения в определенной эпохе
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, findProjectRoot, safeCreateFile
 * @created    2025-08-29
 * @updated    2025-08-29
 */

async function createWork(plugin, startPath = null) {
    try {
        console.log('=== createWork вызвана ===');
        
        // Определить корень проекта
        let projectRoot = '';
        
        // Сначала попробуем получить из настроек плагина
        if (plugin.settings && plugin.settings.projectRoot) {
            projectRoot = plugin.settings.projectRoot;
            console.log('Project root из настроек:', projectRoot);
        }
        
        // Если нет в настройках, попробуем определить из активного файла
        if (!projectRoot) {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) {
                projectRoot = window.findProjectRoot(plugin.app, activeFile.parent.path);
                console.log('Project root из активного файла:', projectRoot);
            }
        }
        
        // Если все еще нет, попробуем найти все проекты
        if (!projectRoot) {
            console.log('Ищем все проекты...');
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            console.log(`Найдено проектов: ${projects.length}`);
            
            if (projects.length === 0) {
                console.error('Проекты не найдены!');
                new Notice('Проекты не найдены!');
                return;
            }
            
            // Выбор проекта пользователем
            if (typeof plugin.selectProject === 'function') {
                projectRoot = await plugin.selectProject(projects);
                if (!projectRoot) {
                    console.log('Проект не выбран');
                    return;
                }
                console.log(`Выбран проект: ${projectRoot}`);
            } else {
                // Простой выбор первого проекта
                projectRoot = projects[0];
                console.log(`Автоматически выбран проект: ${projectRoot}`);
            }
        }
        
        // Проверяем, что projectRoot определен
        if (!projectRoot) {
            console.error('Не удалось определить корень проекта');
            new Notice('Не удалось определить корень проекта');
            return;
        }
        console.log('createWork: определён projectRoot:', projectRoot);
        // Явно сохраняем projectRoot в plugin.settings
        plugin.settings = plugin.settings || {};
        plugin.settings.projectRoot = projectRoot;
        
        console.log('projectRoot:', projectRoot);
        
        // Загрузить доступные эпохи
        const timelineService = new window.TimelineService(plugin);
        console.log('createWork: перед вызовом getEpochs, projectRoot:', projectRoot);
        const epochs = await timelineService.getEpochs(projectRoot);
        
        if (epochs.length === 0) {
            console.warn('Эпохи не найдены. Создайте хотя бы одну эпоху.');
            return;
        }
        
        // Открыть модальное окно для создания произведения
        if (typeof window.WorkCreationModal !== 'function') {
            console.error('WorkCreationModal недоступен');
            new Notice('WorkCreationModal недоступен. Перезагрузите плагин.');
            return;
        }
        const modal = new window.WorkCreationModal(plugin.app, plugin, {
            projectRoot,
            epochs,
            onWorkCreated: async (workData) => {
                console.log('onWorkCreated: projectRoot:', projectRoot);
                await createWorkStructure(plugin, projectRoot, workData);
            }
        });
        
        modal.open();
        
    } catch (error) {
        console.error('Ошибка в createWork:', error);
    }
}

async function createWorkStructure(plugin, projectRoot, workData) {
    try {
        console.log('createWorkStructure: projectRoot:', projectRoot);
        console.log('Создание структуры произведения:', workData);
        
        // Создать папку произведения
        const workFolder = `${projectRoot}/1_Рукопись/Произведения/${workData.id}`;
        await ensureFolder(workFolder, plugin.app);
        
        // Создать подпапки
        const subfolders = [
            'Главы',
            'Сцены', 
            'Персонажи',
            'Заметки'
        ];
        
        for (const folder of subfolders) {
            await ensureFolder(`${workFolder}/${folder}`, plugin.app);
        }
        
        // Создать файл произведения
        const workFilePath = `${workFolder}/${workData.id}.md`;
        const workContent = generateWorkTemplate(workData);
        
        const workFile = await safeCreateFile(workFilePath, workContent, plugin.app);
        
        if (workFile) {
            console.log('Произведение создано:', workFilePath);
            
            // Создать временный контекст
            await createTemporalContext(plugin, projectRoot, workData);
            
            // Открыть файл произведения
            const file = plugin.app.vault.getAbstractFileByPath(workFilePath);
            if (file) {
                plugin.app.workspace.openLinkText(workFilePath, '', true);
            }
        }
        
    } catch (error) {
        console.error('Ошибка при создании структуры произведения:', error);
    }
}

function generateWorkTemplate(workData) {
    return `---
title: "${workData.title}"
type: произведение
epoch: "${workData.epoch}"
year: ${workData.year}
context: "${workData.context}"
created: ${new Date().toISOString().split('T')[0]}
status: в_работе
---

# ${workData.title}

## Описание
${workData.description}

## Эпоха
- **Название:** ${workData.epochName}
- **Год:** ${workData.year}
- **Период:** ${workData.epochStartYear} - ${workData.epochEndYear}

## Контекст
${workData.context}

## Структура

### Главы
\`\`\`dataview
TABLE title, chapter, status
FROM "1_Рукопись/Произведения/${workData.id}/Главы"
SORT chapter ASC
\`\`\`

### Сцены
\`\`\`dataview
TABLE title, chapter, location
FROM "1_Рукопись/Произведения/${workData.id}/Сцены"
SORT chapter ASC, file.ctime ASC
\`\`\`

### Персонажи
\`\`\`dataview
TABLE name, role, location
FROM "1_Рукопись/Произведения/${workData.id}/Персонажи"
SORT name ASC
\`\`\`

## Заметки
\`\`\`dataview
TABLE title, created
FROM "1_Рукопись/Произведения/${workData.id}/Заметки"
SORT file.ctime DESC
\`\`\`

## Связи с миром

### Локации
\`\`\`dataview
TABLE name, state, province
FROM "Локации/Города"
WHERE epoch = "${workData.epoch}"
\`\`\`

### Фракции
\`\`\`dataview
TABLE name, type, influence
FROM "Фракции"
WHERE epoch = "${workData.epoch}"
\`\`\`
`;
}

async function createTemporalContext(plugin, projectRoot, workData) {
    try {
        const contextPath = `${projectRoot}/_lore/temporal_contexts.json`;
        
        // Загрузить существующие контексты
        let contexts = [];
        const existingFile = plugin.app.vault.getAbstractFileByPath(contextPath);
        if (existingFile && typeof existingFile.text === 'function') {
            try {
                const content = await existingFile.text();
                contexts = JSON.parse(content);
            } catch (error) {
                console.warn('Ошибка при чтении temporal_contexts.json:', error);
            }
        }
        
        // Добавить новый контекст
        const newContext = {
            id: workData.id,
            name: workData.title,
            epochId: workData.epochId,
            year: workData.year,
            description: workData.description,
            active: false,
            created: new Date().toISOString()
        };
        
        contexts.push(newContext);
        
        // Сохранить обновленные контексты
        const timelineService = new window.TimelineService(plugin);
        await timelineService.saveTemporalContexts(contexts, projectRoot);
        
        console.log('Временный контекст создан:', newContext);
        
    } catch (error) {
        console.error('Ошибка при создании временного контекста:', error);
    }
}

async function ensureFolder(folderPath, app) {
    try {
        const existing = app.vault.getAbstractFileByPath(folderPath);
        if (!existing) {
            await app.vault.createFolder(folderPath);
        } else if (!(existing instanceof window.obsidian.TFolder)) {
            throw new Error(`Путь ${folderPath} существует, но не является папкой`);
        }
    } catch (error) {
        if (!error.message.includes('Folder already exists')) {
            console.error('Ошибка при создании папки:', error);
        }
    }
}

// Глобализация для работы команды 'Создать произведение'
window.createWork = createWork;

module.exports = { createWork };
