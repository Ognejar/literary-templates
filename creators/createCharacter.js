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

var createCharacter = async function(plugin, startPath = '', options = {}) {
    try {
        plugin.logDebug('=== createCharacter вызвана ===');
        // Используем резолвер контекста из настроек
        let resolvedProjectRoot = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
            resolvedProjectRoot = ctx.projectRoot || '';
        }
        
        // Fallback: старый способ
        if (!resolvedProjectRoot) {
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
        }

        const modal = new CharacterWizardModal(plugin.app, Modal, Setting, Notice, plugin, resolvedProjectRoot, () => {
            plugin.logDebug('Персонаж создан');
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании персонажа: ' + error.message);
        try { plugin.logDebug('createCharacter error: ' + error.message); } catch (e) {}
    }
};

module.exports = { createCharacter };
