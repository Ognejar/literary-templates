/**
 * @file       createProvince.js
 * @description Функция создания провинции для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание провинции с использованием EntityFactory
 */
var createProvince = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Province', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании провинции: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createProvince:', error);
    }
};

module.exports = { createProvince };
