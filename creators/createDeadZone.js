/**
 * @file       createDeadZone.js
 * @description Функция создания мертвой зоны для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание мёртвой зоны с использованием EntityFactory
 */
var createDeadZone = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('DeadZone', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании мёртвой зоны: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createDeadZone:', error);
    }
};

module.exports = { createDeadZone };
