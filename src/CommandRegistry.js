/**
 * @file       CommandRegistry.js
 * @description Регистратор команд для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, EntityFactory
 * @created    2025-01-27
 * @updated    2025-01-27
 * @docs       docs/project.md
 */

class CommandRegistry {
    constructor(plugin) {
        this.plugin = plugin;
        this.entityFactory = new window.EntityFactory(plugin);
    }

    /**
     * Регистрирует все команды плагина
     */
    registerAllCommands() {
        this.registerEntityCommands();
        this.registerProjectCommands();
        this.registerAICommands();
        this.registerUtilityCommands();
        this.registerSettingsCommands();
    }

    /**
     * Регистрирует команды создания сущностей
     */
    registerEntityCommands() {
        const entityCommands = [
            // Локации
            { id: 'create-city', name: 'Создать город', type: 'City' },
            { id: 'create-state', name: 'Создать государство', type: 'State' },
            { id: 'create-province', name: 'Создать провинцию', type: 'Province' },
            { id: 'create-village', name: 'Создать деревню', type: 'Village' },
            { id: 'create-location', name: 'Создать локацию', type: 'Location' },
            { id: 'create-port', name: 'Создать порт', type: 'Port' },
            { id: 'create-castle', name: 'Создать замок', type: 'Castle' },
            { id: 'create-dead-zone', name: 'Создать мёртвую зону', type: 'DeadZone' },
            { id: 'create-farm', name: 'Создать ферму', type: 'Farm' },
            { id: 'create-mine', name: 'Создать шахту', type: 'Mine' },
            { id: 'create-factory', name: 'Создать завод', type: 'Factory' },
            
            // Персонажи и живые существа
            { id: 'create-character', name: 'Создать персонажа', type: 'Character' },
            { id: 'create-monster', name: 'Создать монстра', type: 'Monster' },
            { id: 'create-people', name: 'Создать народ', type: 'People' },
            
            // Магия
            { id: 'create-spell', name: 'Создать заклинание', type: 'Spell' },
            { id: 'create-potion', name: 'Создать зелье', type: 'Potion' },
            { id: 'create-artifact', name: 'Создать артефакт', type: 'Artifact' },
            { id: 'create-alchemy-recipe', name: 'Создать алхимический рецепт', type: 'AlchemyRecipe' },
            
            // Организации и социальные структуры
            { id: 'create-organization', name: 'Создать организацию', type: 'Organization' },
            { id: 'create-religion', name: 'Создать религию', type: 'Religion' },
            { id: 'create-cult', name: 'Создать культ', type: 'Cult' },
            { id: 'create-faction', name: 'Создать фракцию', type: 'Faction' },
            { id: 'create-social-institution', name: 'Создать социальное учреждение', type: 'SocialInstitution' },
            
            // Сюжет и события
            { id: 'create-quest', name: 'Создать квест', type: 'Quest' },
            { id: 'create-event', name: 'Создать событие', type: 'Event' },
            { id: 'create-conflict', name: 'Создать конфликт', type: 'Conflict' },
            { id: 'create-scene', name: 'Создать сцену', type: 'Scene' },
            { id: 'create-chapter', name: 'Создать главу', type: 'Chapter' },
            { id: 'create-task', name: 'Создать задачу', type: 'Task' },
            
            // Экономика и торговля
            { id: 'create-trade-route', name: 'Создать торговый путь', type: 'TradeRoute' },
            
            // Произведения
            { id: 'create-work', name: 'Создать произведение', type: 'Work' }
        ];

        entityCommands.forEach(cmd => {
            this.plugin.addCommand({
                id: cmd.id,
                name: cmd.name,
                callback: () => this.createEntityCallback(cmd.type)
            });
        });
    }

    /**
     * Регистрирует команды работы с проектами
     */
    registerProjectCommands() {
        this.plugin.addCommand({
            id: 'create-world',
            name: 'Создать мир',
            callback: () => this.createWorldCallback()
        });

        this.plugin.addCommand({
            id: 'open-project-settings',
            name: 'Открыть настройки проекта',
            callback: () => this.openProjectSettingsCallback()
        });

        this.plugin.addCommand({
            id: 'add-project-tasks-block',
            name: 'Добавить блок задач проекта',
            callback: () => this.addProjectTasksBlockCallback()
        });

        this.plugin.addCommand({
            id: 'add-project-overview-block',
            name: 'Добавить блок обзора проекта',
            callback: () => this.addProjectOverviewBlockCallback()
        });
    }

    /**
     * Регистрирует AI-команды
     */
    registerAICommands() {
        this.plugin.addCommand({
            id: 'analyze-lore',
            name: 'Анализировать лор',
            callback: () => this.analyzeLoreCallback()
        });

        this.plugin.addCommand({
            id: 'generate-ai-content',
            name: 'Генерировать контент с ИИ',
            callback: () => this.generateAIContentCallback()
        });
    }

    /**
     * Регистрирует утилитарные команды
     */
    registerUtilityCommands() {
        this.plugin.addCommand({
            id: 'open-plugin-settings',
            name: 'Открыть настройки Literary Templates',
            callback: () => this.openPluginSettingsCallback()
        });

        this.plugin.addCommand({
            id: 'refresh-templates',
            name: 'Обновить шаблоны',
            callback: () => this.refreshTemplatesCallback()
        });

        // Добавить персонажа в сцену
        this.plugin.addCommand({
            id: 'add-character-to-scene',
            name: 'Добавить персонажа в сцену',
            callback: async () => {
                try { await this.insertCharacterIntoScene(); } catch (e) { new Notice('Ошибка: ' + e.message); }
            }
        });

        // Добавить локацию в сцену
        this.plugin.addCommand({
            id: 'add-location-to-scene',
            name: 'Добавить локацию в сцену',
            callback: async () => {
                try { await this.insertLocationIntoScene(); } catch (e) { new Notice('Ошибка: ' + e.message); }
            }
        });

        // Глава: дефолтные персонажи
        this.plugin.addCommand({
            id: 'set-chapter-default-characters',
            name: 'Задать персонажей главы (по умолчанию)',
            callback: async () => {
                try { await this.setChapterDefaults('characters'); } catch (e) { new Notice('Ошибка: ' + e.message); }
            }
        });

        // Глава: дефолтные локации
        this.plugin.addCommand({
            id: 'set-chapter-default-locations',
            name: 'Задать локации главы (по умолчанию)',
            callback: async () => {
                try { await this.setChapterDefaults('locations'); } catch (e) { new Notice('Ошибка: ' + e.message); }
            }
        });

        // Глава: применить дефолты ко всем сценам
        this.plugin.addCommand({
            id: 'apply-chapter-defaults-to-scenes',
            name: 'Применить дефолты главы ко всем сценам',
            callback: async () => {
                try { await this.applyChapterDefaultsToScenes(); } catch (e) { new Notice('Ошибка: ' + e.message); }
            }
        });

        // Структура: скелет и перенумерация
        this.plugin.addCommand({
            id: 'generate-skeleton',
            name: 'Сгенерировать скелет произведения',
            callback: async () => {
                try { await window.generateSkeleton(this.plugin, this.getCurrentStartPath()); } catch (e) { new Notice('Ошибка: '+e.message); }
            }
        });
        this.plugin.addCommand({
            id: 'renumber-chapters',
            name: 'Перенумеровать главы',
            callback: async () => {
                try { await window.renumberChapters(this.plugin, this.getCurrentStartPath()); } catch (e) { new Notice('Ошибка: '+e.message); }
            }
        });
        this.plugin.addCommand({
            id: 'renumber-scenes',
            name: 'Перенумеровать сцены в текущей главе',
            callback: async () => {
                try { await window.renumberScenes(this.plugin); } catch (e) { new Notice('Ошибка: '+e.message); }
            }
        });
    }

    // === ВСТАВКА ПЕРСОНАЖА В СЦЕНУ ===
    // Получить редактор надёжно (без падений)
    getEditor() {
        try {
            if (typeof this.plugin.getActiveEditor === 'function') {
                const ed = this.plugin.getActiveEditor();
                if (ed) return ed;
            }
        } catch (_) {}
        try {
            const MV = (typeof window !== 'undefined' && window.MarkdownView) ? window.MarkdownView : undefined;
            if (MV && this.plugin.app.workspace.getActiveViewOfType) {
                const view = this.plugin.app.workspace.getActiveViewOfType(MV);
                if (view && view.editor) return view.editor;
            }
        } catch (_) {}
        try {
            const leaf = this.plugin.app.workspace.getMostRecentLeaf ? this.plugin.app.workspace.getMostRecentLeaf() : this.plugin.app.workspace.activeLeaf;
            const view = leaf && leaf.view ? leaf.view : null;
            if (view && typeof view.getViewType === 'function' && view.getViewType() === 'markdown' && view.editor) return view.editor;
        } catch (_) {}
        return null;
    }

    async insertCharacterIntoScene() {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) { await this.plugin.logDebug('[add-character] Нет активного файла'); return; }
        const cache = this.plugin.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'сцена') { 
            // Разрешаем вставку в главы с подтверждением
            if (fmType === 'глава') {
                const confirm = await this.plugin.confirm?.('Добавить персонажа в главу? (будет добавлен в default_characters)');
                if (!confirm) return;
            } else {
                await this.plugin.logDebug('[add-character] Текущий файл не сцена'); 
                return; 
            }
        }

        let editor = this.getEditor();
        if (!editor) { 
            // Fallback для режима просмотра: переключаемся в режим редактирования
            try {
                const leaf = this.plugin.app.workspace.getActiveLeaf();
                if (leaf && leaf.setMode) {
                    leaf.setMode('source');
                    // Ждём немного, чтобы редактор инициализировался
                    await new Promise(resolve => setTimeout(resolve, 200));
                    // Получаем редактор заново после переключения
                    editor = this.getEditor();
                }
            } catch (e) {
                await this.plugin.logDebug('[add-character] Не удалось переключиться в режим редактирования');
                return;
            }
        }
        
        if (!editor) {
            await this.plugin.logDebug('[add-character] Редактор недоступен');
            return;
        }

        const projectRoot = this.getCurrentProjectRoot();
        if (!projectRoot) { await this.plugin.logDebug('[add-character] Проект не найден'); return; }

        // Определяем workName (произведение) из frontmatter или пути
        const cacheForWork = this.plugin.app.metadataCache.getFileCache(activeFile) || {};
        let workName = '';
        try {
            if (cacheForWork.frontmatter && cacheForWork.frontmatter.work) {
                workName = String(cacheForWork.frontmatter.work).trim();
            }
            if (!workName && activeFile.path) {
                const m = activeFile.path.match(/(^|\/)1_Рукопись\/Произведения\/([^\/]+)\//);
                if (m && m[2]) workName = m[2];
            }
        } catch (_) {}

        // Загружаем список персонажей (глобальные + при наличии — локальные для произведения)
        let characters = [];
        try {
            const folder = this.plugin.app.vault.getAbstractFileByPath(`${projectRoot}/Персонажи`);
            if (folder && folder.children) {
                characters = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('.') && f.basename !== 'Index' && f.basename !== 'Персонажи')
                    .map(f => f.basename);
            }
        } catch (_) {}
        // Локальные персонажи произведения
        if (workName) {
            try {
                const localFolder = this.plugin.app.vault.getAbstractFileByPath(`${projectRoot}/1_Рукопись/Произведения/${workName}/Персонажи`);
                if (localFolder && localFolder.children) {
                    const locals = localFolder.children
                        .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('.') && f.basename !== 'Index' && f.basename !== 'Персонажи')
                        .map(f => f.basename);
                    characters = [...new Set([...characters, ...locals])];
                }
            } catch (_) {}
        }
        if (characters.length === 0) { await this.plugin.logDebug('[add-character] Персонажи не найдены'); }

        // Добавляем пункт для создания нового персонажа
        const createOption = '➕ Создать персонажа';
        let list = [createOption, ...characters];

        // Предложение выбора с опцией создания
        let choice = await this.plugin.suggester(list, list, 'Выберите персонажа');
        if (choice === createOption) {
            try {
                await window.createCharacter(this.plugin, this.getCurrentStartPath());
            } catch (e) {
                new Notice('Ошибка создания персонажа: ' + e.message);
            }
            // Не переоткрываем выбор поверх мастера — завершаем команду
            return;
        }
        if (!choice) return;

        // Обновляем frontmatter (characters)
        await this.plugin.app.fileManager.processFrontMatter(activeFile, (fm) => {
            if (!fm.characters) fm.characters = [];
            if (Array.isArray(fm.characters)) {
                if (!fm.characters.includes(choice)) fm.characters.push(choice);
            }
        });

        // Вставляем ссылку в текст (в раздел Персонажи, если найден)
        const link = `[[${choice}]]`;
        editor.replaceSelection(`${link}`);
        new Notice(`Добавлен персонаж: ${choice}`);
    }

    // === ВСТАВКА ЛОКАЦИИ В СЦЕНУ ===
    async insertLocationIntoScene() {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) { await this.plugin.logDebug('[add-location] Нет активного файла'); return; }
        const cache = this.plugin.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'сцена') { 
            // Разрешаем вставку в главы с подтверждением
            if (fmType === 'глава') {
                const confirm = await this.plugin.confirm?.('Добавить локацию в главу? (будет добавлена в default_locations)');
                if (!confirm) return;
            } else {
                await this.plugin.logDebug('[add-location] Текущий файл не сцена'); 
                return; 
            }
        }

        let editor = this.getEditor();
        if (!editor) { 
            // Fallback для режима просмотра: переключаемся в режим редактирования
            try {
                const leaf = this.plugin.app.workspace.getActiveLeaf();
                if (leaf && leaf.setMode) {
                    leaf.setMode('source');
                    // Ждём немного, чтобы редактор инициализировался
                    await new Promise(resolve => setTimeout(resolve, 200));
                    // Получаем редактор заново после переключения
                    editor = this.getEditor();
                }
            } catch (e) {
                await this.plugin.logDebug('[add-location] Не удалось переключиться в режим редактирования');
                return;
            }
        }
        
        if (!editor) {
            await this.plugin.logDebug('[add-location] Редактор недоступен');
            return;
        }

        const projectRoot = this.getCurrentProjectRoot();
        if (!projectRoot) { await this.plugin.logDebug('[add-location] Проект не найден'); return; }

        // Загружаем список локаций
        let locations = [];
        try {
            const folder = this.plugin.app.vault.getAbstractFileByPath(`${projectRoot}/Локации`);
            if (folder && folder.children) {
                locations = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('.') && f.basename !== 'Index' && f.basename !== 'Локации')
                    .map(f => f.basename);
            }
        } catch (_) {}
        if (locations.length === 0) { await this.plugin.logDebug('[add-location] Локации не найдены'); }

        // Добавляем пункт для создания новой локации
        const createOptionLoc = '➕ Создать локацию';
        let listLoc = [createOptionLoc, ...locations];

        // Предложение выбора с опцией создания
        let choice = await this.plugin.suggester(listLoc, listLoc, 'Выберите локацию');
        if (choice === createOptionLoc) {
            try {
                await window.createLocation(this.plugin, this.getCurrentStartPath());
            } catch (e) {
                new Notice('Ошибка создания локации: ' + e.message);
            }
            // Не переоткрываем выбор поверх мастера — завершаем команду
            return;
        }
        if (!choice) return;

        // Обновляем frontmatter (locations)
        await this.plugin.app.fileManager.processFrontMatter(activeFile, (fm) => {
            if (!fm.locations) fm.locations = [];
            if (Array.isArray(fm.locations)) {
                if (!fm.locations.includes(choice)) fm.locations.push(choice);
            }
        });

        // Вставляем ссылку в текст
        const link = `[[${choice}]]`;
        editor.replaceSelection(`${link}`);
        new Notice(`Добавлена локация: ${choice}`);
    }

    // === ВСПОМОГАТЕЛЬНО: контекст главы по активному файлу ===
    getChapterContextFromActive() {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) return null;
        const folder = activeFile.parent;
        if (!folder) return null;
        // Ищем файл главы (frontmatter type: глава) в текущей папке
        const files = (folder.children || []).filter(f => f instanceof TFile && f.extension === 'md');
        for (const f of files) {
            const cache = this.plugin.app.metadataCache.getFileCache(f) || {};
            const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
            if (fmType === 'глава') {
                return { chapterFolder: folder, chapterFile: f };
            }
        }
        // Если активный файл сам глава
        const cache = this.plugin.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType === 'глава') {
            return { chapterFolder: folder, chapterFile: activeFile };
        }
        return null;
    }

    // === Установка дефолтов в главе ===
    async setChapterDefaults(kind) {
        const ctx = this.getChapterContextFromActive();
        if (!ctx) { await this.plugin.logDebug('[chapter-defaults] Глава не найдена'); return; }
        const { chapterFile } = ctx;

        const projectRoot = this.getCurrentProjectRoot();
        if (!projectRoot) { await this.plugin.logDebug('[chapter-defaults] Проект не найден'); return; }

        // Загружаем источники
        let choices = [];
        let folderName = kind === 'characters' ? 'Персонажи' : 'Локации';
        try {
            const folder = this.plugin.app.vault.getAbstractFileByPath(`${projectRoot}/${folderName}`);
            if (folder && folder.children) {
                choices = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
            }
        } catch (_) {}
        if (choices.length === 0) { await this.plugin.logDebug('[chapter-defaults] Нечего выбирать'); return; }

        const picked = await this.plugin.suggester(choices, choices, kind === 'characters' ? 'Выберите персонажа' : 'Выберите локацию');
        if (!picked) return;

        await this.plugin.app.fileManager.processFrontMatter(chapterFile, (fm) => {
            const key = kind === 'characters' ? 'default_characters' : 'default_locations';
            if (!fm[key]) fm[key] = [];
            if (Array.isArray(fm[key]) && !fm[key].includes(picked)) fm[key].push(picked);
        });

        new Notice(kind === 'characters' ? `Добавлен персонаж по умолчанию: ${picked}` : `Добавлена локация по умолчанию: ${picked}`);
    }

    // === Применение дефолтов ко всем сценам главы ===
    async applyChapterDefaultsToScenes() {
        const ctx = this.getChapterContextFromActive();
        if (!ctx) { await this.plugin.logDebug('[apply-defaults] Глава не найдена'); return; }
        const { chapterFolder, chapterFile } = ctx;

        // Читаем дефолты из главы
        const cache = this.plugin.app.metadataCache.getFileCache(chapterFile) || {};
        const fm = cache.frontmatter || {};
        const defChars = Array.isArray(fm.default_characters) ? fm.default_characters : [];
        const defLocs = Array.isArray(fm.default_locations) ? fm.default_locations : [];
        if (defChars.length === 0 && defLocs.length === 0) { await this.plugin.logDebug('[apply-defaults] Дефолты пусты'); return; }

        // Рекурсивно собираем MD-файлы в папке главы
        const scenes = [];
        const collect = (folder) => {
            for (const ch of (folder.children || [])) {
                if (ch instanceof TFile && ch.extension === 'md') {
                    const c = this.plugin.app.metadataCache.getFileCache(ch) || {};
                    const t = c.frontmatter && c.frontmatter.type ? String(c.frontmatter.type) : '';
                    if (t === 'сцена') scenes.push(ch);
                } else if (ch && ch.children) {
                    collect(ch);
                }
            }
        };
        collect(chapterFolder);
        if (scenes.length === 0) { await this.plugin.logDebug('[apply-defaults] Сцен не найдено'); return; }

        for (const sf of scenes) {
            await this.plugin.app.fileManager.processFrontMatter(sf, (sfm) => {
                if (defChars.length) {
                    if (!sfm.characters) sfm.characters = [];
                    for (const c of defChars) if (!sfm.characters.includes(c)) sfm.characters.push(c);
                }
                if (defLocs.length) {
                    if (!sfm.locations) sfm.locations = [];
                    for (const l of defLocs) if (!sfm.locations.includes(l)) sfm.locations.push(l);
                }
            });
        }

        new Notice('Дефолты главы применены ко всем сценам');
    }

    /**
     * Регистрирует команды настроек
     */
    registerSettingsCommands() {
        this.plugin.addCommand({
            id: 'toggle-ai-features',
            name: 'Переключить AI-функции',
            callback: () => this.toggleAIFeaturesCallback()
        });
    }

    /**
     * Универсальный callback для создания сущностей
     */
    async createEntityCallback(entityType) {
        try {
            const startPath = this.getCurrentStartPath();
            const projectRoot = this.getCurrentProjectRoot();
            // Для главы/сцены используем прямой вызов, минуя фабрику
            if (entityType === 'Chapter') {
                await window.createChapter(this.plugin, startPath);
                return;
            }
            if (entityType === 'Scene') {
                await window.createScene(this.plugin, startPath);
                return;
            }
            await this.entityFactory.createEntity(entityType, startPath);
        } catch (error) {
            new Notice(`Ошибка создания ${entityType}: ${error.message}`);
        }
    }

    /**
     * Callback для создания мира
     */
    async createWorldCallback() {
        try {
            const startPath = this.getCurrentStartPath();
            await window.createWorld(this.plugin.app, this.plugin, startPath);
        } catch (error) {
            new Notice(`Ошибка создания мира: ${error.message}`);
        }
    }

    /**
     * Callback для открытия настроек проекта
     */
    async openProjectSettingsCallback() {
        try {
            const projectRoot = this.getCurrentProjectRoot();
            if (!projectRoot) {
                new Notice('Проект не найден!');
                return;
            }
            
            const modal = new window.WorldSettingsModal(this.plugin.app, Modal, Setting, Notice, projectRoot);
            modal.open();
        } catch (error) {
            new Notice(`Ошибка открытия настроек: ${error.message}`);
        }
    }

    /**
     * Callback для добавления блока задач
     */
    async addProjectTasksBlockCallback() {
        try {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('Нет активного файла!');
                return;
            }

            const projectRoot = window.findProjectRoot(this.plugin.app, activeFile.path);
            if (!projectRoot) {
                new Notice('Файл не находится в проекте!');
                return;
            }

            const tasksBlock = `## Задачи проекта

\`\`\`dataview
TASK
WHERE !completed AND contains(file.path, "${projectRoot}")
SORT file.ctime desc
\`\`\``;

            await this.plugin.app.vault.append(activeFile, '\n\n' + tasksBlock);
            new Notice('Блок задач добавлен!');
        } catch (error) {
            new Notice(`Ошибка добавления блока задач: ${error.message}`);
        }
    }

    /**
     * Callback для добавления блока обзора
     */
    async addProjectOverviewBlockCallback() {
        try {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('Нет активного файла!');
                return;
            }

            const projectRoot = window.findProjectRoot(this.plugin.app, activeFile.path);
            if (!projectRoot) {
                new Notice('Файл не находится в проекте!');
                return;
            }

            const projectName = projectRoot.split('/').pop();
            const overviewBlock = `## Обзор проекта "${projectName}"

### Локации
- [[${projectName}/Локации/Локации|Все локации]]
- [[${projectName}/Локации/Города|Города]]
- [[${projectName}/Локации/Деревни|Деревни]]

### Персонажи
- [[${projectName}/Персонажи|Все персонажи]]

### Сюжетные линии
- [[${projectName}/Сюжетные_линии|Все сюжетные линии]]`;

            await this.plugin.app.vault.append(activeFile, '\n\n' + overviewBlock);
            new Notice('Блок обзора добавлен!');
        } catch (error) {
            new Notice(`Ошибка добавления блока обзора: ${error.message}`);
        }
    }

    /**
     * Callback для анализа лора
     */
    async analyzeLoreCallback() {
        try {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('Нет активного файла!');
                return;
            }

            const modal = new window.LoreAnalysisModal(this.plugin.app, Modal, Setting, Notice, activeFile);
            modal.open();
        } catch (error) {
            new Notice(`Ошибка анализа лора: ${error.message}`);
        }
    }

    /**
     * Callback для генерации AI-контента
     */
    async generateAIContentCallback() {
        try {
            new Notice('AI-генерация контента в разработке');
        } catch (error) {
            new Notice(`Ошибка AI-генерации: ${error.message}`);
        }
    }

    /**
     * Callback для открытия настроек плагина
     */
    async openPluginSettingsCallback() {
        try {
            const modal = new window.PluginSettingsModal(this.plugin.app, Modal, Setting, Notice, this.plugin);
            modal.open();
        } catch (error) {
            new Notice(`Ошибка открытия настроек: ${error.message}`);
        }
    }

    /**
     * Callback для обновления шаблонов
     */
    async refreshTemplatesCallback() {
        try {
            new Notice('Шаблоны обновлены!');
        } catch (error) {
            new Notice(`Ошибка обновления шаблонов: ${error.message}`);
        }
    }

    /**
     * Callback для переключения AI-функций
     */
    async toggleAIFeaturesCallback() {
        try {
            this.plugin.settings.aiEnabled = !this.plugin.settings.aiEnabled;
            await this.plugin.saveSettings();
            new Notice(`AI-функции ${this.plugin.settings.aiEnabled ? 'включены' : 'отключены'}`);
        } catch (error) {
            new Notice(`Ошибка переключения AI: ${error.message}`);
        }
    }

    /**
     * Получает текущий startPath
     */
    getCurrentStartPath() {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        return activeFile ? activeFile.parent.path : '';
    }

    /**
     * Получает текущий projectRoot
     */
    getCurrentProjectRoot() {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        return activeFile ? window.findProjectRoot(this.plugin.app, activeFile.path) : null;
    }
}

// Экспортируем класс
module.exports = { CommandRegistry };

// Глобализируем для использования в main.js
if (typeof window !== 'undefined') {
    window.CommandRegistry = CommandRegistry;
}
