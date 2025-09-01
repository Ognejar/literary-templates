/**
 * @file       createCity.js
 * @description Функция создания города для плагина Literary Templates
 * @author     AI Assistant
 * @version    2.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание города с использованием EntityFactory
 * Применяет принципы DRY, KISS, SRP
 */
var createCity = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('City', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании города: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createCity:', error);
    }
};

module.exports = { createCity };