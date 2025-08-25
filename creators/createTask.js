/**
 * @file       createTask.js
 * @description Создание задачи в папке проекта `Задачи`
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies ensureEntityInfrastructure, safeCreateFile
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

const { TaskWizardModal } = require('./TaskWizardModal.js');

var createTask = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createTask вызвана ===');
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

        const modal = new TaskWizardModal(plugin.app, Modal, Setting, Notice, plugin, resolvedProjectRoot, () => {
            plugin.logDebug('Задача создана');
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании задачи: ' + error.message);
        try { await plugin.logDebug('createTask error: ' + error.message); } catch {}
    }
};

module.exports = { createTask };
