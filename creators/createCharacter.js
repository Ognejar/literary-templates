/**
 * @file       createCharacter.js
 * @description Создание персонажа (character) в папке проекта `Персонажи`
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies ensureEntityInfrastructure, safeCreateFile
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

const { CharacterWizardModal } = require('../CharacterWizardModal.js');

async function createCharacter(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createCharacter вызвана ===');
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

        const modal = new CharacterWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectRoot, () => {
            plugin.logDebug('Персонаж создан');
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании персонажа: ' + error.message);
        try { await plugin.logDebug('createCharacter error: ' + error.message); } catch {}
    }
}

module.exports = { createCharacter };
