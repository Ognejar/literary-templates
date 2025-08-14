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

async function createTask(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createTask вызвана ===');
        // Определяем корень проекта
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        } else {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) projectRoot = findProjectRoot(plugin.app, activeFile.parent.path);
        }
        if (!projectRoot) {
            const roots = await getAllProjectRoots(plugin.app);
            if (!roots || roots.length === 0) {
                new Notice('Проект не найден: отсутствует файл "Настройки_мира.md"');
                return;
            }
            projectRoot = roots[0];
        }

        const modal = new TaskWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectRoot, () => {
            plugin.logDebug('Задача создана');
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании задачи: ' + error.message);
        try { await plugin.logDebug('createTask error: ' + error.message); } catch {}
    }
}

module.exports = { createTask };
