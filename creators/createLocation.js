/**
 * @file       createLocation.js
 * @description Функция создания локации для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание локации с использованием EntityFactory
 */
var createLocation = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Location', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании локации: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createLocation:', error);
    }
};

module.exports = { createLocation };
