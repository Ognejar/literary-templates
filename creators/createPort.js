/**
 * @file       createPort.js
 * @description Функция создания порта для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

/**
 * Создание порта с использованием EntityFactory
 */
var createPort = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Port', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании порта: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createPort:', error);
    }
};

module.exports = { createPort };
