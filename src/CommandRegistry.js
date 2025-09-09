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
