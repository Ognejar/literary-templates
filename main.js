/**
 * @file       main.js
 * @description Плагин Obsidian "Literary Templates": регистрация команд, контекстного меню и генерация заметок по шаблонам
 * @author     Captain Ognejar
 * @version    1.0.0
 * @license    MIT
 * @dependencies creators/*, *WizardModal классы, Obsidian API
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       1_Plugun_work/docs/
 */
/* global createWorld, createChapter, createScene, createVillage, createMine, createFactory, createFarm, createPeople, createTask, createSpell, createArtifact, createCity, createLocation, createPort, createCastle, createDeadZone, createProvince, createState, createAlchemyRecipe, createCharacter, createMonster, AISettingsModal, ArtifactWizardModal, LoreAnalysisModal, PeopleWizardModal, DeadZoneWizardModal, CastleWizardModal, CityWizardModal, PortWizardModal, FarmWizardModal, MineWizardModal, FactoryWizardModal, ProvinceWizardModal, TaskWizardModal, CharacterWizardModal, ConflictWizardModal, SpellWizardModal, AlchemyRecipeWizardModal, FactionWizardModal, TradeRouteWizardModal, CultWizardModal, ReligionWizardModal, OrganizationWizardModal, QuestWizardModal, EventWizardModal, HtmlWizardModal, PotionWizardModal, VillageWizardModal, StateWizardModal, LocationWizardModal, BaseWizardModal, SceneWizardModal, WorldSettingsModal, ProjectSelectorModal, ChapterSelectorModal, createPotion, createSpell, AIAnalysisResultModal, navigator, document */
// const { writeFileSync } = require('fs'); // Неиспользуется
// const { join } = require('path'); // Неиспользуется
const { Plugin, Notice, TFile, TFolder, Modal, Setting, MarkdownView } = require('obsidian');
// PromptSelectorModal и parsePromptYaml теперь определены в main.js

// Импорт функций создания сущностей
const { createWorld } = require('./creators/createWorld.js');
const { createChapter } = require('./creators/createChapter.js');
const { createCity } = require('./creators/createCity.js');
const { createLocation } = require('./creators/createLocation.js');
const { createScene } = require('./creators/createScene.js');
const { createVillage } = require('./creators/createVillage.js');
const { createDeadZone } = require('./creators/createDeadZone.js');
const { createPort } = require('./creators/createPort.js');
const { createCastle } = require('./creators/createCastle.js');
const { createPotion } = require('./creators/createPotion.js');
const { createSpell } = require('./creators/createSpell.js');
const { createArtifact } = require('./creators/createArtifact.js');
const { createAlchemyRecipe } = require('./creators/createAlchemyRecipe.js');
const { createProvince } = require('./creators/createProvince.js');
const { createState } = require('./creators/createState.js');
const { createFactory } = require('./creators/createFactory.js');
const { createFarm } = require('./creators/createFarm.js');
const { createPeople } = require('./creators/createPeople.js');
const { createTask } = require('./creators/createTask.js');
const { createMonster } = require('./creators/createMonster.js');
const { createWork } = require('./creators/createWork.js');
const { createSocialInstitution } = require('./creators/createSocialInstitution.js');

// Импорт модальных окон
const { ConflictWizardModal } = require('./creators/ConflictWizardModal.js');
const { OrganizationWizardModal } = require('./creators/OrganizationWizardModal.js');
const { ReligionWizardModal } = require('./creators/ReligionWizardModal.js');
const { CultWizardModal } = require('./creators/CultWizardModal.js');
const { TradeRouteWizardModal } = require('./creators/TradeRouteWizardModal.js');
const { FactionWizardModal } = require('./creators/FactionWizardModal.js');
const { QuestWizardModal } = require('./creators/QuestWizardModal.js');
const { EventWizardModal } = require('./creators/EventWizardModal.js');
const { HtmlWizardModal } = require('./creators/HtmlWizardModal.js');
const { PotionWizardModal } = require('./creators/PotionWizardModal.js');
const { VillageWizardModal } = require('./creators/VillageWizardModal.js');
const { StateWizardModal } = require('./creators/StateWizardModal.js');
const { LocationWizardModal } = require('./creators/LocationWizardModal.js');
const { SceneWizardModal } = require('./creators/SceneWizardModal.js');
const { WorldSettingsModal } = require('./creators/WorldSettingsModal.js');
const { ProjectSelectorModal } = require('./creators/ProjectSelectorModal.js');
const { ChapterSelectorModal } = require('./creators/ChapterSelectorModal.js');
const { PluginSettingsModal } = require('./creators/PluginSettingsModal.js');

// Импорт сервисов для работы с временными слоями
const { TimelineService } = require('./src/TimelineService.js');
const { TemporalEntityService } = require('./src/TemporalEntityService.js');
const { TemporalContextService } = require('./src/TemporalContextService.js');
const { MigrationService } = require('./src/MigrationService.js');
const { TemporalAPI } = require('./src/TemporalAPI.js');

// Импорт новых модулей
const { CommandRegistry } = require('./src/CommandRegistry.js');
const { UIHelpers } = require('./src/UIHelpers.js');
const { TemplateManager } = require('./src/TemplateManager.js');
const { ProjectManager } = require('./src/ProjectManager.js');
const { SettingsManager } = require('./src/SettingsManager.js');
// Доп. модули
const { PromptSelectorModal } = require('./src/PromptSelectorModal.js');
const { getAllProjectFolders, getAllProjectRoots } = require('./src/ProjectDiscovery.js');
// Алиасы обёрток визардов (удалены ранее, но используются ниже)
const createConflictWizard = (plugin, projectPath, options = {}) => { const modal = new ConflictWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createOrganizationWizard = (plugin, projectPath, options = {}) => { const modal = new OrganizationWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createReligionWizard = (plugin, projectPath, options = {}) => { const modal = new ReligionWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createCultWizard = (plugin, projectPath, options = {}) => { const modal = new CultWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createTradeRouteWizard = (plugin, projectPath, options = {}) => { const modal = new TradeRouteWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createFactionWizard = (plugin, projectPath, options = {}) => { const modal = new FactionWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createQuestWizard = (plugin, projectPath, options = {}) => { const modal = new QuestWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };
const createEventWizard = (plugin, projectPath, options = {}) => { const modal = new EventWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options); modal.open(); };

// Временные шимы загрузки/сохранения настроек (заменяют старые функции)
async function loadSettingsFromFile(app) {
    try { const mgr = new SettingsManager({ app }); return await (mgr.loadPluginSettings ? mgr.loadPluginSettings() : {}); } catch (e) { return {}; }
}
async function saveSettingsToFile(app, settings) {
    try { const mgr = new SettingsManager({ app }); return await (mgr.savePluginSettings ? mgr.savePluginSettings(settings) : false); } catch (e) { return false; }
}

// Импорт сервисов
// const { KeyRotationService } = require('./src/KeyRotationService.js');
// const { AIProviderService } = require('./src/AIProviderService.js');
// const { LoreAnalyzerService } = require('./src/LoreAnalyzerService.js');

// Функции для создания сущностей будут зарегистрированы в onload()
// Функции-обертки для создания сущностей (вызывают функции из creators/*.js)
// Эти функции будут заменены на реальные функции из creators/*.js при сборке

// Функции для работы с проектами

/**
 * Находит корневую папку проекта, поднимаясь вверх по дереву папок
 * @param {App} app - Экземпляр приложения Obsidian
 * @param {string} startPath - Путь для начала поиска
 * @returns {string|null} - Путь к корневой папке проекта или null
 */
function findProjectRoot(app, startPath = '') {
    if (!startPath) return null;
    
    let currentPath = startPath;
    const maxDepth = 10; // Защита от бесконечного цикла
    let depth = 0;
    
    while (currentPath && depth < maxDepth) {
        const settingsFile = `${currentPath}/Настройки_мира.md`;
        const file = app.vault.getAbstractFileByPath(settingsFile);
        
        if (file && file instanceof TFile) {
            return currentPath;
        }
        
        // Поднимаемся на уровень выше
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        if (parentPath === currentPath) break; // Достигли корня
        currentPath = parentPath;
        depth++;
    }
    
    return null;
}

/**
 * Проверяет, является ли папка папкой проектов (содержит файл-маркер Проекты.md)
 * @param {App} app - Экземпляр приложения Obsidian
 * @param {string} folderPath - Путь к папке для проверки
 * @returns {boolean} - true если это папка проектов
 */
function isProjectFolder(app, folderPath) {
    // Папка проектов - та, где лежат папки миров
    // Проверяем, есть ли в ней подпапки с файлом "Настройки_мира.md"
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) return false;
    
    const children = folder.children;
    if (!children || children.length === 0) return false;
    
    // Ищем хотя бы одну подпапку с файлом "Настройки_мира.md"
    for (const child of children) {
        if (child instanceof TFolder) {
            const settingsFile = app.vault.getAbstractFileByPath(`${child.path}/Настройки_мира.md`);
            if (settingsFile && settingsFile instanceof TFile) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Получает список всех папок проектов
 * @param {App} app - Экземпляр приложения Obsidian
 * @returns {Promise<string[]>} - Массив путей к папкам проектов
 */
// Функция getAllProjectFolders удалена - не используется

/**
 * Получает список всех корневых папок проектов
 * @param {App} app - Экземпляр приложения Obsidian
 * @returns {Promise<string[]>} - Массив путей к корневым папкам проектов
 */
// Функция getAllProjectRoots удалена - не используется

// --- Вспомогательные функции ---

// Функция fillTemplate удалена - используется TemplateManager

// Функция generateFromTemplate удалена - используется TemplateManager

/**
 * Проверяет и создаёт инфраструктуру для сущности: папку, индексный файл, ссылку в индексе
 * @param {string} folderPath - путь к папке (например, 'Провинции')
 * @param {string} _entityName - имя новой сущности
 * @param {App} app - экземпляр Obsidian App
 */
// ensureEntityInfrastructure теперь вызывается как window.ensureEntityInfrastructure (алиас на ProjectManager.ensureEntityInfrastructure)1

/**
 * Безопасно создает файл, проверяя его существование
 * @param {string} filePath - путь к файлу
 * @param {string} content - содержимое файла
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<TFile|null>} - созданный файл или null если файл уже существует
 */
// Функция safeCreateFile удалена - не используется

// Подключаем сервис фактов (используем именованный доступ без деструктуринга во избежание дублей)
const { FactsService } = require('./src/FactsService.js');
// --- Modal классы определяются в других файлах при сборке ---
// PromptModal, SuggesterModal - в modals.js
// ProjectSelectorModal, ChapterSelectorModal - в отдельных файлах
// *WizardModal классы - в соответствующих файлах

class LiteraryTemplatesPlugin extends Plugin {
    constructor() {
        super();
        // console.log('LiteraryTemplatesPlugin constructor called');
        
        // Настройки плагина
        this.settings = {
            aiKeys: [],
            currentKeyIndex: 0,
            keyUsage: {},
            aiEnabled: true,
            aiProvider: 'openrouter', // openrouter, anthropic, openai
            defaultModel: 'openrouter/mistralai/mistral-7b-instruct', // Бесплатная модель
            maxTokens: 2000,
            temperature: 0.7,
            author: '' // <--- новое поле
        };
        
        // Инициализируем новые модули
        this.commandRegistry = null;
        this.uiHelpers = null;
        this.templateManager = null;
        this.projectManager = null;
        this.settingsManager = null;
        
        // Инициализируем сервисы для работы с временными слоями
        try {
            this.timelineService = new TimelineService(this);
            this.temporalEntityService = new TemporalEntityService(this);
            this.temporalContextService = new TemporalContextService(this);
            this.migrationService = new MigrationService(this);
            this.temporalAPI = new TemporalAPI(this);
        } catch (e) {
            console.warn('Ошибка инициализации сервисов временных слоев:', e);
        }
        
        // console.log('LiteraryTemplatesPlugin constructor completed');
    }

    // --- ВСТАВКИ В РЕДАКТОР ---
    
    /**
     * Собирает сюжетные линии из файла
     * @param {string} filePath - путь к файлу сюжетных линий
     * @param {string} scope - область действия ('глобальные' или 'локальные')
     * @returns {Promise<Array>} массив сюжетных линий
     */
    async collectPlotlines(filePath, scope) {
        try {
            const plotFile = this.app.vault.getAbstractFileByPath(filePath);
            if (!(plotFile instanceof TFile)) {
                this.logDebug(`[collectPlotlines] Файл не найден: ${filePath}`);
                return [];
            }
            
            const content = await this.app.vault.read(plotFile);
            const lines = content.split(/\r?\n/);
            /** @type {{id:string,title:string,description:string,scope:string}[]} */
            const plotlines = [];
            let current = null;
            let collectingDesc = false;
            
            for (let i = 0; i < lines.length; i++) {
                const raw = lines[i];
                const line = raw.trim();
                const themeMatch = line.match(/^#{0,3}\s*Тема(\d+)\s*-\s*(.+)$/);
                if (themeMatch) {
                    if (current) {
                        plotlines.push({...current, scope});
                    }
                    current = { id: themeMatch[1], title: themeMatch[2].trim(), description: '' };
                    collectingDesc = false;
                    continue;
                }
                if (current) {
                    if (!collectingDesc) {
                        if (/^Описание\s*:/.test(line)) {
                            const after = raw.substring(raw.indexOf('Описание') + 'Описание'.length).replace(/^[\s:]+/, '');
                            current.description = after;
                            collectingDesc = true;
                        }
                    } else {
                        // копим описание до следующей темы
                        current.description += (current.description ? '\n' : '') + raw;
                    }
                }
            }
            if (current) {
                plotlines.push({...current, scope});
            }
            
            this.logDebug(`[collectPlotlines] Найдено ${plotlines.length} ${scope} сюжетных линий в ${filePath}`);
            return plotlines;
        } catch (e) {
            this.logDebug(`[collectPlotlines] Ошибка чтения ${filePath}: ${e.message}`);
            return [];
        }
    }

    getActiveEditor() {
        const ws = this.app.workspace;
        // Пытаемся получить через MarkdownView, если доступен
        try {
             
            if (typeof MarkdownView !== 'undefined' && ws.getActiveViewOfType) {
                 
                const view = ws.getActiveViewOfType(MarkdownView);
                if (view && view.editor) return view.editor;
            }
         
        } catch (e) {}
        // Фолбэк: через активный лист
        const leaf = ws.getMostRecentLeaf ? ws.getMostRecentLeaf() : ws.activeLeaf;
        const view = leaf && leaf.view ? leaf.view : null;
        if (view && typeof view.getViewType === 'function' && view.getViewType() === 'markdown' && view.editor) {
            return view.editor;
        }
        if (view && view.editor) return view.editor;
        return null;
    }

    // Вспомогательная функция для определения стартового пути из target
    // Используется в addContextMenu, registerCommands и других местах
    getStartPath(target) {
        if (target instanceof TFile) return target.parent.path;
        if (target instanceof TFolder) return target.path;
        if (target && target.path) return target.path;
        return '';
    }

    /**
     * Получает текущий startPath из активного файла
     * @returns {string} - Путь для начала поиска проекта
     */
    getCurrentStartPath() {
        const activeFile = this.app.workspace.getActiveFile();
        return activeFile ? this.getStartPath(activeFile) : '';
    }

    /**
     * Создает callback для команды создания сущности с автоматическим определением startPath
     * @param {Function} createFunction - Функция создания сущности
     * @param {boolean} useWindow - Использовать window.createFunction вместо прямого вызова
     * @returns {Function} - Callback для команды
     */
    createEntityCallback(createFunction, useWindow = false) {
        return () => {
            const currentStartPath = this.getCurrentStartPath();
            if (useWindow) {
                window[createFunction.name](this, currentStartPath);
            } else {
                createFunction(this, currentStartPath);
            }
        };
    }

    /**
     * Получает корень проекта из активного файла
     * @returns {string|null} - Путь к корню проекта или null
     */
    getCurrentProjectRoot() {
        const startPath = this.getCurrentStartPath();
        return startPath ? findProjectRoot(this.app, startPath) : null;
    }

    /**
     * Регистрирует команды вручную (fallback)
     */
    registerCommandsManually() {
        // Команды для управления контекстом
        this.addCommand({
            id: 'set-current-project',
            name: 'Установить текущий проект',
            callback: async () => {
                const allFiles = this.app.vault.getMarkdownFiles();
                const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
                const projects = projectFiles.map(f => f.parent.path);
                if (projects.length === 0) {
                    new Notice('Проекты не найдены!');
                    return;
                }
                const selected = await this.selectProject(projects);
                if (selected && window.litSettingsService) {
                    await window.litSettingsService.setCurrentProject(this.app, selected);
                    new Notice(`Текущий проект: ${selected.split('/').pop()}`);
                }
            },
        });

        // Команды создания сущностей
        const entityCommands = [
            { id: 'create-artifact', name: 'Создать артефакт', func: createArtifact },
            { id: 'create-chapter', name: 'Создать главу', func: createChapter },
            { id: 'create-scene', name: 'Создать сцену', func: createScene },
            { id: 'create-village', name: 'Создать деревню', func: createVillage },
            { id: 'create-mine', name: 'Создать шахту', func: createMine },
            { id: 'create-factory', name: 'Создать завод', func: createFactory },
            { id: 'create-farm', name: 'Создать ферму', func: createFarm },
            { id: 'create-city', name: 'Создать город', func: createCity },
            { id: 'create-province', name: 'Создать провинцию', func: createProvince },
            { id: 'create-state', name: 'Создать государство', func: createState },
            { id: 'create-castle', name: 'Создать замок (мастер)', func: createCastle },
            { id: 'create-dead-zone', name: 'Создать мёртвую зону', func: createDeadZone },
            { id: 'create-location', name: 'Создать общую локацию', func: createLocation },
            { id: 'create-port', name: 'Создать порт', func: createPort },
            { id: 'create-potion', name: 'Создать зелье', func: createPotion },
            { id: 'create-alchemy-recipe', name: 'Создать алхимический рецепт', func: createAlchemyRecipe },
            { id: 'create-people', name: 'Создать народ', func: createPeople },
            { id: 'create-task', name: 'Создать задачу (мастер)', func: createTask },
            { id: 'create-social-institution', name: 'Создать социальный объект (мастер)', func: createSocialInstitution }
        ];

        entityCommands.forEach(cmd => {
            this.addCommand({
                id: cmd.id,
                name: cmd.name,
                callback: this.createEntityCallback(cmd.func)
            });
        });
    }

    async insertTodoAtCursor() {
        const editor = this.getActiveEditor();
        if (!editor) {
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const title = await this.prompt('Текст задачи:');
        if (!title || !title.trim()) {
            this.logDebug(`[ERROR] Текст задачи не указан`);
            return;
        }

        const priorityItems = ['', '#критично', '#важно', '#средне', '#низкий'];
        const priorityDisplay = ['Без приоритета', '#критично', '#важно', '#средне', '#низкий'];
        const priority = await this.suggester(priorityItems, priorityDisplay, 'Выберите приоритет (опционально)');

        const due = await this.prompt('Дата (YYYY-MM-DD, опционально):');

        const statusItems = ['open', 'in-progress', 'done'];
        const statusDisplay = ['Открыта', 'В работе', 'Сделано'];
        const status = await this.suggester(statusItems, statusDisplay, 'Статус задачи');

        const checked = status === 'done' ? 'x' : ' ';
        let line = `- [${checked}]`;
        if (priority) line += ` ${priority}`;
        if (due && due.trim()) line += ` \uD83D\uDCC5 ${due.trim()}`; // 📅
        line += ` ${title.trim()}`;
        editor.replaceSelection(line + '\n');
        this.logDebug('Задача вставлена');
    }

    async insertPlotlineIntoScene() {
        this.logDebug(`[insertPlotlineIntoScene] === НАЧАЛО ФУНКЦИИ ===`);
        let editor = this.getActiveEditor();
        this.logDebug(`[insertPlotlineIntoScene] editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
        
        // Fallback для режима просмотра: переключаемся в режим редактирования (как у персонажей)
        if (!editor) {
            try {
                const leaf = this.app.workspace.getActiveLeaf();
                if (leaf && leaf.setMode) {
                    this.logDebug(`[insertPlotlineIntoScene] Переключаемся в режим редактирования`);
                    leaf.setMode('source');
                    // Ждём немного, чтобы редактор инициализировался (как у персонажей)
                    await new Promise(resolve => setTimeout(resolve, 200));
                    // Получаем редактор заново после переключения
                    editor = this.getActiveEditor();
                    this.logDebug(`[insertPlotlineIntoScene] После переключения editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
                }
            } catch (e) {
                this.logDebug(`[insertPlotlineIntoScene] Не удалось переключиться в режим редактирования: ${e.message}`);
            }
        }
        
        if (!editor) {
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }
        const cache = this.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'сцена') {
            const choice = await this.suggester(['yes', 'no'], ['Вставить', 'Отмена'], 'Текущий файл не является сценой. Вставить всё равно?');
            if (choice !== 'yes') return;
        }

        // Определяем projectRoot и workName
        const parentPath = activeFile.parent ? activeFile.parent.path : '';
        let projectRoot = findProjectRoot(this.app, parentPath) || parentPath || this.activeProjectRoot || '';
        this.logDebug(`[insertPlotlineIntoScene] projectRoot: ${projectRoot}`);
        if (!projectRoot) {
            const roots = await getAllProjectRoots(this.app);
            if (!roots || roots.length === 0) {
                this.logDebug(`[ERROR] Проект не найден: отсутствует файл "Настройки_мира.md"`);
                return;
            }
            projectRoot = roots[0];
            this.logDebug(`[insertPlotlineIntoScene] projectRoot из roots: ${projectRoot}`);
        }

        // Определяем произведение из пути файла или frontmatter
        let workName = '';
        try {
            // Из frontmatter сцены
            if (cache.frontmatter && cache.frontmatter.work) {
                workName = String(cache.frontmatter.work).trim();
            }
            // Из пути файла
            if (!workName) {
                const pathMatch = activeFile.path.match(/(^|\/)1_Рукопись\/Произведения\/([^\/]+)\//);
                if (pathMatch && pathMatch[2]) {
                    workName = pathMatch[2];
                }
            }
        } catch (e) {
            this.logDebug(`[insertPlotlineIntoScene] Ошибка определения произведения: ${e.message}`);
        }
        this.logDebug(`[insertPlotlineIntoScene] workName: ${workName || '(не определено)'}`);

        // Собираем глобальные сюжетные линии
        this.logDebug(`[insertPlotlineIntoScene] Загружаем глобальные сюжетные линии из: ${projectRoot}/Сюжетные_линии.md`);
        const globalPlotlines = await this.collectPlotlines(`${projectRoot}/Сюжетные_линии.md`, 'глобальные');
        this.logDebug(`[insertPlotlineIntoScene] Найдено глобальных сюжетных линий: ${globalPlotlines.length}`);
        
        // Собираем локальные сюжетные линии, если произведение определено
        let localPlotlines = [];
        if (workName) {
            const localPlotlinesPath = `${projectRoot}/1_Рукопись/Произведения/${workName}/Сюжетные_линии.md`;
            this.logDebug(`[insertPlotlineIntoScene] Загружаем локальные сюжетные линии из: ${localPlotlinesPath}`);
            localPlotlines = await this.collectPlotlines(localPlotlinesPath, 'локальные');
            this.logDebug(`[insertPlotlineIntoScene] Найдено локальных сюжетных линий: ${localPlotlines.length}`);
        }

        // Объединяем все сюжетные линии
        const allPlotlines = [...globalPlotlines, ...localPlotlines];
        this.logDebug(`[insertPlotlineIntoScene] Всего сюжетных линий: ${allPlotlines.length}`);

        if (allPlotlines.length === 0) {
            this.logDebug(`[ERROR] Сюжетные линии не найдены`);
            return;
        }

        // Создаем списки для выбора с визуальным разделением
        const items = allPlotlines.map((p) => `${p.scope}_Тема${p.id}`);
        const display = allPlotlines.map((p) => {
            const prefix = p.scope === 'локальные' ? '📖 ' : '🌍 ';
            const scopeText = p.scope === 'локальные' ? 'локальная' : 'глобальная';
            return `${prefix}Тема${p.id} (${scopeText}) — ${p.title}`;
        });
        
        // Пункты для создания новой линии
        const createGlobalOpt = '➕ Создать глобальную линию';
        const createLocalOpt = workName ? '➕ Создать локальную линию' : null;
        const itemsWithCreate = [createGlobalOpt, ...(createLocalOpt ? [createLocalOpt] : []), ...items];
        const displayWithCreate = [createGlobalOpt, ...(createLocalOpt ? [createLocalOpt] : []), ...display];

        this.logDebug(`[insertPlotlineIntoScene] Показываем список из ${itemsWithCreate.length} элементов (с опцией создания)`);
        let chosenId = await this.suggester(itemsWithCreate, displayWithCreate, 'Выберите сюжетную линию');
        this.logDebug(`[insertPlotlineIntoScene] Выбрана опция/линия: ${chosenId || '(отменено)'}`);
        if (!chosenId) return;

        /** @type {{id:string,title:string,description:string,scope:string}|null} */
        let chosen = null;

        // Обработка создания новой линии
        if (chosenId === createGlobalOpt || chosenId === createLocalOpt) {
            const isLocal = (chosenId === createLocalOpt);
            const targetPath = isLocal && workName
                ? `${projectRoot}/1_Рукопись/Произведения/${workName}/Сюжетные_линии.md`
                : `${projectRoot}/Сюжетные_линии.md`;
            const scope = isLocal ? 'локальные' : 'глобальные';
            const title = await this.prompt('Название новой сюжетной линии:');
            if (!title) return;
            const desc = await this.prompt('Краткое описание новой линии (опционально):');

            // Определяем следующий ID
            const existing = await this.collectPlotlines(targetPath, scope);
            const nextId = String(1 + existing.reduce((m, p) => Math.max(m, parseInt(p.id, 10) || 0), 0));
            const block = `\n\n## Тема${nextId} - ${title}\nОписание: ${desc || ''}\n`;
            try {
                const plotFile = this.app.vault.getAbstractFileByPath(targetPath);
                if (plotFile instanceof TFile) {
                    await this.app.vault.append(plotFile, block);
                    this.logDebug(`[insertPlotlineIntoScene] Создана ${scope} линия Тема${nextId} - ${title}`);
                } else {
                    this.logDebug(`[insertPlotlineIntoScene] Не найден файл для добавления: ${targetPath}`);
                    return;
                }
            } catch (e) {
                this.logDebug(`[insertPlotlineIntoScene] Ошибка добавления линии: ${e.message}`);
                return;
            }
            chosen = { id: nextId, title: title, description: desc || '', scope };
        } else {
            // Обычный выбор существующей линии
            chosen = allPlotlines.find((p) => `${p.scope}_Тема${p.id}` === chosenId) || null;
            if (!chosen) {
                this.logDebug(`[ERROR] Выбранная сюжетная линия не найдена: ${chosenId}`);
                return;
            }
        }
        this.logDebug(`[insertPlotlineIntoScene] Найдена/создана сюжетная линия: ${chosen.title}`);

        const degItems = ['прямая', 'связанная', 'фоновая'];
        const degDisplay = ['Прямая — глава напрямую развивает линию', 'Связанная — косвенная связь', 'Фоновая — создаёт фон'];
        const importance = await this.suggester(degItems, degDisplay, 'Важность сюжета в этой сцене');
        if (!importance) return;

        const role = await this.prompt(`Опишите роль главы в «${chosen.title}» (${importance})`);
        
        // Определяем правильный путь к файлу сюжетных линий
        const plotLinesPath = chosen.scope === 'локальные' 
            ? `${projectRoot}/1_Рукопись/Произведения/${workName}/Сюжетные_линии.md`
            : `${projectRoot}/Сюжетные_линии.md`;
            
        const scopeText = chosen.scope === 'локальные' ? 'локальная' : 'глобальная';
        const link = `[[${plotLinesPath}#Тема${chosen.id} - ${chosen.title}|Тема${chosen.id} (${scopeText}) - ${chosen.title}]]`;
        let text = `- **${link}** (${importance})`;
        if (role && role.trim()) text += `: ${role.trim()}`;
        this.logDebug(`[insertPlotlineIntoScene] Вставляем текст: "${text}"`);
        
        
        // Обновим frontmatter сцены: три массива
        try {
            await this.app.fileManager.processFrontMatter(activeFile, (fm) => {
                if (!Array.isArray(fm.plot_lines_lines)) fm.plot_lines_lines = [];
                if (!Array.isArray(fm.plot_lines_degree)) fm.plot_lines_degree = [];
                if (!Array.isArray(fm.plot_lines_description)) fm.plot_lines_description = [];
                if (!fm.plot_lines_lines.includes(chosen.title)) fm.plot_lines_lines.push(chosen.title);
                fm.plot_lines_degree.push(importance);
                fm.plot_lines_description.push(role || '');
            });
            this.logDebug(`[insertPlotlineIntoScene] frontmatter updated (tri-arrays)`);
        } catch (e) {
            this.logDebug(`[insertPlotlineIntoScene] frontmatter update error: ${e.message}`);
        }

        // Вставим читабельную строку в текст
        editor.replaceSelection(text + '\n');
        this.logDebug(`[insertPlotlineIntoScene] replaceSelection выполнен`);
        
        // Добавляем уведомление для проверки
        new Notice(`Сюжетная линия вставлена: ${chosen.title}`);
        
        this.logDebug(`[insertPlotlineIntoScene] === КОНЕЦ ФУНКЦИИ ===`);
        this.logDebug(`Сюжетная линия добавлена: ${chosen.title}`);
    }

    async insertCharacterIntoScene() {
        this.logDebug(`[insertCharacterIntoScene] === НАЧАЛО ФУНКЦИИ ===`);
        let editor = this.getActiveEditor();
        this.logDebug(`[insertCharacterIntoScene] editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
        
        // Fallback для режима просмотра: переключаемся в режим редактирования
        if (!editor) {
            try {
                const leaf = this.app.workspace.getActiveLeaf();
                if (leaf && leaf.setMode) {
                    this.logDebug(`[insertCharacterIntoScene] Переключаемся в режим редактирования`);
                    leaf.setMode('source');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    editor = this.getActiveEditor();
                    this.logDebug(`[insertCharacterIntoScene] После переключения editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
                }
            } catch (e) {
                this.logDebug(`[insertCharacterIntoScene] Не удалось переключиться в режим редактирования: ${e.message}`);
            }
        }
        
        if (!editor) {
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }
        const cache = this.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'сцена') {
            const choice = await this.suggester(['yes', 'no'], ['Вставить', 'Отмена'], 'Текущий файл не является сценой. Вставить всё равно?');
            if (choice !== 'yes') return;
        }

        // Определяем projectRoot
        const parentPath = activeFile.parent ? activeFile.parent.path : '';
        let projectRoot = findProjectRoot(this.app, parentPath) || parentPath || this.activeProjectRoot || '';
        this.logDebug(`[insertCharacterIntoScene] projectRoot: ${projectRoot}`);
        if (!projectRoot) {
            const roots = await getAllProjectRoots(this.app);
            if (!roots || roots.length === 0) {
                this.logDebug(`[ERROR] Проект не найден: отсутствует файл "Настройки_мира.md"`);
                return;
            }
            projectRoot = roots[0];
            this.logDebug(`[insertCharacterIntoScene] projectRoot из roots: ${projectRoot}`);
        }

        // Собираем существующих персонажей
        let charactersList = [];
        try {
            const charsFolder = `${projectRoot}/Персонажи`;
            this.logDebug(`[insertCharacterIntoScene] Загружаем персонажей из: ${charsFolder}`);
            const folder = this.app.vault.getAbstractFileByPath(charsFolder);
            if (folder && folder.children) {
                charactersList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                this.logDebug(`[insertCharacterIntoScene] Найдено персонажей: ${charactersList.length}`);
            }
        } catch (e) {
            this.logDebug(`[insertCharacterIntoScene] Ошибка загрузки персонажей: ${e.message}`);
        }

        // Создаем списки для выбора
        const items = charactersList;
        const display = charactersList.map(name => `👤 ${name}`);
        
        // Пункт для создания нового персонажа
        const createCharacterOpt = '➕ Создать персонажа';
        const itemsWithCreate = [createCharacterOpt, ...items];
        const displayWithCreate = [createCharacterOpt, ...display];

        this.logDebug(`[insertCharacterIntoScene] Показываем список из ${itemsWithCreate.length} элементов (с опцией создания)`);
        let chosenId = await this.suggester(itemsWithCreate, displayWithCreate, 'Выберите персонажа');
        this.logDebug(`[insertCharacterIntoScene] Выбрана опция/персонаж: ${chosenId || '(отменено)'}`);
        if (!chosenId) return;

        let chosenCharacter = null;

        // Обработка создания нового персонажа
        if (chosenId === createCharacterOpt) {
            // Запускаем мастер создания персонажа
            const startPath = activeFile.parent ? activeFile.parent.path : projectRoot;
            try {
                await window.createCharacter(this, startPath);
                this.logDebug(`[insertCharacterIntoScene] Мастер создания персонажа завершён`);
                
                // Перезагружаем список персонажей
                const charsFolder = `${projectRoot}/Персонажи`;
                const folder = this.app.vault.getAbstractFileByPath(charsFolder);
                if (folder && folder.children) {
                    const newCharactersList = folder.children
                        .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                        .map(f => f.basename);
                    
                    // Предлагаем выбрать из обновлённого списка
                    if (newCharactersList.length > 0) {
                        const newItems = newCharactersList;
                        const newDisplay = newCharactersList.map(name => `👤 ${name}`);
                        const newChosenId = await this.suggester(newItems, newDisplay, 'Выберите созданного персонажа');
                        if (newChosenId) {
                            chosenCharacter = newChosenId;
                        }
                    }
                }
            } catch (e) {
                this.logDebug(`[insertCharacterIntoScene] Ошибка создания персонажа: ${e.message}`);
                return;
            }
        } else {
            // Обычный выбор существующего персонажа
            chosenCharacter = chosenId;
        }

        if (!chosenCharacter) {
            this.logDebug(`[ERROR] Персонаж не выбран`);
            return;
        }

        this.logDebug(`[insertCharacterIntoScene] Выбран персонаж: ${chosenCharacter}`);

        // Запрашиваем роль персонажа в сцене
        const role = await this.prompt(`Опишите роль персонажа «${chosenCharacter}» в этой сцене (опционально)`);
        
        // Формируем текст для вставки
        const link = `[[${chosenCharacter}]]`;
        let text = `- **${link}**`;
        if (role && role.trim()) text += `: ${role.trim()}`;
        this.logDebug(`[insertCharacterIntoScene] Вставляем текст: "${text}"`);
        
        // Обновляем frontmatter сцены
        try {
            await this.app.fileManager.processFrontMatter(activeFile, (fm) => {
                if (!Array.isArray(fm.characters)) fm.characters = [];
                if (!fm.characters.includes(chosenCharacter)) {
                    fm.characters.push(chosenCharacter);
                }
            });
            this.logDebug(`[insertCharacterIntoScene] frontmatter updated`);
        } catch (e) {
            this.logDebug(`[insertCharacterIntoScene] frontmatter update error: ${e.message}`);
        }

        // Вставляем читабельную строку в текст
        editor.replaceSelection(text + '\n');
        this.logDebug(`[insertCharacterIntoScene] replaceSelection выполнен`);
        
        // Добавляем уведомление
        new Notice(`Персонаж вставлен: ${chosenCharacter}`);
        
        this.logDebug(`[insertCharacterIntoScene] === КОНЕЦ ФУНКЦИИ ===`);
        this.logDebug(`Персонаж добавлен: ${chosenCharacter}`);
    }

    async insertLocationIntoScene() {
        this.logDebug(`[insertLocationIntoScene] === НАЧАЛО ФУНКЦИИ ===`);
        let editor = this.getActiveEditor();
        this.logDebug(`[insertLocationIntoScene] editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
        
        // Fallback для режима просмотра: переключаемся в режим редактирования
        if (!editor) {
            try {
                const leaf = this.app.workspace.getActiveLeaf();
                if (leaf && leaf.setMode) {
                    this.logDebug(`[insertLocationIntoScene] Переключаемся в режим редактирования`);
                    leaf.setMode('source');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    editor = this.getActiveEditor();
                    this.logDebug(`[insertLocationIntoScene] После переключения editor: ${editor ? 'найден' : 'НЕ НАЙДЕН'}`);
                }
            } catch (e) {
                this.logDebug(`[insertLocationIntoScene] Не удалось переключиться в режим редактирования: ${e.message}`);
            }
        }
        
        if (!editor) {
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }
        const cache = this.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'сцена') {
            const choice = await this.suggester(['yes', 'no'], ['Вставить', 'Отмена'], 'Текущий файл не является сценой. Вставить всё равно?');
            if (choice !== 'yes') return;
        }

        // Определяем projectRoot
        const parentPath = activeFile.parent ? activeFile.parent.path : '';
        let projectRoot = findProjectRoot(this.app, parentPath) || parentPath || this.activeProjectRoot || '';
        this.logDebug(`[insertLocationIntoScene] projectRoot: ${projectRoot}`);
        if (!projectRoot) {
            const roots = await getAllProjectRoots(this.app);
            if (!roots || roots.length === 0) {
                this.logDebug(`[ERROR] Проект не найден: отсутствует файл "Настройки_мира.md"`);
                return;
            }
            projectRoot = roots[0];
            this.logDebug(`[insertLocationIntoScene] projectRoot из roots: ${projectRoot}`);
        }

        // Собираем существующие локации
        let locationsList = [];
        try {
            const locsFolder = `${projectRoot}/Локации`;
            this.logDebug(`[insertLocationIntoScene] Загружаем локации из: ${locsFolder}`);
            const folder = this.app.vault.getAbstractFileByPath(locsFolder);
            if (folder && folder.children) {
                locationsList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                this.logDebug(`[insertLocationIntoScene] Найдено локаций: ${locationsList.length}`);
            }
        } catch (e) {
            this.logDebug(`[insertLocationIntoScene] Ошибка загрузки локаций: ${e.message}`);
        }

        // Создаем списки для выбора
        const items = locationsList;
        const display = locationsList.map(name => `📍 ${name}`);
        
        // Пункт для создания новой локации
        const createLocationOpt = '➕ Создать локацию';
        const itemsWithCreate = [createLocationOpt, ...items];
        const displayWithCreate = [createLocationOpt, ...display];

        this.logDebug(`[insertLocationIntoScene] Показываем список из ${itemsWithCreate.length} элементов (с опцией создания)`);
        let chosenId = await this.suggester(itemsWithCreate, displayWithCreate, 'Выберите локацию');
        this.logDebug(`[insertLocationIntoScene] Выбрана опция/локация: ${chosenId || '(отменено)'}`);
        if (!chosenId) return;

        let chosenLocation = null;

        // Обработка создания новой локации
        if (chosenId === createLocationOpt) {
            // Запускаем мастер создания локации
            const startPath = activeFile.parent ? activeFile.parent.path : projectRoot;
            try {
                await window.createLocation(this, startPath);
                this.logDebug(`[insertLocationIntoScene] Мастер создания локации завершён`);
                
                // Перезагружаем список локаций
                const locsFolder = `${projectRoot}/Локации`;
                const folder = this.app.vault.getAbstractFileByPath(locsFolder);
                if (folder && folder.children) {
                    const newLocationsList = folder.children
                        .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                        .map(f => f.basename);
                    
                    // Предлагаем выбрать из обновлённого списка
                    if (newLocationsList.length > 0) {
                        const newItems = newLocationsList;
                        const newDisplay = newLocationsList.map(name => `📍 ${name}`);
                        const newChosenId = await this.suggester(newItems, newDisplay, 'Выберите созданную локацию');
                        if (newChosenId) {
                            chosenLocation = newChosenId;
                        }
                    }
                }
            } catch (e) {
                this.logDebug(`[insertLocationIntoScene] Ошибка создания локации: ${e.message}`);
                return;
            }
        } else {
            // Обычный выбор существующей локации
            chosenLocation = chosenId;
        }

        if (!chosenLocation) {
            this.logDebug(`[ERROR] Локация не выбрана`);
            return;
        }

        this.logDebug(`[insertLocationIntoScene] Выбрана локация: ${chosenLocation}`);

        // Запрашиваем роль локации в сцене
        const role = await this.prompt(`Опишите роль локации «${chosenLocation}» в этой сцене (опционально)`);
        
        // Формируем текст для вставки
        const link = `[[${chosenLocation}]]`;
        let text = `- **${link}**`;
        if (role && role.trim()) text += `: ${role.trim()}`;
        this.logDebug(`[insertLocationIntoScene] Вставляем текст: "${text}"`);
        
        // Обновляем frontmatter сцены
        try {
            await this.app.fileManager.processFrontMatter(activeFile, (fm) => {
                if (!Array.isArray(fm.locations)) fm.locations = [];
                if (!fm.locations.includes(chosenLocation)) {
                    fm.locations.push(chosenLocation);
                }
            });
            this.logDebug(`[insertLocationIntoScene] frontmatter updated`);
        } catch (e) {
            this.logDebug(`[insertLocationIntoScene] frontmatter update error: ${e.message}`);
        }

        // Вставляем читабельную строку в текст
        editor.replaceSelection(text + '\n');
        this.logDebug(`[insertLocationIntoScene] replaceSelection выполнен`);
        
        // Добавляем уведомление
        new Notice(`Локация вставлена: ${chosenLocation}`);
        
        this.logDebug(`[insertLocationIntoScene] === КОНЕЦ ФУНКЦИИ ===`);
        this.logDebug(`Локация добавлена: ${chosenLocation}`);
    }
    // Вспомогательные методы для модальных окон
    async prompt(header, initialValue) {
        // console.log(`[DEBUG] prompt вызван с header: "${header}", initialValue: "${initialValue}"`);
        this.logDebug(`[DEBUG] prompt вызван с header: "${header}", initialValue: "${initialValue}"`);
        
        try {
            // console.log('[DEBUG] Создаем PromptModal...');
            this.logDebug('[DEBUG] Создаем PromptModal...');
            const modal = new PromptModal(this.app, Modal, Setting, Notice, header, initialValue);
            // console.log('[DEBUG] PromptModal создан, вызываем openAndGetValue...');
            this.logDebug('[DEBUG] PromptModal создан, вызываем openAndGetValue...');
            const result = await modal.openAndGetValue();
            // console.log(`[DEBUG] prompt вернул: "${result}"`);
            this.logDebug(`[DEBUG] prompt вернул: "${result}"`);
            return result;
        } catch (error) {
            console.error('[DEBUG] Ошибка в prompt:', error);
            this.logDebug(`[DEBUG] Ошибка в prompt: ${error.message}`);
            throw error;
        }
    }

    async suggester(items, display, placeholder) {
        // console.log(`[DEBUG] suggester вызван с items: ${items.length}, display: ${display.length}, placeholder: "${placeholder}"`);
        this.logDebug(`[DEBUG] suggester вызван с items: ${items.length}, display: ${display.length}, placeholder: "${placeholder}"`);
        
        try {
            // console.log('[DEBUG] Создаем SuggesterModal...');
            this.logDebug('[DEBUG] Создаем SuggesterModal...');
            const modal = new SuggesterModal(this.app, Modal, Setting, Notice, items, display, placeholder);
            // console.log('[DEBUG] SuggesterModal создан, вызываем openAndGetValue...');
            this.logDebug('[DEBUG] SuggesterModal создан, вызываем openAndGetValue...');
            const result = await modal.openAndGetValue();
            // console.log(`[DEBUG] suggester вернул: "${result}"`);
            this.logDebug(`[DEBUG] suggester вернул: "${result}"`);
            return result;
        } catch (error) {
            console.error('[DEBUG] Ошибка в suggester:', error);
            this.logDebug(`[DEBUG] Ошибка в suggester: ${error.message}`);
            throw error;
        }
    }

    async selectProject(projects) {
        return new Promise((resolve) => {
            const modal = new ProjectSelectorModal(this.app, Modal, Setting, Notice, projects, (selectedProject) => {
                resolve(selectedProject);
            });
            modal.open();
        });
    }

    async selectChapter(chapters) {
        return new Promise((resolve) => {
            const modal = new ChapterSelectorModal(this.app, Modal, Setting, Notice, chapters, (selectedChapter) => {
                resolve(selectedChapter);
            });
            modal.open();
        });
    }

    async readTemplateFile(templateName) {
        // Сначала пробуем прочитать из папки плагина
        try {
            // @ts-ignore
            const pluginTemplatePath = '.obsidian/plugins/literary-templates/templates/' + templateName + '.md';
            this.logDebug(`Пробуем прочитать относительный путь: ${pluginTemplatePath}`);
            const content = await this.app.vault.adapter.read(pluginTemplatePath);
            this.logDebug(`Шаблон найден в папке плагина, длина: ${content.length}`);
            return content;
        } catch (error) {
            this.logDebug(`Ошибка чтения из папки плагина: ${error.message}`);
            // Файл не найден в папке плагина, пробуем vault
        }
        
        // Fallback: ищем в vault (для пользовательских шаблонов)
        const userTemplatePath = `Шаблоны/Литшаблоны/${templateName}.md`;
        let templateFile = this.app.vault.getAbstractFileByPath(userTemplatePath);
        
        if (!(templateFile instanceof TFile)) {
            this.logDebug(`Шаблон не найден и в vault по пути: ${userTemplatePath}`);
            throw new Error(`Template file not found: ${templateName}.md (searched in plugin templates and ${userTemplatePath})`);
        }
        
        return await this.app.vault.read(templateFile);
    }

    applyTemplate(templateContent, data) {
        let content = templateContent;
        
        // Обработка условных операторов {{#if условие}} ... {{/if}}
        content = this.processConditionalBlocks(content, data);
        
        // Замена обычных плейсхолдеров {{key}}
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(placeholder, data[key]);
            }
        }
        
        return content;
    }
    
    processConditionalBlocks(content, data) {
        // Регулярное выражение для поиска условных блоков
        // {{#if условие}} содержимое {{/if}}
        const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
        
        return content.replace(conditionalRegex, (_match, condition, blockContent) => {
            // Проверяем условие
            const isTrue = this.evaluateCondition(condition, data);
            
            if (isTrue) {
                // Если условие истинно, возвращаем содержимое блока
                return blockContent;
            } else {
                // Если условие ложно, возвращаем пустую строку
                return '';
            }
        });
    }
    
    evaluateCondition(condition, data) {
        // Убираем лишние пробелы
        condition = condition.trim();
        
        // Проверяем различные типы условий
        
        // 1. Проверка существования ключа: {{#if key}}
        if (data.hasOwnProperty(condition)) {
            const value = data[condition];
            // Возвращаем true если значение существует и не пустое
            return value !== null && value !== undefined && value !== '';
        }
        
        // 2. Проверка существования файла: {{#if file:path/to/file}}
        if (condition.startsWith('file:')) {
            const filePath = condition.substring(5); // Убираем 'file:'
            try {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                return file !== null;
             
            } catch (e) {
                return false;
            }
        }
        
        // 3. Проверка существования изображения: {{#if image:type}}
        if (condition.startsWith('image:')) {
            const imageType = condition.substring(6); // Убираем 'image:'
            const imagePath = `img/${imageType}.jpg`;
            try {
                const file = this.app.vault.getAbstractFileByPath(imagePath);
                return file !== null;
             
            } catch (e) {
                return false;
            }
        }
        
        // 4. Булевые значения: {{#if true}} или {{#if false}}
        if (condition === 'true') return true;
        if (condition === 'false') return false;
        
        // 5. Сравнение: {{#if key == value}}
        const comparisonMatch = condition.match(/^(.+)\s*==\s*(.+)$/);
        if (comparisonMatch) {
            const key = comparisonMatch[1].trim();
            const value = comparisonMatch[2].trim();
            return data[key] === value;
        }
        
        // 6. Неравенство: {{#if key != value}}
        const notEqualMatch = condition.match(/^(.+)\s*!=\s*(.+)$/);
        if (notEqualMatch) {
            const key = notEqualMatch[1].trim();
            const value = notEqualMatch[2].trim();
            // Если value - это строка без кавычек, сравниваем как строку
            if (value && !value.startsWith('"') && !value.startsWith('\'')) {
                return data[key] !== value;
            } else {
                // Если value в кавычках, убираем их
                const cleanValue = value.replace(/^["']|["']$/g, '');
                return data[key] !== cleanValue;
            }
        }
        
        // По умолчанию возвращаем false
        return false;
    }
    
    async processIncludeBlocks(content) {
        // Регулярное выражение для поиска include-блоков
        // {{include:path/to/file}}
        const includeRegex = /{{include:([^}]+)}}/g;
        
        // Используем Promise.all для обработки всех include-блоков параллельно
        const promises = [];
        const matches = [];
        
        let match;
        while ((match = includeRegex.exec(content)) !== null) {
            matches.push(match);
            promises.push(this.processSingleInclude(match[1]));
        }
        
        // Ждем все результаты
        const results = await Promise.all(promises);
        
        // Заменяем все include-блоки
        let result = content;
        for (let i = 0; i < matches.length; i++) {
            result = result.replace(matches[i][0], results[i]);
        }
        
        return result;
    }
    
    async processSingleInclude(filePath) {
            try {
                // Сначала пробуем найти в vault (для пользовательских файлов)
                let foundFile = this.app.vault.getAbstractFileByPath(filePath);
                
                if (!foundFile) {
                    // Если не найден в vault, ищем в папке плагина
                    const pluginPath = '.obsidian/plugins/literary-templates/templates/' + filePath;
                    foundFile = this.app.vault.getAbstractFileByPath(pluginPath);
                }
                
                if (!foundFile) {
                    // Если всё ещё не найден, пробуем относительные пути
                    const possiblePaths = [
                        'templates/' + filePath,
                        'sections/' + filePath.replace('sections/', ''),
                        filePath.replace('sections/', '')
                    ];
                    
                    for (const path of possiblePaths) {
                        foundFile = this.app.vault.getAbstractFileByPath(path);
                        if (foundFile) break;
                    }
                }
                
                if (foundFile && foundFile instanceof TFile) {
                    try {
                        const fileContent = await this.app.vault.read(foundFile);
                        return fileContent;
                    } catch (readError) {
                        return `<!-- INCLUDE ERROR: ${filePath} - read error: ${readError.message} -->`;
                    }
                } else {
                    // Если файл не найден в vault, пробуем прочитать напрямую из файловой системы
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        
                        // Путь к папке плагина
                        const pluginDir = path.join(this.app.vault.adapter.basePath, '.obsidian', 'plugins', 'literary-templates', 'templates');
                        const fullPath = path.join(pluginDir, filePath);
                        
                        if (fs.existsSync(fullPath)) {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            return content;
                        }
                     
                    } catch (e) {
                        // Игнорируем ошибки файловой системы
                    }
                    
                    return `<!-- INCLUDE ERROR: ${filePath} not found -->`;
                }
            } catch (error) {
                return `<!-- INCLUDE ERROR: ${filePath} - ${error.message} -->`;
            }
    }

    // Переопределяем loadCSS чтобы избежать ошибок при инициализации
    loadCSS() {
        // Не загружаем CSS до полной инициализации плагина
        return Promise.resolve();
    }
    // addFolderClickHandlers() - ОТКЛЮЧЕНО
    // (создаёт множественные обработчики и бесконечные циклы)

    async onload() {
        // console.log('Literary Templates plugin onload started');
        // console.log('Текущее время:', new Date().toISOString());
        // console.log('this:', this);
        // console.log('this.app:', this.app);
        // console.log('this.manifest:', this.manifest);
        
        // Пробуем разные способы получения app
        let app = null;
        let appTries = 0;
        
        while (!app && appTries < 50) {
            // console.log(`Попытка ${appTries + 1}/50: поиск app...`);
            
            // Способ 1: this.app
            if (this.app) {
                app = this.app;
                // console.log('Найден this.app');
                break;
            }
            
            // Способ 2: window.app
            if (window.app) {
                app = window.app;
                // console.log('Найден window.app');
                break;
            }
            
            // Способ 3: ждем и пробуем снова
            await new Promise(res => window.setTimeout(res, 300));
            appTries++;
        }
        
        if (!app) {
            console.error('Ошибка: app не найден ни через this.app, ни через window.app');
            this.logDebug(`[ERROR] Ошибка: app не найден`);
            return;
        }
        
        // Присваиваем app к this.app для совместимости
        this.app = app;
        // console.log('App найден и присвоен к this.app');
        // console.log('App доступен:', !!this.app);
        
        // Теперь ждём, пока app.vault будет готов
        let vaultTries = 0;
        while ((!this.app.vault || !this.app.vault.adapter) && vaultTries < 50) {
            // console.log(`Попытка ${vaultTries + 1}/50: ожидание инициализации app.vault...`);
            await new Promise(res => window.setTimeout(res, 300));
            vaultTries++;
        }
        
        if (!this.app.vault || !this.app.vault.adapter) {
            console.error('Ошибка: app.vault не инициализирован после 50 попыток');
            this.logDebug(`[ERROR] Ошибка: app.vault не инициализирован`);
            return;
        }
        
        // console.log('App.vault доступен:', !!(this.app && this.app.vault));
        // console.log('App.vault.adapter доступен:', !!(this.app && this.app.vault && this.app.vault.adapter));
        // console.log('Vault инициализирован успешно');
        // console.log('Vault путь:', this.app.vault.adapter.basePath);
        
        // Инициализируем базовые настройки
        this.settings = {
            aiKeys: [],
            currentKeyIndex: 0,
            keyUsage: {},
            aiEnabled: true,
            defaultModel: 'openrouter/mistralai/mistral-7b-instruct',
            maxTokens: 2000,
            temperature: 0.7,
            author: '' // <--- новое поле
        };

        // Инициализируем новые модули
        try {
            this.settingsManager = new SettingsManager(this);
            this.templateManager = new TemplateManager(this);
            this.projectManager = new ProjectManager(this);
            this.uiHelpers = new UIHelpers();
            this.commandRegistry = new CommandRegistry(this);
        } catch (e) {
            console.warn('Ошибка инициализации новых модулей:', e);
        }
        
        // Теперь можно безопасно работать с vault - загружаем настройки
        try {
        this.settings = await loadSettingsFromFile(this.app);
        } catch (e) {
            console.warn('Ошибка загрузки настроек плагина:', e);
            // Используем дефолтные настройки, которые уже установлены выше
        }
        
        // Принудительно создаем папку для логов
        try {
            const pluginDir = '.obsidian/plugins/literary-templates';
            await this.app.vault.adapter.mkdir(pluginDir);
            // console.log('Папка плагина создана/проверена:', pluginDir);
        } catch (e) {
            console.warn('Ошибка создания папки плагина:', e);
        }
        
        // Пытаемся получить manifest, если его нет
        if (!this.manifest) {
            // console.log('this.manifest недоступен, пытаемся найти альтернативно...');
            
            // Способ 1: через window.app.plugins
            if (window.app && window.app.plugins) {
                const plugin = window.app.plugins.plugins['literary-templates'];
                if (plugin && plugin.manifest) {
                    this.manifest = plugin.manifest;
                    // console.log('Manifest найден через window.app.plugins');
                }
            }
            
            // Способ 2: через this.app.plugins
            if (!this.manifest && this.app && this.app.plugins) {
                const plugin = this.app.plugins.plugins['literary-templates'];
                if (plugin && plugin.manifest) {
                    this.manifest = plugin.manifest;
                    // console.log('Manifest найден через this.app.plugins');
                }
            }
            
            // Способ 3: создаем базовый manifest вручную
            if (!this.manifest) {
                // console.log('Создаем базовый manifest вручную');
                this.manifest = {
                    id: 'literary-templates',
                    name: 'Literary Templates',
                    version: '1.0.0',
                    dir: '.obsidian/plugins/literary-templates'
                };
                // console.log('Базовый manifest создан:', this.manifest);
            }
        }


        // ... остальная инициализация ...
        // console.log('Literary Templates plugin loading...');
        this.activeProjectRoot = null;
        this.debugEnabled = false;
        // console.log('Базовые переменные инициализированы');

        // 1. Ждем загрузки данных (ВАЖНО: this.app гарантированно инициализирован только после этого)
        let data = null;
        try {
            // Проверяем, что manifest доступен перед вызовом loadData
            if (!this.manifest) {
                console.warn('Manifest недоступен, пропускаем loadData');
                data = {};
            } else {
            data = await this.loadData();
            }
        } catch (e) {
            console.warn('Ошибка загрузки данных плагина:', e);
            data = {};
        }

        // ВАЖНО: все действия только после loadData!
        if (data && data.activeProjectRoot) {
            this.activeProjectRoot = data.activeProjectRoot;
        }
        if (data && typeof data.debugEnabled === 'boolean') {
            this.debugEnabled = data.debugEnabled;
        }
        // Загружаем настройки AI
        if (data && data.aiKeys) {
            this.settings.aiKeys = data.aiKeys;
        }
        if (data && typeof data.currentKeyIndex === 'number') {
            this.settings.currentKeyIndex = data.currentKeyIndex;
        }
        if (data && data.keyUsage) {
            this.settings.keyUsage = data.keyUsage;
        }
        if (data && typeof data.aiEnabled === 'boolean') {
            this.settings.aiEnabled = data.aiEnabled;
        }
        if (data && data.aiProvider) {
            this.settings.aiProvider = data.aiProvider;
        }
        if (data && data.defaultModel) {
            this.settings.defaultModel = data.defaultModel;
        }
        if (data && typeof data.maxTokens === 'number') {
            this.settings.maxTokens = data.maxTokens;
        }
        if (data && typeof data.temperature === 'number') {
            this.settings.temperature = data.temperature;
        }
        if (data && data.author) {
            this.settings.author = data.author;
        }

        this.registerCommands();

        // ... далее весь остальной код onload без циклов ожидания и window.setTimeout ...
        // (оставить только логику, которая была после loadData)
        
        // Регистрируем обработчики контекстного меню через MenuRegistry
        try {
            const { MenuRegistry } = require('./src/MenuRegistry.js');
            this.menuRegistry = new MenuRegistry(this);
            this.menuRegistry.registerAll();
        } catch (e) {
            console.warn('MenuRegistry init failed:', e);
        }
        // Автозапуск редактора при открытии файла "Редактор_настроек.md"
        this.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                try {
                    if (!(file instanceof TFile)) return;
                    if (file.basename !== 'Редактор_настроек') return;
                    const parentPath = file.parent ? file.parent.path : '';
                    const projectRoot = findProjectRoot(this.app, parentPath) || parentPath;
                    this.logDebug('Auto-open WorldSettings editor for: ' + projectRoot);
                    await this.editWorldSettings(projectRoot);
                    // Автозакрытие вкладки с файлом редактора, чтобы не мешал
                    window.setTimeout(() => {
                        try {
                            const leaves = this.app.workspace.getLeavesOfType('markdown');
                            for (const leaf of leaves) {
                                const view = leaf.view;
                                if (view && view.file && view.file.path === file.path) {
                                    // Закрываем вкладку
                                    if (typeof leaf.detach === 'function') {
                                        leaf.detach();
                                    } else if (this.app.workspace.detachLeaf) {
                                        // @ts-ignore старые версии API
                                        this.app.workspace.detachLeaf(leaf);
                                    }
                                }
                            }
                        } catch (e) {
                            // ignore
                        }
                    }, 50);
                } catch (e) {
                    this.logDebug('file-open handler error: ' + e.message);
                }
            })
        );
        
        // Автоматическое открытие файла с именем папки при клике на папку - ОТКЛЮЧЕНО
        // (создаёт множественные обработчики и бесконечные циклы)
        // Автозапуск мастеров при создании пустых файлов в целевых папках Магии (мягкий режим)
        this.registerEvent(
            this.app.vault.on('create', async (abstractFile) => {
                try {
                    if (!(abstractFile instanceof TFile)) return;
                    if (!abstractFile.extension || abstractFile.extension.toLowerCase() !== 'md') return;
                    const parentPath = abstractFile.parent ? abstractFile.parent.path : '';
                    if (!parentPath) return;
                    // Определяем корень проекта
                    const projectRoot = findProjectRoot(this.app, parentPath);
                    if (!projectRoot) return;
                    // Проверяем, что файл пустой
                    let isEmpty = true;
                    try {
                        if (abstractFile.stat && typeof abstractFile.stat.size === 'number') {
                            isEmpty = abstractFile.stat.size === 0;
                        } else {
                            const text = await this.app.vault.read(abstractFile);
                            isEmpty = !String(text || '').trim();
                        }
                     
                    } catch (e) {}
                    if (!isEmpty) return;
                    // Относительный путь от projectRoot
                    const rel = abstractFile.path.startsWith(projectRoot + '/')
                        ? abstractFile.path.slice(projectRoot.length + 1)
                        : '';
                    if (!rel) return;
                    // Карта целевых папок → тип мастера
                    const map = [
                        { prefix: 'Магия/Зелья/', type: 'potion' },
                        { prefix: 'Магия/Заклинания/', type: 'spell' },
                        { prefix: 'Магия/Артефакты/', type: 'artifact' },
                        { prefix: 'Магия/Алхимия/', type: 'alchemy' },
                    ];
                    const found = map.find(m => rel.startsWith(m.prefix));
                    if (!found) return;
                    const baseName = abstractFile.basename || '';
                    // Всегда передаем имя файла как предзаполнение, даже если это "Без названия"
                    const prefillName = baseName;
                    
                    // Мягкий запуск: спрашиваем подтверждение
                    const actionMap = {
                        potion: 'зелья',
                        spell: 'заклинания',
                        artifact: 'артефакта',
                        alchemy: 'алхимического рецепта',
                    };
                    const confirm = await this.suggester(
                        ['yes', 'no'],
                        ['Запустить мастер', 'Отмена'],
                        `Обнаружен новый пустой файл ${actionMap[found.type]} «${baseName}». Запустить мастер и заполнить его?`
                    );
                    if (confirm !== 'yes') return;
                    const options = { targetFile: abstractFile, prefillName: prefillName };
                    // Запускаем соответствующий мастер с предзаполнением и записью в уже созданный файл
                    switch (found.type) {
                        case 'potion':
                            await window.createPotion(this, projectRoot, options);
                            break;
                        case 'spell':
                            await window.createSpell(this, projectRoot, options);
                            break;
                        case 'artifact':
                            await window.createArtifact(this, projectRoot, options);
                            break;
                        case 'alchemy':
                            await window.createAlchemyRecipe(this, projectRoot, options);
                            break;
                        default:
                            break;
                    }
                } catch (e) {
                    this.logDebug('create event handler error: ' + (e && e.message ? e.message : String(e)));
                }
            })
        );
        // Автоматическое создание файлов управления при создании папок
        this.registerEvent(
            this.app.vault.on('create', async (abstractFile) => {
                try {
                    if (!(abstractFile instanceof TFolder)) return;
                    
                    const folderPath = abstractFile.path;
                    const folderName = abstractFile.name;
                    
                    // Проверяем, не является ли это корневой папкой проекта
                    if (folderPath.split('/').length === 1) {
                        return; // Пропускаем корневые папки
                    }
                    
                    // Пропускаем папки, которые создаются системно при создании сущностей
                    const systemFolders = [
                                // Рукопись и её подкатегории
        '1_Рукопись',  'Сцены', 'События', 'Конфликты', 'Квесты',
                        
                        // Локации и их подкатегории
                        'Локации', 'Государства', 'Провинции', 'Фракции', 'Торговые_пути',
                        'Города', 'Деревни', 'Замки', 'Порты', 'Шахты', 'Фермы', 'Заводы', 'Мёртвые_зоны',
                        
                        // Персонажи и социальные объекты
                        'Персонажи', 'Народы', 'Организации', 'Религии', 'Культы',
                        
                        // Магия и её подкатегории
                        'Магия', 'Зелья', 'Заклинания', 'Артефакты', 'Алхимия',
                        
                        // Справочники и задачи
                        'Справочник', 'Руководства', 'Задачи'
                    ];
                    
                    // Пропускаем папки произведений (они создают свои файлы через createWork)
                    if (folderPath.includes('/1_Рукопись/Произведения/')) {
                        console.log(`[AUTO-INDEX] Пропускаем создание индексного файла для папки произведения: ${folderName} (путь: ${folderPath})`);
                        this.logDebug(`Пропускаем создание индексного файла для папки произведения: ${folderName}`);
                        return;
                    }
                    if (systemFolders.includes(folderName)) {
                        return; // Пропускаем системные папки
                    }

                    if (/^Глава/i.test(folderName)) {
                        this.logDebug(`Пропускаем создание индексного файла для папки: ${folderName}`);
                        return;
                    }
                    
                    // Проверяем, есть ли уже файл управления
                    const managementFilePath = `${folderPath}/${folderName}.md`;
                    const existingFile = this.app.vault.getAbstractFileByPath(managementFilePath);
                    
                    if (!existingFile) {
                        try {
                            // Создаем файл управления с базовым содержимым
                            const content = [
                                `# ${folderName}`,
                                '',
                                '## Описание',
                                '',
                                '## Содержимое',
                                '',
                                '```dataview',
                                'LIST',
                                `FROM "${folderPath}"`,
                                'WHERE file.name != this.file.name',
                                'SORT file.name ASC',
                                '```',
                                ''
                            ].join('\n');
                            
                            await this.app.vault.create(managementFilePath, content);
                            console.log(`[AUTO-INDEX] Создан файл управления для папки "${folderName}" по пути: ${managementFilePath}`);
                            this.logDebug(`Создан файл управления для папки "${folderName}"`);
                        } catch (e) {
                            this.logDebug('Ошибка создания файла управления: ' + (e && e.message ? e.message : String(e)));
                        }
                    } else {
                        this.logDebug(`Файл управления уже существует: ${managementFilePath}`);
                    }
                } catch (e) {
                    this.logDebug('folder create event handler error: ' + (e && e.message ? e.message : String(e)));
                }
            })
        );

        const startPath = this.getCurrentStartPath();
await this.loadButtonIconsScript();


        // Регистрируем все команды через CommandRegistry
        if (this.commandRegistry) {
            this.commandRegistry.registerAllCommands();
        } else {
            console.warn('CommandRegistry не инициализирован, регистрируем команды вручную');
            // Fallback: регистрируем команды вручную
            this.registerCommandsManually();
        }

        
        // Команды для работы с эпохами и произведениями
        this.addCommand({
            id: 'select-epoch',
            name: 'Выбрать эпоху',
            callback: async () => {
                const { EpochSelectorModal } = require('./creators/EpochSelectorModal');
                const modal = new EpochSelectorModal(this.app, this);
                modal.open();
            },
        });
        
        this.addCommand({
            id: 'create-work',
            name: 'Создать произведение',
            callback: async () => {
                try {
                    if (typeof window.createWork === 'function') {
                        await window.createWork(this);
                    } else {
                        new Notice('Функция создания произведения недоступна. Перезагрузите плагин.');
                    }
                } catch (error) {
                    console.error('Ошибка создания произведения:', error);
                    new Notice('Ошибка создания произведения: ' + error.message);
                }
            },
        });
        
        this.addCommand({
            id: 'migrate-existing-content',
            name: 'Мигрировать существующий контент',
            callback: async () => {
                const { migrateExistingContent } = require('./creators/migrateExistingContent');
                await migrateExistingContent(this);
            },
        });
        
        // Команда 'Управление AI ключами' регистрируется ниже, удалён дубликат
        
        this.addCommand({
            id: 'create-new-potion',
            name: 'Создать новое зелье',
            callback: async () => {
                const project = await findProjectRoot(this.app);
                if (!project) return;
                const modal = new PotionWizardModal(this.app, Modal, Setting, Notice, project, async () => {
                    // Логика создания файла зелья здесь
                });
                modal.open();
            }
        });
        this.addCommand({
            id: 'create-new-spell-wizard',
            name: 'Создать новое заклинание (мастер)',
            callback: this.createEntityCallback(createSpell),
        });
        this.addCommand({
            id: 'insert-todo',
            name: 'Вставить TODO',
            callback: () => this.insertTodoAtCursor(),
        });
        this.addCommand({
            id: 'insert-plotline-into-scene',
            name: 'Вставить сюжетную линию в сцену',
            callback: () => this.insertPlotlineIntoScene(),
        });
        this.addCommand({
            id: 'insert-character-into-scene',
            name: 'Вставить персонажа в сцену',
            callback: () => this.insertCharacterIntoScene(),
        });
        this.addCommand({
            id: 'insert-location-into-scene',
            name: 'Вставить локацию в сцену',
            callback: () => this.insertLocationIntoScene(),
        });
        this.addCommand({
            id: 'insert-plotline',
            name: 'Вставить сюжетную линию',
            callback: () => this.insertPlotlineIntoScene(),
        });
        this.addCommand({
            id: 'open-writer-handbook',
            name: 'Справочник писателя (создать/открыть)',
            callback: async () => {
                try {
                    await this.openWriterHandbook();
                } catch (e) {
                    this.logDebug('Ошибка открытия справочника: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'add-project-tasks-block',
            name: 'Проект: добавить виджет задач (Dataview) на главную',
            callback: async () => {
                try {
                    const projectRoot = this.getCurrentProjectRoot();
                    if (!projectRoot) { this.logDebug(`[ERROR] Проект не найден`); return; }
                    const mainPath = `${projectRoot}/${projectRoot.split('/').pop()}.md`;
                    const file = this.app.vault.getAbstractFileByPath(mainPath);
                    if (!(file instanceof TFile)) { this.logDebug(`[ERROR] Главный файл проекта не найден`); return; }
                    let content = await this.app.vault.read(file);
                    if (content.includes('## Задачи проекта')) { this.logDebug(`[ERROR] Виджет задач уже добавлен`); return; }
                    const dvBlock = [
                        '',
                        '## Задачи проекта',
                        '',
                        '```dataview',
                        'TASK',
                        `WHERE !completed AND contains(file.path, "${projectRoot}/")`,
                        'SORT file.ctime desc',
                        '```',
                        ''
                    ].join('\n');
                    await this.app.vault.modify(file, content + dvBlock);
                    this.logDebug('Виджет задач добавлен');
                } catch (e) {
                    this.logDebug('Ошибка добавления виджета задач: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'add-project-overview-block',
            name: 'Проект: добавить список файлов (2 уровня)',
            callback: async () => {
                try {
                    const projectRoot = this.getCurrentProjectRoot();
                    if (!projectRoot) { this.logDebug(`[ERROR] Проект не найден`); return; }
                    const mainPath = `${projectRoot}/${projectRoot.split('/').pop()}.md`;
                    const file = this.app.vault.getAbstractFileByPath(mainPath);
                    if (!(file instanceof TFile)) { this.logDebug(`[ERROR] Главный файл проекта не найден`); return; }
                    let content = await this.app.vault.read(file);
                    if (content.includes('```folder-overview')) { this.logDebug(`[ERROR] Блок folder-overview уже есть`); return; }
                    const foBlock = [
                        '',
                        '## Обзор проекта',
                        '',
                        '```folder-overview',
                        `folderPath: "${projectRoot}"`,
                        'title: "Обзор проекта"',
                        'showTitle: false',
                        'depth: 2',
                        'includeTypes:',
                        '  - folder',
                        '  - markdown',
                        'style: list',
                        'disableFileTag: false',
                        'sortBy: name',
                        'sortByAsc: true',
                        'showEmptyFolders: false',
                        'onlyIncludeSubfolders: false',
                        'storeFolderCondition: true',
                        'showFolderNotes: true',
                        'disableCollapseIcon: true',
                        'alwaysCollapse: false',
                        'autoSync: true',
                        'allowDragAndDrop: true',
                        'hideLinkList: true',
                        'hideFolderOverview: false',
                        'useActualLinks: false',
                        'fmtpIntegration: false',
                        '```',
                        ''
                    ].join('\n');
                    await this.app.vault.modify(file, content + foBlock);
                    this.logDebug('Список файлов (2 уровня) добавлен');
                } catch (e) {
                    this.logDebug('Ошибка добавления списка файлов: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'set-writer-handbook-status',
            name: 'Справочник: установить статус (planned/started/writing/done/abandoned)',
            callback: async () => {
                try {
                    await this.setWriterHandbookStatus();
                } catch (e) {
                    this.logDebug('Ошибка смены статуса: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'open-writer-handbook',
            name: 'Справочник писателя (создать/открыть)',
            callback: async () => {
                try {
                    await this.openWriterHandbook();
                } catch (e) {
                    this.logDebug('Ошибка открытия справочника: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'toggle-debug-logging',
            name: 'Переключить отладку (логирование)',
            callback: async () => {
                try {
                    this.debugEnabled = !this.debugEnabled;
                    const state = this.debugEnabled ? 'включена' : 'выключена';
                    this.logDebug(`Отладка ${state}`);
                    let prev = {};
                    try {
                        prev = (await this.loadData()) || {};
                                    } catch (e) {
                    console.warn('Ошибка загрузки данных для отладки:', e);
                    }
                    try {
                    await this.saveData({
                        ...prev,
                        activeProjectRoot: this.activeProjectRoot || prev.activeProjectRoot || null,
                        debugEnabled: this.debugEnabled
                    });
                } catch (e) {
                        console.warn('Ошибка сохранения данных плагина:', e);
                    }
                } catch (e) {
                    this.logDebug('Не удалось переключить отладку: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'create-log-file',
            name: 'Создать лог файл (принудительно)',
            callback: async () => {
                try {
                    console.log('Команда create-log-file вызвана');
                    
                    // Проверяем доступность vault
                    if (!this.app || !this.app.vault || !this.app.vault.adapter) {
                        this.logDebug(`[ERROR] Ошибка: app.vault недоступен`);
                        console.error('app.vault недоступен для создания лог-файла');
                        return;
                    }
                    
                    // Принудительно создаем папку плагина
                    const pluginDir = '.obsidian/plugins/literary-templates';
                    try {
                        await this.app.vault.adapter.mkdir(pluginDir);
                        console.log('Папка плагина создана:', pluginDir);
                    } catch (mkdirError) {
                        console.log('Папка плагина уже существует:', mkdirError.message);
                    }
                    
                    // Создаем тестовый лог-файл
                    const logPath = '.obsidian/plugins/literary-templates/log.md';
                    const testContent = `# Лог плагина Literary Templates
Создан: ${new Date().toISOString()}
## Тестовая запись
Лог-файл создан принудительно через команду.
---
`;
                     try {
                        await this.app.vault.adapter.write(logPath, testContent);
                        console.log('Лог-файл создан успешно:', logPath);
                        this.logDebug('Лог файл создан успешно');
                    } catch (writeError) {
                        console.error('Ошибка записи лог-файла:', writeError);
                        this.logDebug('Ошибка записи лог-файла: ' + writeError.message);
                    }
                } catch (e) {
                    console.error('Общая ошибка в create-log-file:', e);
                    this.logDebug('Ошибка создания лог файла: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'create-new-character',
            name: 'Создать нового персонажа',
            callback: this.createEntityCallback(createCharacter),
        });
        this.addCommand({
            id: 'create-monster',
            name: 'Создать монстра',
            callback: this.createEntityCallback(createMonster),
        });
        this.addCommand({
            id: 'create-world',
            name: 'Создать новый мир/проект',
            callback: async () => {
                try {
                    if (typeof window.WorldWizardModal !== 'function') {
                        console.error('[ERROR] WorldWizardModal недоступен');
                        new Notice('Ошибка: WorldWizardModal не загружен');
                        return;
                    }
                    
                    // Выбираем родительскую папку для проекта
                    const parentFolder = await this._selectProjectParentFolder();
                    if (!parentFolder) {
                        console.log('Создание мира отменено: не выбрана родительская папка');
                        return;
                    }
                    console.log(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                    
                    const modal = new window.WorldWizardModal(this.app, this, parentFolder);
                    modal.open();
                } catch (error) {
                    console.error('Ошибка при создании мира:', error);
                    new Notice('Ошибка при создании мира: ' + error.message);
                }
            },
        });
        this.addCommand({
            id: 'edit-world-settings',
            name: 'Редактировать настройки мира',
            callback: () => this.editWorldSettings(),
        });

        // Регистрируем obsidian:// обработчик
        try {
            this.registerObsidianProtocolHandler('literary-templates', async (params) => {
                const action = params.action;
                if (action === 'edit-settings') {
                    const path = params.path ? decodeURIComponent(params.path) : '';
                    // Если передан vault и он не совпадает — просто продолжаем, Obsidian сам проверит соответствие
                    this.logDebug('Protocol edit-settings for path: ' + path);
                    await this.editWorldSettings(path);
                }
            });
        } catch (e) {
            this.logDebug('Protocol handler error: ' + e.message);
        }
        
        // Делаем функции create* доступными в глобальной области видимости
        window.createWorld = createWorld;
        window.createChapter = createChapter;
        window.createCity = createCity;
        window.createLocation = createLocation;
        window.createScene = createScene;
        window.createVillage = createVillage;
        window.createDeadZone = createDeadZone;
        window.createPort = createPort;
        window.createCastle = createCastle;
        window.createPotion = createPotion; // оставляем, функции должны быть глобализованы сборщиком
        window.createSpell = createSpell;
        window.createConflict = createConflictWizard;
        window.createOrganization = createOrganizationWizard;
        window.createReligion = createReligionWizard;
        window.createCult = createCultWizard;
        window.createTradeRoute = createTradeRouteWizard;
        window.createFaction = createFactionWizard;
        window.createQuest = createQuestWizard;
        // Регистрируем функции-обертки как глобальные
        window.createArtifact = createArtifact;
        window.createAlchemyRecipe = createAlchemyRecipe;
        window.createCharacter = createCharacter;
        window.createWork = createWork;
        window.createState = createState;
        window.createProvince = createProvince;
        window.createMine = createMine;
        window.createFactory = createFactory;
        window.createFarm = createFarm;
        window.createPeople = createPeople;
        window.createMonster = createMonster;
        window.createTask = createTask;
        window.createSocialInstitution = (typeof window !== 'undefined' && typeof window.createSocialInstitution === 'function')
            ? window.createSocialInstitution
            : null;
        
        // Делаем вспомогательные функции доступными в глобальной области видимости
        window.findProjectRoot = findProjectRoot;
        window.getAllProjectRoots = getAllProjectRoots;
        window.isProjectFolder = isProjectFolder;
        window.getAllProjectFolders = getAllProjectFolders;
        window.fillTemplate = async (...args) => { try { const tm = new TemplateManager(this); return await tm.fillTemplate?.(...args); } catch (e) { console.error('fillTemplate shim error:', e); return ''; } };
        window.generateFromTemplate = generateFromTemplate;
        // window.ensureEntityInfrastructure теперь задается в src/Globals.js как алиас на ProjectManager.ensureEntityInfrastructure
        // Экспортируем правильную версию safeCreateFile, которая НЕ создает файлы с номерами
        // Версия с автонумерацией находится в main_modules/fileUtils.js под именем safeCreateFileWithNumbering
        window.safeCreateFile = safeCreateFile;
        
        // Делаем сервисы временных слоев доступными глобально
        window.timelineService = this.timelineService;
        window.temporalEntityService = this.temporalEntityService;
        window.temporalContextService = this.temporalContextService;
        window.migrationService = this.migrationService;
        window.temporalAPI = this.temporalAPI;
        
        // Делаем модальные окна доступными глобально
        
        // Делаем методы шаблонизатора доступными в глобальной области видимости
        window.processConditionalBlocks = this.processConditionalBlocks.bind(this);
        window.evaluateCondition = this.evaluateCondition.bind(this);
        
        // Инициализируем AI через модуль AIService
        try {
            if (typeof window.AIService === 'function') {
                this.aiService = new window.AIService(this);
                await this.aiService.init();
            }
        } catch (e) { console.error('AIService init error:', e); }
        
        // Создаем папку для секций шаблонов, если её нет (ПОСЛЕ всех операций с this.app)
        try {
            const sectionsFolder = 'Шаблоны/sections';
            const folder = this.app.vault.getAbstractFileByPath(sectionsFolder);
            if (!folder) {
                await this.app.vault.createFolder(sectionsFolder);
            }
        } catch (e) {
            // console.warn('Не удалось создать папку для секций шаблонов:', e.message);
        }
        
        // console.log('Literary Templates plugin loaded successfully');
        
        // Загружаем CSS после полной инициализации
        try {
            if (this.manifest && this.manifest.dir) {
                const cssPath = this.manifest.dir + '/styles.css';
                const exists = await this.app.vault.adapter.exists(cssPath);
                if (exists) {
                    const css = await this.app.vault.adapter.read(cssPath);
                    const styleEl = window.document.createElement('style');
                    styleEl.setAttribute('type', 'text/css');
                    styleEl.textContent = css;
                    const customCss = this.app.customCss.styleEl;
                    window.document.head.insertBefore(styleEl, customCss);
                    this.register(() => styleEl.detach());
                    // console.log('CSS загружен успешно');
                                  } else {
                      // console.log('CSS файл не найден по пути:', cssPath);
                  }
                          } else {
                  // console.log('Manifest недоступен, CSS не загружается');
            }
        } catch (error) {
              console.warn('Ошибка загрузки CSS:', error);
        }
        
        this.addCommand({
            id: 'open-plugin-settings-file',
            name: 'Открыть настройки Literary Templates',
            callback: async () => {
                await openSettingsFile(this.app);
            }
        });
        
        this.addCommand({
            id: 'manage-ai-keys',
            name: 'Управление AI ключами',
            callback: async () => {
                await this.openAIKeysManager();
            }
        });
        
        // console.log('Команда "Управление AI ключами" зарегистрирована');
        // console.log('Literary Templates plugin onload завершен успешно');
        
        // Финальная проверка - создаем тестовый лог
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                this.logDebug('Плагин успешно загружен - финальная проверка');
                // Тихая отложенная проверка AI сервисов (через 3 секунды после возможного retry)
                window.setTimeout(() => {
                    const ok = !!(window.keyRotationService && window.aiProviderService && window.loreAnalyzerService);
                    if (this.debugEnabled) {
                        this.logDebug('AI сервисы статус (через 3с): ' + (ok ? 'готовы' : 'не готовы'));
                        if (!ok) {
                            this.logDebug('Причина: '
                                + ' KeyRotationService=' + String(typeof window.KeyRotationService)
                                + ' AIProviderService=' + String(typeof window.AIProviderService)
                                + ' LoreAnalyzerService=' + String(typeof window.LoreAnalyzerService));
                        }
                    }
                }, 3000);
            } else {
                console.error('Финальная проверка: app.vault недоступен');
            }
        } catch (error) {
            console.error('Ошибка финальной проверки:', error);
        }
        
        // Планируем дополнительную проверку через 5 секунд
        window.setTimeout(() => {
            this.delayedInitializationCheck();
        }, 5000);
        
        // Также планируем проверку через 1 секунду для быстрой диагностики
        window.setTimeout(() => {
            this.quickInitializationCheck();
        }, 1000);
        
        // Планируем повторную попытку инициализации AI через 2 секунды
        if (this.aiService) this.aiService.retryInitialization(2000);

        // === КОМАНДЫ ДЛЯ ВНЕШНЕГО ЧАТА ===
        this.addCommand({
            id: 'ai-prompt-selector',
            name: 'AI промпт-селектор (выбор шаблона для внешнего чата)',
            callback: async () => {
                await this.showPromptSelector();
            }
        });
        
        // === КОМАНДЫ РАБОТЫ С БАЗОЙ ФАКТОВ ===
        
        this.addCommand({
            id: 'test-ai-connection',
            name: 'Тест AI подключения',
            callback: async () => {
                await this.testAIConnection();
            }
        });

        // Долгая команда: собрать лор по проекту и перезаписать сводный файл
        this.addCommand({
            id: 'ai-gather-project-lore',
            name: 'AI собрать лор по проекту (перезаписать файл)',
            callback: async () => {
                try {
                    await this.aiGatherProjectLore();
                } catch (e) {
                    this.logDebug('Ошибка при сборе лора: ' + e.message);
                }
            }
        });

        // Быстрая команда: добавить лор из текущего документа в сводный файл
        this.addCommand({
            id: 'ai-append-current-note-lore',
            name: 'AI добавить лор из текущего документа',
            callback: async () => {
                try {
                    await this.aiAppendCurrentNoteLore();
                } catch (e) {
                    this.logDebug('Ошибка добавления лора из заметки: ' + e.message);
                }
            }
        });

        // Социальные объекты: единый мастер
        this.addCommand({
            id: 'create-social-institution',
            name: 'Создать социальный объект (мастер)',
            callback: async () => {
                try {
                    const fn = (typeof window !== 'undefined' && typeof window.createSocialInstitution === 'function') ? window.createSocialInstitution : null;
                    if (fn) {
                        await fn(this);
                        return;
                    }
                    // Fallback: открываем модал напрямую
                    if (typeof window.SocialInstitutionWizardModal !== 'function') {
                        this.logDebug('[ERROR] SocialInstitutionWizardModal недоступен');
                        return;
                    }
                    const activeFile = this.app.workspace.getActiveFile();
                    const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        const roots = await getAllProjectRoots(this.app);
                        if (roots && roots.length > 0) projectRoot = roots[0];
                    }
                    const modal = new window.SocialInstitutionWizardModal(this.app, Modal, Setting, Notice, projectRoot, async (data) => {
                        // Без Unicode property escapes для совместимости
                        const cleanName = String(data.name || '').trim().replace(/[^A-Za-zА-Яа-яЁё0-9_\-\s]/g, '').replace(/\s+/g, '_');
                        const sub = String(data.subtype || 'Объект');
                        const folder = `${projectRoot}/Локации/Социальные_объекты/${sub}`;
                        await ensureEntityInfrastructure(folder, cleanName, this.app);
                        const path = `${folder}/${cleanName}.md`;
                        const md = await generateFromTemplate('Новый_социальный_объект', {
                            name: data.name,
                            subtype: sub,
                            country: data.country,
                            province: data.province,
                            city: data.city,
                            address: data.address,
                            founded: data.founded,
                            capacity: data.capacity,
                            owner: data.owner,
                            affiliation: data.affiliation,
                            status: data.status,
                            description: data.description,
                            date: (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)),
                            projectName: projectRoot.split('/').pop()
                        }, this);
                        const existing = this.app.vault.getAbstractFileByPath(path);
                        if (existing instanceof TFile) {
                            await this.app.vault.modify(existing, md);
                            await this.app.workspace.getLeaf(true).openFile(existing);
                        } else {
                            const file = await this.app.vault.create(path, md);
                            await this.app.workspace.getLeaf(true).openFile(file);
                        }
                        new Notice(`Создан ${sub}: ${data.name}`);
                    });
                    modal.open();
                } catch (e) {
                    this.logDebug('Ошибка создания социального объекта: ' + e.message);
                }
            }
        });

        // Импорт фактов из буфера обмена в базу проекта (Лор-контекст/Факты.json)
        this.addCommand({
            id: 'import-facts-from-clipboard',
            name: 'Импортировать факты из буфера',
            callback: async () => {
                this.logDebug('=== Импорт фактов: команда вызвана ===');
                try {
                    let raw = '';
                    this.logDebug('Пробуем прочитать буфер обмена...');
                    
                    // Проверяем доступность буфера обмена
                    if (navigator && navigator.clipboard && navigator.clipboard.readText) {
                        try {
                            // Запрашиваем разрешение на доступ к буферу
                            const permission = await navigator.permissions.query({ name: 'clipboard-read' });
                            this.logDebug('Разрешение на буфер: ' + permission.state);
                            
                            if (permission.state === 'denied') {
                                this.logDebug('Доступ к буферу запрещён');
                                new Notice('Доступ к буферу обмена запрещён. Разрешите доступ в настройках браузера.');
                                return;
                            }
                            
                            raw = await navigator.clipboard.readText();
                            this.logDebug('Буфер обмена прочитан, длина: ' + raw.length);
                        } catch (clipboardError) {
                            this.logDebug('Ошибка чтения буфера: ' + clipboardError.message);
                            new Notice('Ошибка чтения буфера обмена: ' + clipboardError.message);
                            return;
                        }
                    } else if (document.queryCommandSupported && document.queryCommandSupported('paste')) {
                        // Альтернативный способ для старых браузеров
                        this.logDebug('Пробуем альтернативный способ чтения буфера...');
                        try {
                            // Создаём временный textarea для вставки
                            const textarea = document.createElement('textarea');
                            textarea.style.position = 'fixed';
                            textarea.style.left = '-9999px';
                            document.body.appendChild(textarea);
                            textarea.focus();
                            
                            // Пытаемся вставить
                            const success = document.execCommand('paste');
                            if (success) {
                                raw = textarea.value;
                                this.logDebug('Буфер прочитан альтернативным способом, длина: ' + raw.length);
                            } else {
                                throw new Error('Не удалось выполнить команду paste');
                            }
                            
                            document.body.removeChild(textarea);
                        } catch (altError) {
                            this.logDebug('Альтернативный способ не сработал: ' + altError.message);
                            new Notice('Не удалось прочитать буфер обмена. Скопируйте JSON вручную.');
                            return;
                        }
                    } else {
                        this.logDebug('Буфер обмена недоступен в этом браузере');
                        new Notice('Буфер обмена недоступен в этом браузере');
                        return;
                    }

                    // Предочистка ввода
                    this.logDebug('Сырой текст из буфера: ' + raw.substring(0, 200) + '...');
                    
                    let s = FactsService.cleanJsonInput ? FactsService.cleanJsonInput(raw) : String(raw || '').trim();
                    this.logDebug('После очистки: ' + s.substring(0, 200) + '...');
                    
                    // Удаляем многоточия в конце (… или ...)
                    s = s.replace(/[\u2026.]{3,}\s*$/u, '');
                    // Удаляем висячие запятые перед ] или }
                    s = s.replace(/,\s*(\]|\})/g, '$1');
                    // Если в тексте есть несколько блоков, оставляем самый внешний массив
                    if (!(s.trim().startsWith('[') && s.trim().endsWith(']'))) {
                        const first = s.indexOf('[');
                        const last = s.lastIndexOf(']');
                        if (first !== -1 && last !== -1 && last > first) {
                            s = s.slice(first, last + 1).trim();
                            this.logDebug('Извлечён массив из позиции ' + first + ' до ' + last);
                        }
                    }
                    
                    this.logDebug('Финальный текст для парсинга: ' + s.substring(0, 200) + '...');

                    let parsed = [];
                    try {
                        parsed = JSON.parse(s);
                        this.logDebug('JSON успешно распарсен, элементов: ' + (Array.isArray(parsed) ? parsed.length : 'не массив'));
                        new Notice(`JSON распарсен: ${parsed.length} элементов`);
                    } catch (e) {
                        this.logDebug('Ошибка парсинга JSON после очистки: ' + e.message);
                        // Логируем первые 200 символов для диагностики
                        this.logDebug('Фрагмент ввода: ' + s.slice(0, 200));
                        new Notice('Ошибка парсинга JSON: ' + e.message);
                        return;
                    }
                    if (!Array.isArray(parsed)) {
                        this.logDebug('Ожидался массив фактов');
                        new Notice('Ожидался массив фактов в JSON');
                        return;
                    }

                    // Нормализация ключей к русской схеме и правка отношений
                    let skipped = 0;
                    const newFacts = parsed.map(f => FactsService.normalizeRussianFactKeys(f)).map(f => {
                        // Приводим отношения к массиву
                        if (f && f['отношения'] && !Array.isArray(f['отношения'])) {
                            const rel = f['отношения'];
                            if (rel && typeof rel === 'object') {
                                const keys = Object.keys(rel);
                                f['отношения'] = keys.length === 0
                                    ? []
                                    : keys.map(k => ({ 'связь': k, 'объект': String(rel[k]) }));
                            } else {
                                f['отношения'] = [];
                            }
                        }
                        return f;
                    }).filter(f => {
                        const ok = f && typeof f === 'object' && f['тип'] && f['имя'];
                        if (!ok) skipped++;
                        return ok;
                    });
                    
                    this.logDebug(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);
                    new Notice(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);

                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        // Пытаемся выбрать первый доступный проект
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch (e) {}
                    }
                    this.logDebug('projectRoot: ' + projectRoot);
                    if (!projectRoot) {
                        this.logDebug('Проект не найден для импорта фактов');
                        return;
                    }

                    // Загружаем существующие факты
                    let existing = await FactsService.loadFacts(this.app, projectRoot);
                    if (!Array.isArray(existing)) existing = [];
                    this.logDebug('Загружено существующих фактов: ' + existing.length);

                    // Индекс по тип+имя
                    const index = new Map();
                    for (const f of existing) {
                        const key = `${f['тип']}|${f['имя']}`;
                        index.set(key, { ...f });
                    }

                    // Умный merge
                    let added = 0, updated = 0;
                    for (const f of newFacts) {
                        const key = `${f['тип']}|${f['имя']}`;
                        if (index.has(key)) {
                            const old = index.get(key);
                            // Объединяем атрибуты
                            old['атрибуты'] = { ...(old['атрибуты'] || {}), ...(f['атрибуты'] || {}) };
                            // Объединяем отношения без дубликатов
                            const oldRels = Array.isArray(old['отношения']) ? old['отношения'] : [];
                            const newRels = Array.isArray(f['отношения']) ? f['отношения'] : [];
                            const relSet = new Set(oldRels.map(r => JSON.stringify(r)));
                            for (const r of newRels) {
                                const srl = JSON.stringify(r);
                                if (!relSet.has(srl)) {
                                    oldRels.push(r);
                                    relSet.add(srl);
                                }
                            }
                            old['отношения'] = oldRels;
                            index.set(key, old);
                            updated++;
                        } else {
                            index.set(key, f);
                            added++;
                        }
                    }

                    // Сохраняем
                    const merged = Array.from(index.values());
                    await FactsService.saveFacts(this.app, projectRoot, merged);
                    this.logDebug(`Импорт фактов завершён: добавлено ${added}, обновлено ${updated}, пропущено ${skipped}`);
                    new Notice(`Импорт завершён: +${added}, обновлено ${updated}, пропущено ${skipped}`);
                } catch (e) {
                    this.logDebug('Ошибка импорта фактов: ' + e.message + (e.stack ? '\n' + e.stack : ''));
                    new Notice('Ошибка импорта фактов: ' + e.message);
                }
            }
        });

        // Импорт фактов через ручной ввод JSON
        this.addCommand({
            id: 'import-facts-manual',
            name: 'Импортировать факты (ручной ввод)',
            callback: async () => {
                this.logDebug('=== Ручной импорт фактов: команда вызвана ===');
                try {
                    const raw = await this.prompt('Вставьте JSON с фактами:');
                    if (!raw || !raw.trim()) {
                        this.logDebug('JSON не введён');
                        return;
                    }

                    this.logDebug('Ручной ввод получен, длина: ' + raw.length);
                    
                    // Используем ту же логику обработки
                    let s = FactsService.cleanJsonInput ? FactsService.cleanJsonInput(raw) : String(raw || '').trim();
                    this.logDebug('После очистки: ' + s.substring(0, 200) + '...');
                    
                    // Удаляем многоточия в конце (… или ...)
                    s = s.replace(/[\u2026.]{3,}\s*$/u, '');
                    // Удаляем висячие запятые перед ] или }
                    s = s.replace(/,\s*(\]|\})/g, '$1');
                    // Если в тексте есть несколько блоков, оставляем самый внешний массив
                    if (!(s.trim().startsWith('[') && s.trim().endsWith(']'))) {
                        const first = s.indexOf('[');
                        const last = s.lastIndexOf(']');
                        if (first !== -1 && last !== -1 && last > first) {
                            s = s.slice(first, last + 1).trim();
                            this.logDebug('Извлечён массив из позиции ' + first + ' до ' + last);
                        }
                    }
                    
                    this.logDebug('Финальный текст для парсинга: ' + s.substring(0, 200) + '...');

                    let parsed = [];
                    try {
                        parsed = JSON.parse(s);
                        this.logDebug('JSON успешно распарсен, элементов: ' + (Array.isArray(parsed) ? parsed.length : 'не массив'));
                        new Notice(`JSON распарсен: ${parsed.length} элементов`);
                    } catch (e) {
                        this.logDebug('Ошибка парсинга JSON после очистки: ' + e.message);
                        this.logDebug('Фрагмент ввода: ' + s.slice(0, 200));
                        new Notice('Ошибка парсинга JSON: ' + e.message);
                        return;
                    }
                    if (!Array.isArray(parsed)) {
                        this.logDebug('Ожидался массив фактов');
                        new Notice('Ожидался массив фактов в JSON');
                        return;
                    }

                    // Нормализация ключей к русской схеме и правка отношений
                    let skipped = 0;
                    const newFacts = parsed.map(f => FactsService.normalizeRussianFactKeys(f)).map(f => {
                        // Приводим отношения к массиву
                        if (f && f['отношения'] && !Array.isArray(f['отношения'])) {
                            const rel = f['отношения'];
                            if (rel && typeof rel === 'object') {
                                const keys = Object.keys(rel);
                                f['отношения'] = keys.length === 0
                                    ? []
                                    : keys.map(k => ({ 'связь': k, 'объект': String(rel[k]) }));
                            } else {
                                f['отношения'] = [];
                            }
                        }
                        return f;
                    }).filter(f => {
                        const ok = f && typeof f === 'object' && f['тип'] && f['имя'];
                        if (!ok) skipped++;
                        return ok;
                    });
                    
                    this.logDebug(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);
                    new Notice(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);

                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        // Пытаемся выбрать первый доступный проект
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch (e) {}
                    }
                    this.logDebug('projectRoot: ' + projectRoot);
                    if (!projectRoot) {
                        this.logDebug('Проект не найден для импорта фактов');
                        new Notice('Проект не найден для импорта фактов');
                        return;
                    }

                    // Загружаем существующие факты
                    let existing = await FactsService.loadFacts(this.app, projectRoot);
                    if (!Array.isArray(existing)) existing = [];
                    this.logDebug('Загружено существующих фактов: ' + existing.length);

                    // Индекс по тип+имя
                    const index = new Map();
                    for (const f of existing) {
                        const key = `${f['тип']}|${f['имя']}`;
                        index.set(key, { ...f });
                    }

                    // Умный merge
                    let added = 0, updated = 0;
                    for (const f of newFacts) {
                        const key = `${f['тип']}|${f['имя']}`;
                        if (index.has(key)) {
                            const old = index.get(key);
                            // Объединяем атрибуты
                            old['атрибуты'] = { ...(old['атрибуты'] || {}), ...(f['атрибуты'] || {}) };
                            // Объединяем отношения без дубликатов
                            const oldRels = Array.isArray(old['отношения']) ? old['отношения'] : [];
                            const newRels = Array.isArray(f['отношения']) ? f['отношения'] : [];
                            const relSet = new Set(oldRels.map(r => JSON.stringify(r)));
                            for (const r of newRels) {
                                const srl = JSON.stringify(r);
                                if (!relSet.has(srl)) {
                                    oldRels.push(r);
                                    relSet.add(srl);
                                }
                            }
                            old['отношения'] = oldRels;
                            index.set(key, old);
                            updated++;
                        } else {
                            index.set(key, f);
                            added++;
                        }
                    }

                    // Сохраняем
                    const merged = Array.from(index.values());
                    await FactsService.saveFacts(this.app, projectRoot, merged);
                    this.logDebug(`Импорт фактов завершён: добавлено ${added}, обновлено ${updated}, пропущено ${skipped}`);
                    new Notice(`Импорт завершён: +${added}, обновлено ${updated}, пропущено ${skipped}`);
                } catch (e) {
                    this.logDebug('Ошибка ручного импорта фактов: ' + e.message + (e.stack ? '\n' + e.stack : ''));
                    new Notice('Ошибка ручного импорта фактов: ' + e.message);
                }
            }
        });

        // Просмотр текущей базы фактов
        this.addCommand({
            id: 'view-facts-database',
            name: 'Просмотреть базу фактов',
            callback: async () => {
                this.logDebug('=== Просмотр базы фактов: команда вызвана ===');
                try {
                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch (e) {}
                    }
                    
                    if (!projectRoot) {
                        new Notice('Проект не найден');
                        return;
                    }

                    // Загружаем факты
                    const facts = await FactsService.loadFacts(this.app, projectRoot);
                    if (!Array.isArray(facts) || facts.length === 0) {
                        new Notice('База фактов пуста');
                        return;
                    }

                    // Создаём временный файл для просмотра
                    const content = `# База фактов проекта: ${projectRoot}
## Статистика
- Всего фактов: ${facts.length}
- Типы: ${[...new Set(facts.map(f => f['тип'] || 'неизвестно'))].join(', ')}
## Все факты
\`\`\`json
${JSON.stringify(facts, null, 2)}
\`\`\`
---
*Создано автоматически для просмотра базы фактов*
`;

                    const fileName = `База_фактов_${new Date().toISOString().slice(0, 10)}.md`;
                    const filePath = `${projectRoot}/${fileName}`;
                    
                    await this.app.vault.create(filePath, content);
                    new Notice(`База фактов экспортирована в ${fileName}`);
                    
                    // Открываем файл
                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (file) {
                        this.app.workspace.openLinkText(fileName, filePath);
                    }
                    
                } catch (e) {
                    this.logDebug('Ошибка просмотра базы фактов: ' + e.message);
                    new Notice('Ошибка просмотра базы фактов: ' + e.message);
                }
            }
        });

        // === Глобализация сервисов для доступа через window ===
        // Пропускаем прямую глобализацию классов сервисов: классы становятся доступными глобально после сборки
        
        // Проверяем наличие CustomJS и запускаем наши скрипты
        this.initializeCustomJS();

    }
    
    // Инициализация интеграции с CustomJS
    initializeCustomJS() {
        // Ждем загрузки CustomJS
        const checkCustomJS = setInterval(() => {
            if (window.customJS) {
                clearInterval(checkCustomJS);
                console.log('CustomJS detected, initializing integration');
                this.setupCustomJSIntegration();
            }
        }, 1000);
    }

    // Настройка интеграции с CustomJS
    setupCustomJSIntegration() {
        // Здесь можно добавить дополнительную логику интеграции
        // Например, вызов методов ваших скриптов через customJS
    }
    async quickInitializationCheck() {
        // console.log('=== Quick Initialization Check (1 сек) ===');
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                // console.log('Quick check: все компоненты доступны');
                // console.log('Плагин готов к работе!');
            } else {
                console.error('Quick check: некоторые компоненты недоступны');
                console.error('this.app:', !!this.app);
                console.error('this.app.vault:', !!(this.app && this.app.vault));
                console.error('this.app.vault.adapter:', !!(this.app && this.app.vault && this.app.vault.adapter));
            }
        } catch (error) {
            console.error('Quick check error:', error);
        }
    }
    
    async delayedInitializationCheck() {
        // console.log('=== Delayed Initialization Check (5 сек) ===');
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                // console.log('Delayed check: все компоненты доступны');
                this.logDebug('Delayed check: плагин работает корректно');
            } else {
                console.error('Delayed check: некоторые компоненты недоступны');
                console.error('this.app:', !!this.app);
                console.error('this.app.vault:', !!(this.app && this.app.vault));
                console.error('this.app.vault.adapter:', !!(this.app && this.app.vault && this.app.vault.adapter));
            }
        } catch (error) {
            console.error('Delayed check error:', error);
        }
    }
    
    async retryAIInitialization() { if (this.aiService) this.aiService.retryInitialization(2000); }
    
    createSafePluginContext() {
        return {
            app: this.app || null,
            manifest: this.manifest || null,
            logDebug: (message) => {
                try {
                    // Используем console.log как fallback
                    console.log(`[AI DEBUG] ${message}`);
                    
                    // Пытаемся вызвать this.logDebug если он доступен
                    if (this && typeof this.logDebug === 'function') {
                        try {
                            this.logDebug(message);
                        } catch (e) {
                            console.log(`[AI DEBUG] logDebug error: ${e.message}`);
                        }
                    }
                } catch (e) {
                    console.log(`[AI DEBUG] ${message} (general error: ${e.message})`);
                }
            },
            settings: this.settings || {},
            // Добавляем безопасные методы для AI сервисов
            saveSettings: async () => {
                try {
                    if (this && typeof this.saveSettings === 'function') {
                        await this.saveSettings();
                    }
                } catch (e) {
                    console.log(`[AI DEBUG] saveSettings error: ${e.message}`);
                }
            }
        };
    }
    
    async openAIKeysManager() { if (this.aiService) await this.aiService.openKeysManager(); }



    async editWorldSettings(startPath = '') {
        try {
            this.logDebug('=== editWorldSettings вызвана ===');
            // Определить корень проекта
            let projectRoot = '';
            const activeFile = this.app.workspace.getActiveFile();
            if (startPath) {
                projectRoot = findProjectRoot(this.app, startPath);
            } else if (activeFile) {
                projectRoot = findProjectRoot(this.app, activeFile.parent.path);
            }
            if (!projectRoot) {
                const allFiles = this.app.vault.getMarkdownFiles();
                const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
                const projects = projectFiles.map(f => f.parent.path);
                if (projects.length === 0) {
                    this.logDebug(`[ERROR] Проекты не найдены!`);
                    this.logDebug('Проекты не найдены!');
                    return;
                }
                projectRoot = await this.selectProject(projects);
                if (!projectRoot) return;
            }
            this.logDebug('projectRoot: ' + projectRoot);

            // Прочитать JSON
            const jsonPath = `${projectRoot}/Настройки_мира.json`;
            let settings = null;
            try {
                const raw = await this.app.vault.adapter.read(jsonPath);
                settings = JSON.parse(raw);
            } catch (e) {
                this.logDebug('Не удалось прочитать JSON, создаем пустой: ' + e.message);
                settings = { projectName: projectRoot.split('/').pop(), date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10) };
            }

            // Открыть модал
            const modal = new WorldSettingsModal(this.app, Modal, Setting, Notice, settings, async (newData) => {
                // Сохранить JSON
                const newRaw = JSON.stringify(newData, null, 2);
                try {
                    if (this.app.vault.getAbstractFileByPath(jsonPath)) {
                        await this.app.vault.adapter.write(jsonPath, newRaw);
                    } else {
                        await this.app.vault.create(jsonPath, newRaw);
                    }
                    this.logDebug('Настройки сохранены в JSON');
                } catch (e) {
                    this.logDebug('Ошибка сохранения JSON: ' + e.message);
                }

                // Перегенерировать Настройки_мира.md из шаблона
                try {
                    const md = await generateFromTemplate('Настройки_мира', newData, this);
                    const mdPath = `${projectRoot}/Настройки_мира.md`;
                    const mdFile = this.app.vault.getAbstractFileByPath(mdPath);
                    if (mdFile instanceof TFile) {
                        await this.app.vault.modify(mdFile, md);
                    } else {
                        await this.app.vault.create(mdPath, md);
                    }
                    this.logDebug('Настройки_мира.md перегенерирован');
                } catch (e) {
                    this.logDebug('Ошибка генерации Настройки_мира.md: ' + e.message);
                }
            });
            modal.open();
        } catch (error) {
            this.logDebug('Ошибка при редактировании настроек: ' + error.message);
            this.logDebug('Ошибка editWorldSettings: ' + error.message);
        }
    }



    async chooseProjectRoot() {
        // console.log('chooseProjectRoot вызвана');
        const roots = await getAllProjectRoots(this.app);
        if (roots.length === 0) {
            this.logDebug(`[ERROR] Проекты не найдены (нет ни одной папки с Настройки_мира.md)`);
                return;
        }
        if (roots.length === 1) {
            this.activeProjectRoot = roots[0];
            try {
            await this.saveData({ activeProjectRoot: roots[0] });
            } catch (error) {
                console.warn('Ошибка сохранения активного проекта:', error);
            }
            this.logDebug(`Активный проект: ${roots[0]}`);
        } else {
            // TODO: Реализовать модальное окно выбора проекта
            this.activeProjectRoot = roots[0];
            try {
            await this.saveData({ activeProjectRoot: roots[0] });
            } catch (error) {
                console.warn('Ошибка сохранения активного проекта:', error);
            }
            let projectList = 'Доступные проекты:\n';
            roots.forEach((root, index) => {
                projectList += `${index + 1}. ${root}\n`;
            });
            this.logDebug(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
        }
    }

    async openTemplaterPalette(templateName) {
        // console.log('openTemplaterPalette вызвана с templateName:', templateName);
        try {
            // Определяем проект и устанавливаем переменную
            const activeFile = this.app.workspace.getActiveFile();
            // console.log('Активный файл:', activeFile ? activeFile.path : 'нет');
            
            let startPath = '';
            
            if (activeFile) {
                startPath = activeFile.parent.path;
                // console.log('Путь из активного файла:', startPath);
            } else if (this.activeProjectRoot) {
                startPath = this.activeProjectRoot;
                // console.log('Путь из активного проекта:', startPath);
            }
            
            let projectRoot = findProjectRoot(this.app, startPath);
            // console.log('Найденный projectRoot:', projectRoot);
            
            if (!projectRoot) {
                // console.log('Проект не найден, ищем все проекты');
                const roots = await getAllProjectRoots(this.app);
                if (roots.length === 0) {
                    this.logDebug(`[ERROR] Проекты не найдены (нет ни одной папки с Настройки_мира.md)`);
                return;
                }
                if (roots.length === 1) {
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    try {
                    await this.saveData({ activeProjectRoot: roots[0] });
                    } catch (error) {
                        console.warn('Ошибка сохранения активного проекта:', error);
                    }
                    this.logDebug(`Выбран проект: ${roots[0]}`);
                } else {
                    // TODO: Реализовать модальное окно выбора проекта
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    try {
                    await this.saveData({ activeProjectRoot: roots[0] });
                    } catch (error) {
                        console.warn('Ошибка сохранения активного проекта:', error);
                    }
                    let projectList = 'Доступные проекты:\n';
                    roots.forEach((root, index) => {
                        projectList += `${index + 1}. ${root}\n`;
                    });
                    this.logDebug(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
                }
            }
            
            // Устанавливаем переменную для шаблонов
            window.tp = window.tp || {};
            window.tp.literaryProjectRoot = projectRoot;
            // console.log('Установлена переменная tp.literaryProjectRoot:', projectRoot);
            
            // Открываем палитру команд Templater через Obsidian API
            // console.log('Выполняем команду templater-obsidian:insert-templater');
            this.app.commands.executeCommandById('templater-obsidian:insert-templater');
            this.logDebug(`Открыта палитра Templater. Выберите шаблон "${templateName}"`);
            // console.log('Команда выполнена, уведомление показано');
        } catch (error) {
            console.error('Ошибка при открытии палитры Templater:', error);
            this.logDebug(`[ERROR] Ошибка: ${error.message}`);
        }
    }



    async logDebug(message) {
        // Всегда выводим в консоль для отладки
        // console.log(`[DEBUG] ${message}`);
        
        // Тихий режим: если отладка выключена — не пишем в файл
        if (!this.debugEnabled) return;
        
        // Проверяем, что vault доступен
        if (!this.app || !this.app.vault || !this.app.vault.adapter) {
            // console.log(`[DEBUG] ${message} (vault недоступен)`);
            return;
        }
        // Дублируем вывод в консоль для удобной отладки
        try {
            const now = window.moment ? window.moment().format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString();
            const line = `[${now}] ${message}`;
            // Единая точка консольного вывода
             
            // console.log(line);

            // Пишем лог в .obsidian, чтобы Dataview его не индексировал
            const logPath = '.obsidian/plugins/literary-templates/log.md';
            let prev = '';
            try {
                // Принудительно создаем папку плагина
                const pluginDir = '.obsidian/plugins/literary-templates';
                try {
                    await this.app.vault.adapter.mkdir(pluginDir);
                    // console.log('Папка для логов создана:', pluginDir);
                } catch (mkdirError) {
                     
                    // console.log('Папка для логов уже существует или ошибка создания:', mkdirError.message);
                }
                
                // Пытаемся прочитать существующий лог
            try {
                prev = await this.app.vault.adapter.read(logPath);
            } catch (e) {
                prev = '';
            }
                
                // Записываем новый лог
                try {
            await this.app.vault.adapter.write(logPath, prev + line + '\n');
                    //  console.log('Лог записан в файл:', logPath);
                } catch (writeError) {
                    console.warn('Не удалось записать лог:', writeError.message);
                }
            } catch (error) {
                console.error('Общая ошибка в logDebug:', error);
            }
        } catch (e) {
             
            console.error('logDebug error:', e);
        }
    }
    // Вспомогательная функция для определения типа контента по имени файла
    // Используется в aiAnalyzeAndExtendNote и aiBuildLoreContext
    getContentTypeByName(filename) {
        return this.aiService && typeof this.aiService.getContentTypeByName === 'function'
            ? this.aiService.getContentTypeByName(filename)
            : '';
    }

    async saveSettings() {
        try {
        await saveSettingsToFile(this.app, this.settings);
        } catch (error) {
            console.warn('Ошибка сохранения настроек:', error);
        }
    }











    async openWriterHandbook() {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
            let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
            if (!projectRoot) {
                const roots = await getAllProjectRoots(this.app);
                if (!roots || roots.length === 0) {
                    this.logDebug(`[ERROR] Проект не найден: отсутствует "Настройки_мира.md"`);
                    return;
                }
                projectRoot = roots[0];
            }
            const dir = `${projectRoot}/Справочник`;
            await ensureEntityInfrastructure(dir, 'index', this.app);
            const pages = [
                ['Справочник_писателя.md', 'Справочник писателя'],
                ['Сюжет_и_персонажи.md', 'Сюжет и персонажи'],
                ['Мир_и_экология.md', 'Мир и экология'],
                ['Культура_и_религия.md', 'Культура и религия'],
                ['Геополитика_и_экономика.md', 'Геополитика и экономика'],
                ['Технологии_и_инфраструктура.md', 'Технологии и инфраструктура'],
                ['Социальное_и_психологическое.md', 'Социальное и психологическое'],
            ];
            const fm = (title) => `---\n` +
                `type: Справочник\n` +
                `status: planned\n` +
                `name: "${title}"\n` +
                `---\n`;
            const hub = fm('Справочник писателя') +
`# Справочник писателя
> [!tip] Навигация
> - [[Справочник/Сюжет_и_персонажи|Сюжет и персонажи]]
> - [[Справочник/Мир_и_экология|Мир и экология]]
> - [[Справочник/Культура_и_религия|Культура и религия]]
> - [[Справочник/Геополитика_и_экономика|Геополитика и экономика]]
> - [[Справочник/Технологии_и_инфраструктура|Технологии и инфраструктура]]
> - [[Справочник/Социальное_и_психологическое|Социальное и психологическое]]
## Статусы
planned | started | writing | done | abandoned
## Вкладки
- [[Справочник/Сюжет_и_персонажи]]
- [[Справочник/Мир_и_экология]]
- [[Справочник/Культура_и_религия]]
- [[Справочник/Геополитика_и_экономика]]
- [[Справочник/Технологии_и_инфраструктура]]
- [[Справочник/Социальное_и_психологическое]]
`;
            const page = (title) => fm(title) + `\n# ${title}\n\n> Статус: {{status}}\n\n`;
            for (const [fileName, title] of pages) {
                const full = `${dir}/${fileName}`;
                const exists = this.app.vault.getAbstractFileByPath(full);
                const content = fileName === 'Справочник_писателя.md' ? hub : page(title);
                if (exists instanceof TFile) {
                    const text = await this.app.vault.read(exists);
                    if (!String(text || '').trim()) await this.app.vault.modify(exists, content);
                } else {
                    await safeCreateFile(full, content, this.app);
                }
            }
            const hubPath = `${dir}/Справочник_писателя.md`;
            const file = this.app.vault.getAbstractFileByPath(hubPath);
            if (file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
            this.logDebug('Справочник писателя готов');
        } catch (error) {
            this.logDebug('Ошибка справочника: ' + error.message);
        }
    }

    async setWriterHandbookStatus() {
        const editorFile = this.app.workspace.getActiveFile();
        if (!(editorFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }
        const path = editorFile.path || '';
        if (!/\/Справочник\//.test(path)) {
            this.logDebug(`[ERROR] Команда работает для файлов в папке "Справочник"`);
            return;
        }
        const items = ['planned', 'started', 'writing', 'done', 'abandoned'];
        const display = ['planned', 'started', 'writing', 'done', 'abandoned'];
        const chosen = await this.suggester(items, display, 'Выберите статус');
        if (!chosen) return;
        const content = await this.app.vault.read(editorFile);
        // Заменяем/добавляем status в frontmatter
        let newContent = content;
        const fmRegex = /^---[\s\S]*?---/;
        const hasFm = fmRegex.test(content);
        if (hasFm) {
            newContent = content.replace(/^(---[\s\S]*?\n)(status:\s*.*\n)?/m, `$1status: ${chosen}\n`);
        } else {
            newContent = `---\nstatus: ${chosen}\n---\n\n` + content;
        }
        await this.app.vault.modify(editorFile, newContent);
        this.logDebug(`Статус: ${chosen}`);
    }

    // Добавляем команду для управления эпохами
    registerTemporalCommands() {
        this.addCommand({
            id: 'run-temporal-tests',
            name: 'Запустить тесты временных слоев',
            callback: async () => {
                try {
                    const { runTemporalTests } = require('./test/temporal_test.js');
                    const result = await runTemporalTests(this);
                    
                    if (result.success) {
                        new Notice(result.message);
                    } else {
                        new Notice('Тесты не пройдены: ' + result.message);
                    }
                } catch (error) {
                    console.error('Ошибка запуска тестов:', error);
                    new Notice('Ошибка запуска тестов: ' + error.message);
                }
            }
        });
    }

    registerCommands() {
        // console.log('Регистрация команд начата');
        
        try {
        this.addCommand({
            id: 'literary-switch-project',
            name: 'Литературные шаблоны: Сменить проект',
            callback: () => this.chooseProjectRoot(),
            hotkeys: []
        });
            
            this.addCommand({
                id: 'manage-ai-keys',
                name: 'Управление AI ключами',
                callback: async () => {
                    await this.openAIKeysManager();
                }
            });
            
        // console.log('Команды зарегистрированы');
        } catch (error) {
            console.error('Ошибка регистрации команд:', error);
            // Продолжаем работу плагина даже если команды не зарегистрированы
        }
        
        // Регистрируем команды для работы с временными слоями
        this.registerTemporalCommands();
    }

    addContextMenu(menu, target) {
        // Литературные шаблоны - главное меню
        menu.addItem((item) => {
            item.setTitle('Литературные шаблоны').setIcon('book-open');
            const subMenu = item.setSubmenu();
            
            // 1. Сюжет и главы
            subMenu.addItem((subItem) => {
                subItem.setTitle('📚 Сюжет и главы').setIcon('book');
                const storySubMenu = subItem.setSubmenu();
                                    storySubMenu.addItem((storyItem) => {
                        storyItem.setTitle('Создать главу').setIcon('book').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createChapter(this, startPath);
                        });
                    });
                storySubMenu.addItem((storyItem) => {
                    storyItem.setTitle('Создать сцену').setIcon('film').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createScene(this, startPath);
                    });
                });
                storySubMenu.addItem((storyItem) => {
                    storyItem.setTitle('Создать конфликт').setIcon('flame').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createConflictWizard(this, startPath);
                    });
                });
            });
            
            // Разделитель
            subMenu.addSeparator();
            
            // 2. Локации
            subMenu.addItem((subItem) => {
                subItem.setTitle('🗺️ Локации').setIcon('map-pin');
                const locationSubMenu = subItem.setSubmenu();
                
                // Жильё
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏠 Жильё').setIcon('home');
                    const housingSubMenu = locItem.setSubmenu();
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать государство').setIcon('crown').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createState(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать провинцию').setIcon('map').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createProvince(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать город').setIcon('building').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCity(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать деревню').setIcon('home').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createVillage(this, startPath);
                        });
                    });
                });
                
                // Фортификация → один пункт, запускающий мастер
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏰 Фортификация (мастер)').setIcon('fortress').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createCastle(this, startPath);
                    });
                });

                // Социальные учреждения → один пункт, запускающий мастер
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏛️ Социальные учреждения (мастер)').setIcon('library').onClick(async () => {
                        try {
                            await this.app.commands.executeCommandById('create-social-institution');
                        } catch (e) {
                            this.logDebug('Ошибка запуска мастера социальных объектов: ' + e.message);
                        }
                    });
                });
                
                // Прочее
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('📍 Прочее').setIcon('map-pin');
                    const otherSubMenu = locItem.setSubmenu();
                    
                    // Порт перенесён в раздел «Экономика → Логистика»
                    
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать мертвую зону').setIcon('skull').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createDeadZone(this, startPath);
                        });
                    });
                    
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать общую локацию').setIcon('map-pin').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createLocation(this, startPath);
                        });
                    });
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать монстра').setIcon('skull').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createMonster(this, startPath);
                        });
                    });
                });
                // Народы
                subMenu.addItem((subItem) => {
                    subItem.setTitle('👥 Народы').setIcon('users');
                    const peopleSubMenu = subItem.setSubmenu();
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать народ').setIcon('users').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createPeople(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать организацию').setIcon('users').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createOrganizationWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать религию').setIcon('book').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createReligionWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать культ (религ.)').setIcon('flame').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCultWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать фракцию').setIcon('flag').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFactionWizard(this, startPath);
                        });
                    });
                });
            });
            
            // 3. Экономика
            subMenu.addItem((subItem) => {
                subItem.setTitle('💰 Экономика').setIcon('factory');
                const ecoSubMenu = subItem.setSubmenu();
                // Производство
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🏭 Производство').setIcon('factory');
                    const prod = ecoItem.setSubmenu();
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать шахту').setIcon('pickaxe').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createMine(this, startPath);
                        });
                    });
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать ферму').setIcon('wheat').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFarm(this, startPath);
                        });
                    });
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать завод').setIcon('factory').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFactory(this, startPath);
                        });
                    });
                });
                // Торговля
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🧾 Торговля').setIcon('map');
                    const trade = ecoItem.setSubmenu();
                    trade.addItem((tItem) => {
                        tItem.setTitle('Создать торговый путь').setIcon('map').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createTradeRouteWizard(this, startPath);
                        });
                    });
                });
                // Логистика
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🚚 Логистика').setIcon('map-pin');
                    const logi = ecoItem.setSubmenu();
                    logi.addItem((lItem) => {
                        lItem.setTitle('Создать порт').setIcon('anchor').onClick(() => {
                            this.logDebug('Функция createPort временно недоступна');
                        });
                    });
                });
            });

            // 4. Магия
            subMenu.addItem((subItem) => {
                subItem.setTitle('✨ Магия').setIcon('sparkles');
                const magicSubMenu = subItem.setSubmenu();
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать зелье').setIcon('potion').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createPotion(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать заклинание').setIcon('sparkles').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createSpell(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать алхимический рецепт').setIcon('flask').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createAlchemyRecipe(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать артефакт').setIcon('sword').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createArtifact(this, startPath);
                    });
                });
            });
            
            // 5. Персонажи
            subMenu.addItem((subItem) => {
                subItem.setTitle('👤 Персонажи').setIcon('user');
                const characterSubMenu = subItem.setSubmenu();
                characterSubMenu.addItem((charItem) => {
                    charItem.setTitle('Создать персонажа').setIcon('user').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createCharacter(this, startPath);
                    });
                });
            });
            
            // 6. События
            subMenu.addItem((subItem) => {
                subItem.setTitle('📅 События').setIcon('calendar');
                const eventSubMenu = subItem.setSubmenu();
                eventSubMenu.addItem((eventItem) => {
                    eventItem.setTitle('Создать квест').setIcon('target').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createQuestWizard(this, startPath);
                    });
                });
                eventSubMenu.addItem((eventItem) => {
                    eventItem.setTitle('Создать событие').setIcon('calendar').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createEventWizard(this, startPath);
                    });
                });
            });
            
            // Разделитель
            subMenu.addSeparator();
            
            // 6. Мир и проекты (в конце как служебные функции)
            subMenu.addItem((subItem) => {
                subItem.setTitle('🌍 Мир и проекты').setIcon('globe');
                const worldSubMenu = subItem.setSubmenu();
                
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Управление AI ключами').setIcon('key').onClick(() => {
                        this.openAIKeysManager();
                    });
                });
                
                worldSubMenu.addSeparator();
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Создать новый мир/проект').setIcon('globe').onClick(async () => {
                        try {
                            // Выбираем родительскую папку для проекта
                            const parentFolder = await this._selectProjectParentFolder();
                            if (!parentFolder) {
                                this.logDebug('Создание мира отменено: не выбрана родительская папка');
                                return;
                            }
                            this.logDebug(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                            await window.createWorld(this, parentFolder);
                        } catch (error) {
                            this.logDebug(`Ошибка при выборе папки для создания мира: ${error.message}`);
                            this.logDebug('Ошибка при создании мира: ' + error.message);
                        }
                    });
                });
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Настройки мира').setIcon('settings').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        this.editWorldSettings(startPath);
                    });
                });

                // ЛОР: команды AI
                worldSubMenu.addSeparator();
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('AI собрать лор по проекту (перезаписать файл)')
                        .setIcon('book')
                        .onClick(async () => {
                            try {
                                await this.aiGatherProjectLore();
                            } catch (e) {
                                this.logDebug('Ошибка при сборе лора: ' + e.message);
                            }
                        });
                });
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('AI добавить лор из текущего документа')
                        .setIcon('book')
                        .onClick(async () => {
                            try {
                                await this.aiAppendCurrentNoteLore();
                            } catch (e) {
                                this.logDebug('Ошибка добавления лора из заметки: ' + e.message);
                            }
                        });
                });
               

           });
       });
   }
    // Контекстное меню реализовано в src/MenuRegistry.js


    // --- Вспомогательные методы для модальных окон ---

async loadButtonIconsScript() {
    try {
        const scriptPath = '.obsidian/plugins/literary-templates/scripts/button-icons.js';
        const content = await this.app.vault.adapter.read(scriptPath);
        
        // СОЗДАЕМ ЭЛЕМЕНТ SCRIPT ПРАВИЛЬНО
        const scriptEl = document.createElement('script');
        scriptEl.textContent = content; // Загружаем содержимое файла
        document.head.appendChild(scriptEl); // Добавляем в DOM
        
        console.log('Скрипт button-icons.js загружен напрямую');
    } catch (error) {
        console.error('Ошибка загрузки скрипта:', error);
    }
}

    onunload() {
        // console.log('Literary Templates plugin unloaded');
    }




    async _selectProjectParentFolder() {
        try {
            this.logDebug('=== _selectProjectParentFolder вызвана ===');
            
            // 1. Сначала ищем существующие папки проектов
            const existingProjectFolders = await getAllProjectFolders(this.app);
            this.logDebug(`Найдено существующих папок проектов: ${existingProjectFolders.length}: ${existingProjectFolders.join(', ')}`);
            
            // 2. Получаем все папки первого уровня (корня)
            const allFiles = this.app.vault.getAllLoadedFiles();
            const allFolders = allFiles.filter(f => f instanceof TFolder);
            const vaultRoot = this.app.vault.getRoot();
            let rootFolders = allFolders.filter(f => f.parent === vaultRoot);
            this.logDebug(`Найдено папок первого уровня: ${rootFolders.length}: ${rootFolders.map(f => f.name).join(', ')}`);
            this.logDebug(`Из них папки проектов: ${existingProjectFolders.length}: ${existingProjectFolders.join(', ')}`);
            
            // 3. Ищем "Мои Проекты" среди папок первого уровня
            let myProjects = rootFolders.find(f => f.name === 'Мои Проекты');
            
            // 4. Если "Мои Проекты" не найдена, создаем её
            if (!myProjects) {
                this.logDebug('Папка "Мои Проекты" не найдена, создаем...');
                try {
                    myProjects = await this.app.vault.createFolder('Мои Проекты');
                    this.logDebug('Создана папка "Мои Проекты"');
                    
                    // Создаем файл-маркер в папке проектов
                    try {
                        const projectMarkerContent = await this.readTemplateFile('Проекты');
                        if (projectMarkerContent) {
                            const filledContent = this.applyTemplate(projectMarkerContent, {
                                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)
                            });
                            await safeCreateFile('Мои Проекты/Проекты.md', filledContent, this.app);
                            this.logDebug('Создан файл-маркер Проекты.md в папке "Мои Проекты"');
                        } else {
                            // Fallback если шаблон не найден
                            const fallbackContent = `# Папка проектов
Эта папка предназначена для хранения всех ваших литературных проектов и миров.
---
*Создано автоматически плагином Literary Templates*`;
                            await safeCreateFile('Мои Проекты/Проекты.md', fallbackContent, this.app);
                            this.logDebug('Создан файл-маркер Проекты.md в папке "Мои Проекты"');
                        }
                        
                        this.logDebug('Создана папка "Мои Проекты" для хранения проектов.');
                    } catch (e) {
                        this.logDebug(`Ошибка создания папки "Мои Проекты": ${e.message}`);
                        this.logDebug('Ошибка создания папки проектов: ' + e.message);
                        return null;
                    }
                    
                    // 5. Формируем список папок для выбора
                    let folderList = [];
                    
                    // Сначала добавляем существующие папки проектов
                    for (const projectFolderPath of existingProjectFolders) {
                        const projectFolder = this.app.vault.getAbstractFileByPath(projectFolderPath);
                        if (projectFolder && projectFolder instanceof TFolder) {
                            folderList.push(projectFolder);
                        }
                    }
                    
                    // Затем добавляем "Мои Проекты" если её еще нет в списке
                    if (!folderList.find(f => f.path === myProjects.path)) {
                        folderList.unshift(myProjects); // Добавляем в начало
                    }
                    
                    // НЕ добавляем остальные папки первого уровня - только папки проектов
                    // folderList уже содержит только папки проектов и "Мои Проекты"
                    
                    const folderPaths = folderList.map(f => f.path);
                    this.logDebug(`Итоговый список папок для выбора (только папки проектов): ${folderPaths.length}: ${folderPaths.join(', ')}`);
                    
                    // 6. Показываем список пользователю
                    let selectedPath = null;
                    if (typeof window !== 'undefined' && window.app && window.app.plugins) {
                        selectedPath = await this.suggester(
                            folderPaths,
                            folderPaths,
                            'Выберите папку для нового мира/проекта:'
                        );
                    } else if (typeof window !== 'undefined' && window.suggester) {
                        selectedPath = await window.suggester(folderPaths, folderPaths, 'Выберите папку для нового мира/проекта:');
                    } else {
                        selectedPath = folderPaths[0]; // По умолчанию первая папка
                    }
                    
                    // 7. Проверяем результат выбора
                    if (selectedPath === undefined || selectedPath === null) {
                        this.logDebug('Выбор папки отменён пользователем');
                        return null;
                    }
                    
                    this.logDebug(`Выбрана папка: ${selectedPath}`);
                    return selectedPath;
                    
                } catch (error) {
                    this.logDebug(`Ошибка в _selectProjectParentFolder: ${error.message}`);
                    this.logDebug('Ошибка при выборе папки проектов: ' + error.message);
                    return null;
                }
            }
            
            // 5. Формируем список папок для выбора
            let folderList = [];
            
            // Сначала добавляем существующие папки проектов
            for (const projectFolderPath of existingProjectFolders) {
                const projectFolder = this.app.vault.getAbstractFileByPath(projectFolderPath);
                if (projectFolder && projectFolder instanceof TFolder) {
                    folderList.push(projectFolder);
                }
            }
            
            // Затем добавляем "Мои Проекты" если её еще нет в списке
            if (!folderList.find(f => f.path === myProjects.path)) {
                folderList.unshift(myProjects); // Добавляем в начало
            }
            
            // НЕ добавляем остальные папки первого уровня - только папки проектов
            // folderList уже содержит только папки проектов и "Мои Проекты"
            
            const folderPaths = folderList.map(f => f.path);
            // Добавляем опцию создания новой папки
            const CREATE_NEW_LABEL = '[Создать новую папку…]';
            folderPaths.unshift(CREATE_NEW_LABEL);
            this.logDebug(`Итоговый список папок для выбора (только папки проектов): ${folderPaths.length}: ${folderPaths.join(', ')}`);
            
            // 6. Показываем список пользователю
            let selectedPath = null;
            if (typeof window !== 'undefined' && window.app && window.app.plugins) {
                selectedPath = await this.suggester(folderPaths, folderPaths, 'Выберите папку для нового мира/проекта:');
            } else if (typeof window !== 'undefined' && window.suggester) {
                selectedPath = await window.suggester(folderPaths, folderPaths, 'Выберите папку для нового мира/проекта:');
            } else {
                selectedPath = folderPaths[0]; // По умолчанию первая папка
            }
            
            // 7. Проверяем результат выбора
            if (selectedPath === undefined || selectedPath === null) {
                this.logDebug('Выбор папки отменён пользователем');
                return null;
            }

            // Обработка создания новой папки
            if (selectedPath === CREATE_NEW_LABEL) {
                try {
                    const name = await this.prompt?.('Введите имя новой папки проектов');
                    if (!name) { this.logDebug('Создание новой папки отменено'); return null; }
                    const newPath = name.trim();
                    await this.app.vault.createFolder(newPath);
                    // Создаём маркер Проекты.md
                    const markerPath = `${newPath}/Проекты.md`;
                    const markerContent = `# Папка проектов\nЭта папка предназначена для хранения всех ваших литературных проектов и миров.\n---\n*Создано плагином Literary Templates*`;
                    await safeCreateFile(markerPath, markerContent, this.app);
                    this.logDebug(`Создана новая папка проектов: ${newPath}`);
                    return newPath;
                } catch (e) {
                    this.logDebug('Ошибка создания новой папки проектов: ' + e.message);
                    return null;
                }
            }
            
            this.logDebug(`Выбрана папка: ${selectedPath}`);
            return selectedPath;
            
        } catch (error) {
            this.logDebug(`Ошибка в _selectProjectParentFolder: ${error.message}`);
            this.logDebug('Ошибка при выборе папки проектов: ' + error.message);
            return null;
        }
    }


    // === ЛОР: ДОЛГАЯ КОМАНДА — полная пересборка сводного файла ===
    async aiGatherProjectLore() {
        if (this.aiService && typeof this.aiService.gatherProjectLore === 'function') {
            return this.aiService.gatherProjectLore();
        }
        new Notice('AI сервис недоступен');
    }

    // Промпты и выбор шаблонов обрабатываются в AIService

    // Показывает вертикальный список промптов с предпросмотром и тегами (PromptSelectorModal)
    async showPromptSelector() { if (this.aiService && this.aiService.showPromptSelector) return this.aiService.showPromptSelector(); new Notice('AI сервис недоступен'); }

    // === ЛОР: БЫСТРАЯ КОМАНДА — добавить информацию из текущей заметки ===
    async aiAppendCurrentNoteLore() {
        if (this.aiService && this.aiService.aiAppendCurrentNoteLore) return this.aiService.aiAppendCurrentNoteLore();
        new Notice('AI сервис недоступен');
    }
    // Тест AI подключения
    async testAIConnection() {
        if (this.aiService && this.aiService.testConnection) {
            return this.aiService.testConnection();
        }
        new Notice('AI сервис недоступен');
    }
    // Показывает детальную диагностику
    async showDiagnostics(title, diagnostics, advice) { if (this.aiService && this.aiService.showDiagnostics) return this.aiService.showDiagnostics(title, diagnostics, advice); new Notice(title); }
    
    // Вспомогательный метод для получения рекомендаций по типу сущности
    getRecommendationsForType(contentType) {
        if (this.aiService && typeof this.aiService.getRecommendationsForType === 'function') {
            try { return this.aiService.getRecommendationsForType(contentType) || []; } catch (e) {}
        }
        const recommendations = {
            'castle': [
                'История и происхождение',
                'Архитектура и укрепления',
                'Гарнизон и защита',
                'Владельцы и правители',
                'Стратегическое значение',
                'Легенды и предания'
            ],
            'potion': [
                'Ингредиенты и рецепт',
                'Эффекты и применение',
                'Время действия',
                'Побочные эффекты',
                'Способ заваривания',
                'Хранение и срок годности'
            ],
            'artifact': [
                'Происхождение и история',
                'Магические свойства',
                'Владельцы и легенды',
                'Способ активации',
                'Ограничения и риски',
                'Местонахождение'
            ],
            'character': [
                'Внешность и описание',
                'Происхождение и биография',
                'Характер и мотивация',
                'Навыки и способности',
                'Отношения и связи',
                'Цели и планы'
            ],
            'location': [
                'Географическое положение',
                'Климат и природа',
                'Население и культура',
                'Экономика и ресурсы',
                'История и события',
                'Достопримечательности'
            ],
            'city': [
                'География и планировка',
                'Население и демография',
                'Экономика и торговля',
                'Политика и управление',
                'Культура и религия',
                'История и развитие'
            ],
            'village': [
                'Местоположение и окружение',
                'Население и быт',
                'Основные занятия',
                'Традиции и обычаи',
                'Связи с внешним миром',
                'Проблемы и нужды'
            ],
            'province': [
                'Границы и территория',
                'Административное деление',
                'Природные ресурсы',
                'Население и этнический состав',
                'Экономика и промышленность',
                'Культурные особенности'
            ],
            'state': [
                'Территория и границы',
                'Политическая система',
                'Экономика и ресурсы',
                'Население и народы',
                'Внешняя политика',
                'История и традиции'
            ],
            'spell': [
                'Магическая школа',
                'Компоненты и жесты',
                'Эффекты и применение',
                'Уровень сложности',
                'Ограничения и риски',
                'История создания'
            ],
            'alchemy': [
                'Ингредиенты и пропорции',
                'Процесс приготовления',
                'Условия и время',
                'Эффекты и применение',
                'Побочные эффекты',
                'Хранение и стабильность'
            ],
            'mine': [
                'Тип полезных ископаемых',
                'Глубина и протяженность',
                'Оборудование и технологии',
                'Рабочие и условия труда',
                'Производительность',
                'Безопасность и риски'
            ],
            'factory': [
                'Производимая продукция',
                'Технологии и оборудование',
                'Рабочие и специалисты',
                'Сырье и поставки',
                'Производительность',
                'Экология и безопасность'
            ],
            'farm': [
                'Выращиваемые культуры',
                'Площадь и планировка',
                'Технологии и оборудование',
                'Рабочие и специалисты',
                'Урожайность и сезоны',
                'Сбыт и экономика'
            ],
            'port': [
                'Географическое положение',
                'Глубина и гавани',
                'Инфраструктура и оборудование',
                'Торговые маршруты',
                'Население и услуги',
                'Безопасность и защита'
            ],
            'people': [
                'Происхождение и история',
                'Культура и традиции',
                'Язык и письменность',
                'Социальная структура',
                'Религия и верования',
                'Отношения с другими народами'
            ],
            'monster': [
                'Внешний вид и размер',
                'Происхождение и среда обитания',
                'Поведение и повадки',
                'Способности и слабости',
                'Опасность и угроза',
                'Легенды и истории'
            ],
            'task': [
                'Описание и цель',
                'Приоритет и сложность',
                'Требования и ресурсы',
                'Сроки и этапы',
                'Ответственные лица',
                'Критерии выполнения'
            ]
        };
        
        return recommendations[contentType] || [
            'Описание и назначение',
            'История и происхождение',
            'Свойства и характеристики',
            'Применение и использование',
            'Связи и зависимости',
            'Дополнительная информация'
        ];
    }
}


// === НАЧАЛО: Новый способ хранения настроек ===
const SETTINGS_PATH = '.obsidian/plugins/literary-templates/settings.json';

// === КОНЕЦ: Новый способ хранения настроек ===

// === Добавить функцию открытия файла настроек ===
async function openSettingsFile(app) {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (file) {
        await app.workspace.getLeaf(true).openFile(file);
    } else {
        this.logDebug('Файл настроек не найден');
    }
}


module.exports = LiteraryTemplatesPlugin; 
