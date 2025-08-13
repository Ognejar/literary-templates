/**
 * @file       createAlchemyRecipe.js
 * @description Функция создания нового алхимического рецепта с использованием модального окна мастера
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies AlchemyRecipeWizardModal.js
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

const { AlchemyRecipeWizardModal } = require('../AlchemyRecipeWizardModal.js');

async function createAlchemyRecipe(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createAlchemyRecipe: начало ===');
        
        // 1. Найти projectRoot от startPath
        let projectRoot = '';
        if (startPath) {
            await plugin.logDebug(`createAlchemyRecipe: ищем projectRoot от ${startPath}`);
            projectRoot = findProjectRoot(plugin.app, startPath);
            await plugin.logDebug(`Найденный projectRoot: ${projectRoot}`);
        }
        
        let project = '';
        if (projectRoot) {
            project = projectRoot;
            await plugin.logDebug(`Используем найденный projectRoot: ${project}`);
        } else {
            // Fallback: выбор из всех проектов
            await plugin.logDebug('Ищем все проекты...');
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            await plugin.logDebug(`Найдено проектов: ${projects.length}`);
            
            if (projects.length === 0) {
                await plugin.logDebug('Проекты не найдены!');
                new Notice('Проекты не найдены!');
                return;
            }
            
            await plugin.logDebug('Вызываем selectProject для выбора проекта...');
            project = await plugin.selectProject(projects);
            if (!project) {
                await plugin.logDebug('Проект не выбран');
                return;
            }
            await plugin.logDebug(`Выбран проект: ${project}`);
        }

        await plugin.logDebug('Проект выбран, открываем модальное окно...');

        // 2. Открыть модальное окно мастера
        const modal = new AlchemyRecipeWizardModal(
            plugin.app,
            Modal,
            Setting,
            Notice,
            plugin,
            project,
            () => { plugin.logDebug('Алхимический рецепт создан успешно'); }
        );
        
        modal.open();
        
    } catch (error) {
        await plugin.logDebug(`Error in createAlchemyRecipe: ${error.message}`);
        new Notice('Ошибка при создании алхимического рецепта: ' + error.message);
    }
}

// Вспомогательные функции
function findProjectRoot(app, startPath) {
    if (!startPath) return null;
    
    let currentPath = startPath;
    while (currentPath && currentPath !== '/') {
        const settingsFile = app.vault.getAbstractFileByPath(`${currentPath}/Настройки_мира.md`);
        if (settingsFile) {
            return currentPath;
        }
        currentPath = currentPath.split('/').slice(0, -1).join('/');
    }
    return null;
}

module.exports = { createAlchemyRecipe };
