/**
 * @file       createCastle.js
 * @description Функция создания фортификации (замок/крепость/форт)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityFactory
 */

/**
 * Создание фортификации с использованием EntityFactory
 */
var createCastle = async function(plugin, startPath = '', options = {}) {
    try {
        // Используем универсальную фабрику
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('Castle', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании фортификации: ' + error.message);
        plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createCastle:', error);
    }
};

module.exports = { createCastle };
