/**
 * @file       createPeople.js
 * @description Создание народа (people/nation) в папке проекта `Народы`
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies ensureEntityInfrastructure, safeCreateFile
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

const { PeopleWizardModal } = require('../PeopleWizardModal.js');

var createPeople = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createPeople вызвана ===');
        // Определяем корень проекта
        let resolvedProjectRoot = '';
        if (startPath) {
            resolvedProjectRoot = findProjectRoot(plugin.app, startPath) || startPath;
        } else {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) resolvedProjectRoot = findProjectRoot(plugin.app, activeFile.parent.path) || '';
        }
        if (!resolvedProjectRoot) {
            const roots = await getAllProjectRoots(plugin.app);
            if (!roots || roots.length === 0) {
                new Notice('Проект не найден: отсутствует файл "Настройки_мира.md"');
                return;
            }
            resolvedProjectRoot = roots[0];
        }

        const modal = new PeopleWizardModal(plugin.app, Modal, Setting, Notice, plugin, resolvedProjectRoot, () => {
            plugin.logDebug('Народ создан');
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании народа: ' + error.message);
        try { await plugin.logDebug('createPeople error: ' + error.message); } catch {}
    }
};

module.exports = { createPeople };


