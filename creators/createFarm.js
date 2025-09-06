/**
 * @file       createFarm.js
 * @description Функция создания фермы для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание фермы с использованием EntityFactory
 */
var createFarm = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Farm', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании фермы: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createFarm:', error);
    }
};

module.exports = { createFarm };
