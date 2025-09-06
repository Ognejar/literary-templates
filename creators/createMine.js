/**
 * @file       createMine.js
 * @description Функция создания шахты для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание шахты с использованием EntityFactory
 */
var createMine = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Mine', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании шахты: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createMine:', error);
    }
};

module.exports = { createMine };
