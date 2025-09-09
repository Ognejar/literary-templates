/**
 * @file       UIHelpers.js
 * @description Вспомогательные функции для UI плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js
 * @created    2025-01-27
 * @updated    2025-01-27
 * @docs       docs/project.md
 */

class UIHelpers {
    /**
     * Создает кнопку для создания сущности
     */
    static createEntityButton(entityType, tooltip = '') {
        const icon = this.getEntityIcon(entityType);
        const commandName = this.getEntityCommandName(entityType);
        
        return `\`\`\`button
name ${icon}Создать ${entityType}
data-tooltip ${tooltip || `Создать новый ${entityType.toLowerCase()}`}
type command
action Literary Templates: ${commandName}
\`\`\``;
    }

    /**
     * Создает большую кнопку для создания сущности
     */
    static createBigEntityButton(entityType, tooltip = '') {
        const icon = this.getEntityIcon(entityType);
        const commandName = this.getEntityCommandName(entityType);
        
        return `\`\`\`button
name ${icon}Создать ${entityType}
data-tooltip ${tooltip || `Создать новый ${entityType.toLowerCase()}`}
type command
action Literary Templates: ${commandName}
class btn btn-primary btn-lg
\`\`\``;
    }

    /**
     * Создает кнопку для открытия модального окна
     */
    static createModalButton(modalName, tooltip = '') {
        return `\`\`\`button
name ${this.getModalIcon(modalName)}${modalName}
data-tooltip ${tooltip}
type command
action Literary Templates: ${this.getModalCommandName(modalName)}
\`\`\``;
    }

    /**
     * Создает кнопку для настройки
     */
    static createSettingsButton(settingName, tooltip = '') {
        return `\`\`\`button
name ⚙️${settingName}
data-tooltip ${tooltip}
type command
action Literary Templates: ${this.getSettingsCommandName(settingName)}
\`\`\``;
    }

    /**
     * Создает блок кнопок для группы сущностей
     */
    static createEntityButtonGroup(entities, title = '') {
        let result = '';
        if (title) {
            result += `### ${title}\n\n`;
        }
        
        entities.forEach(entity => {
            result += this.createEntityButton(entity.type, entity.tooltip) + '\n\n';
        });
        
        return result;
    }

    /**
     * Создает навигационное меню
     */
    static createNavigationMenu(items) {
        let result = '## Навигация\n\n';
        
        items.forEach(item => {
            result += `- [[${item.link}|${item.name}]]\n`;
        });
        
        return result;
    }

    /**
     * Создает блок быстрого доступа
     */
    static createQuickAccessBlock() {
        return `## Быстрый доступ

${this.createEntityButton('Город', 'Создать новый город')}

${this.createEntityButton('Деревня', 'Создать новую деревню')}

${this.createEntityButton('Персонаж', 'Создать нового персонажа')}

${this.createEntityButton('Квест', 'Создать новый квест')}

${this.createSettingsButton('Настройки', 'Открыть настройки плагина')}`;
    }

    /**
     * Получает иконку для типа сущности
     */
    static getEntityIcon(entityType) {
        const icons = {
            'Город': '🏙️',
            'Деревня': '🏘️',
            'Государство': '🏛️',
            'Провинция': '🗺️',
            'Замок': '🏰',
            'Порт': '⚓',
            'Ферма': '🚜',
            'Шахта': '⛏️',
            'Завод': '🏭',
            'Персонаж': '👤',
            'Монстр': '👹',
            'Народ': '👥',
            'Организация': '🏢',
            'Религия': '⛪',
            'Культ': '🔮',
            'Фракция': '⚔️',
            'Квест': '📜',
            'Событие': '📅',
            'Конфликт': '⚡',
            'Сцена': '🎭',
            'Глава': '📖',
            'Задача': '✅',
            'Заклинание': '✨',
            'Зелье': '🧪',
            'Артефакт': '💎',
            'Алхимический рецепт': '⚗️',
            'Торговый путь': '🛤️',
            'Произведение': '📚',
            'Локация': '📍',
            'Мёртвая зона': '💀',
            'Социальное учреждение': '🏛️'
        };
        
        return icons[entityType] || '📄';
    }

    /**
     * Получает иконку для модального окна
     */
    static getModalIcon(modalName) {
        const icons = {
            'Настройки мира': '🌍',
            'Анализ лора': '🔍',
            'Выбор проекта': '📁',
            'Выбор главы': '📖',
            'Создание произведения': '📝'
        };
        
        return icons[modalName] || '🔧';
    }

    /**
     * Получает имя команды для сущности
     */
    static getEntityCommandName(entityType) {
        const commandNames = {
            'Город': 'Создать город',
            'Деревня': 'Создать деревню',
            'Государство': 'Создать государство',
            'Провинция': 'Создать провинцию',
            'Замок': 'Создать замок',
            'Порт': 'Создать порт',
            'Ферма': 'Создать ферму',
            'Шахта': 'Создать шахту',
            'Завод': 'Создать завод',
            'Персонаж': 'Создать персонажа',
            'Монстр': 'Создать монстра',
            'Народ': 'Создать народ',
            'Организация': 'Создать организацию',
            'Религия': 'Создать религию',
            'Культ': 'Создать культ',
            'Фракция': 'Создать фракцию',
            'Квест': 'Создать квест',
            'Событие': 'Создать событие',
            'Конфликт': 'Создать конфликт',
            'Сцена': 'Создать сцену',
            'Глава': 'Создать главу',
            'Задача': 'Создать задачу',
            'Заклинание': 'Создать заклинание',
            'Зелье': 'Создать зелье',
            'Артефакт': 'Создать артефакт',
            'Алхимический рецепт': 'Создать алхимический рецепт',
            'Торговый путь': 'Создать торговый путь',
            'Произведение': 'Создать произведение',
            'Локация': 'Создать локацию',
            'Мёртвая зона': 'Создать мёртвую зону',
            'Социальное учреждение': 'Создать социальное учреждение'
        };
        
        return commandNames[entityType] || `Создать ${entityType}`;
    }

    /**
     * Получает имя команды для модального окна
     */
    static getModalCommandName(modalName) {
        const commandNames = {
            'Настройки мира': 'Открыть настройки проекта',
            'Анализ лора': 'Анализировать лор',
            'Выбор проекта': 'Выбрать проект',
            'Выбор главы': 'Выбрать главу',
            'Создание произведения': 'Создать произведение'
        };
        
        return commandNames[modalName] || modalName;
    }

    /**
     * Получает имя команды для настройки
     */
    static getSettingsCommandName(settingName) {
        const commandNames = {
            'Настройки': 'Открыть настройки Literary Templates',
            'AI-функции': 'Переключить AI-функции',
            'Обновить шаблоны': 'Обновить шаблоны'
        };
        
        return commandNames[settingName] || settingName;
    }

    /**
     * Создает блок с кнопками для всех типов сущностей
     */
    static createAllEntityButtons() {
        const entities = [
            { type: 'Город', tooltip: 'Создать новый город' },
            { type: 'Деревня', tooltip: 'Создать новую деревню' },
            { type: 'Государство', tooltip: 'Создать новое государство' },
            { type: 'Провинция', tooltip: 'Создать новую провинцию' },
            { type: 'Замок', tooltip: 'Создать новый замок' },
            { type: 'Порт', tooltip: 'Создать новый порт' },
            { type: 'Ферма', tooltip: 'Создать новую ферму' },
            { type: 'Шахта', tooltip: 'Создать новую шахту' },
            { type: 'Завод', tooltip: 'Создать новый завод' },
            { type: 'Персонаж', tooltip: 'Создать нового персонажа' },
            { type: 'Монстр', tooltip: 'Создать нового монстра' },
            { type: 'Народ', tooltip: 'Создать новый народ' },
            { type: 'Организация', tooltip: 'Создать новую организацию' },
            { type: 'Религия', tooltip: 'Создать новую религию' },
            { type: 'Культ', tooltip: 'Создать новый культ' },
            { type: 'Фракция', tooltip: 'Создать новую фракцию' },
            { type: 'Квест', tooltip: 'Создать новый квест' },
            { type: 'Событие', tooltip: 'Создать новое событие' },
            { type: 'Конфликт', tooltip: 'Создать новый конфликт' },
            { type: 'Сцена', tooltip: 'Создать новую сцену' },
            { type: 'Глава', tooltip: 'Создать новую главу' },
            { type: 'Задача', tooltip: 'Создать новую задачу' },
            { type: 'Заклинание', tooltip: 'Создать новое заклинание' },
            { type: 'Зелье', tooltip: 'Создать новое зелье' },
            { type: 'Артефакт', tooltip: 'Создать новый артефакт' },
            { type: 'Алхимический рецепт', tooltip: 'Создать новый алхимический рецепт' },
            { type: 'Торговый путь', tooltip: 'Создать новый торговый путь' },
            { type: 'Произведение', tooltip: 'Создать новое произведение' },
            { type: 'Локация', tooltip: 'Создать новую локацию' },
            { type: 'Мёртвая зона', tooltip: 'Создать новую мёртвую зону' },
            { type: 'Социальное учреждение', tooltip: 'Создать новое социальное учреждение' }
        ];

        return this.createEntityButtonGroup(entities, 'Создание сущностей');
    }

    /**
     * Создает блок с кнопками для навигации
     */
    static createNavigationButtons() {
        return `## Навигация

${this.createModalButton('Настройки мира', 'Открыть настройки текущего проекта')}

${this.createModalButton('Анализ лора', 'Анализировать лор текущего файла')}

${this.createSettingsButton('Настройки', 'Открыть настройки плагина')}

${this.createSettingsButton('AI-функции', 'Переключить AI-функции')}

${this.createSettingsButton('Обновить шаблоны', 'Обновить шаблоны плагина')}`;
    }
}

// Экспортируем класс
module.exports = { UIHelpers };

// Глобализируем для использования в main.js
if (typeof window !== 'undefined') {
    window.UIHelpers = UIHelpers;
}
