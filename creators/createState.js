/**
 * @file       createState.js
 * @description Функция создания государства для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание государства с использованием EntityFactory
 */
var createState = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('State', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании государства: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createState:', error);
    }
};

module.exports = { createState };
