/**
 * @file       createPort.js
 * @description Функция создания порта для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies PortWizardModal
 * @created    2025-01-09
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

const { PortWizardModal } = require('../PortWizardModal.js');

/**
 * Создает новый порт в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта
 * @param {Object} options - Дополнительные опции
 */
var createPort = async function(plugin, startPath = '', options = {}) {
    try {
        let projectRoot = '';
        if (startPath) projectRoot = window.findProjectRoot(plugin.app, startPath) || startPath;
        let project = projectRoot;
        if (!project) {
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            if (projects.length === 0) {
                new Notice('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;
        }
        
        const modal = new PortWizardModal(plugin.app, Modal, Setting, Notice, plugin, project, () => plugin.logDebug('Порт создан'), options);
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании порта: ' + error.message);
        try { await plugin.logDebug('createPort error: ' + error.message); } catch {}
    }
}

module.exports = { createPort };
