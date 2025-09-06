/**
 * @file       createFactory.js
 * @description Функция создания завода для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание завода с использованием EntityFactory
 */
var createFactory = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Factory', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании завода: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createFactory:', error);
    }
};

module.exports = { createFactory };
