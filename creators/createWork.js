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

// Удаляем функцию generateWorkTemplate
// Вместо неё используем шаблон с диска

async function createWorkStructure(plugin, projectRoot, workData) {
    try {
        console.log('createWorkStructure: projectRoot:', projectRoot);
        console.log('Создание структуры произведения:', workData);
        
        // Создать папку произведения
        if (typeof Notice !== 'undefined') {
            new Notice('Создание папок...', 2000);
        }
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
        
        // Создать локальный файл сюжетных линий
        if (typeof Notice !== 'undefined') {
            new Notice('Создание файла сюжетных линий...', 2000);
        }
        await createLocalPlotlinesFile(plugin, workFolder, workData);
        
        // Имя файла: Тип_Название.md
        if (typeof Notice !== 'undefined') {
            new Notice('Создание файла произведения...', 2000);
        }
        const fileBase = buildWorkFileName(workData.title, workData.workType);
        const workFilePath = `${workFolder}/${fileBase}.md`;

        // Чтение шаблона с диска
        let templateContent = '';
        try {
            // readTemplateFile ищет по названию без расширения
            templateContent = await plugin.readTemplateFile('Новое_произведение');
        } catch (e) {
            console.error('Шаблон "Новое_произведение.md" не найден:', e);
            if (typeof Notice !== 'undefined') {
                new Notice('Шаблон "Новое_произведение.md" не найден в templates!', 6000);
            }
            return;
        }

        // Подставляем значения
        const now = new Date();
        const data = {
            ...workData,
            created: now.toISOString().split('T')[0],
            status: 'в_работе',
        };
        const workContent = await window.fillTemplate(templateContent, data);

        const createdFile = await safeCreateFile(workFilePath, workContent, plugin.app);
        
        if (createdFile) {
            console.log('Произведение создано:', createdFile.path);
            // Создать временный контекст
            if (typeof Notice !== 'undefined') {
                new Notice('Сохранение временного контекста...', 2000);
            }
            await createTemporalContext(plugin, projectRoot, workData);
            // Открыть файл произведения
            if (typeof Notice !== 'undefined') {
                new Notice('Открытие файла...', 1500);
            }
            await plugin.app.workspace.getLeaf(true).openFile(createdFile);

            // Предложить создать скелет (главы/сцены) сразу после создания произведения
            try {
                const ask = plugin.suggester
                    ? await plugin.suggester(['Да', 'Нет'], ['Создать скелет сейчас', 'Пропустить'], 'Создать скелет глав и сцен для произведения?')
                    : 'Нет';
                if (ask === 'Да' && typeof window.generateSkeleton === 'function') {
                    // Передаём стартовый путь в папку произведения, чтобы генератор работал в нужном контексте
                    await window.generateSkeleton(plugin, workFolder);
                }
            } catch (e) {
                console.warn('Не удалось предложить создание скелета:', e?.message);
            }
        }
        
    } catch (error) {
        console.error('Ошибка при создании структуры произведения:', error);
        throw error; // Пробрасываем ошибку выше
    }
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

function sanitizeFileName(name) {
    let s = String(name || '').trim();
    // Запрещённые для файловой системы символы заменяем на дефис
    s = s.replace(/[\\/:*?"<>|]/g, '-');
    // Схлопываем последовательности пробелов
    s = s.replace(/\s+/g, ' ');
    // Убираем точки/пробелы на конце
    s = s.replace(/[ .]+$/g, '');
    // Если имя пустое — вернём 'Произведение'
    if (!s) s = 'Произведение';
    return s;
}

function buildWorkFileName(title, workType) {
    const t = sanitizeFileName(title || '');
    const k = sanitizeFileName(workType || '');
    return (k ? `${k}_${t}` : t) || 'Произведение';
}

/**
 * Создает локальный файл сюжетных линий для произведения
 */
async function createLocalPlotlinesFile(plugin, workFolder, workData) {
    try {
        // Читаем шаблон локальных сюжетных линий
        let templateContent = '';
        try {
            templateContent = await plugin.readTemplateFile('Локальные_сюжетные_линии');
        } catch (e) {
            console.error('Шаблон "Локальные_сюжетные_линии.md" не найден:', e);
            if (typeof Notice !== 'undefined') {
                new Notice('Шаблон "Локальные_сюжетные_линии.md" не найден в templates!', 6000);
            }
            return;
        }

        // Подставляем значения
        const data = {
            workName: workData.id,
            workTitle: workData.title,
            created: new Date().toISOString().split('T')[0]
        };
        const content = await window.fillTemplate(templateContent, data);

        // Создаем файл
        const plotlinesFilePath = `${workFolder}/Сюжетные_линии.md`;
        const createdFile = await safeCreateFile(plotlinesFilePath, content, plugin.app);
        
        if (createdFile) {
            console.log('Локальный файл сюжетных линий создан:', createdFile.path);
        }
        
    } catch (error) {
        console.error('Ошибка при создании локального файла сюжетных линий:', error);
        // Не пробрасываем ошибку, чтобы не прерывать создание произведения
    }
}

// Глобализация для работы команды 'Создать произведение'
window.createWork = createWork;

module.exports = { createWork };
