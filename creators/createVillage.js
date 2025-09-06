/**
 * @file       createVillage.js
 * @description Функция создания деревни для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.1
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание деревни с использованием EntityFactory
 */
var createVillage = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Village', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании деревни: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createVillage:', error);
    }
};

module.exports = { createVillage };
