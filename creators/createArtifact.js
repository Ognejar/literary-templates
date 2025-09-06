/**
 * @file       createArtifact.js
 * @description Функция создания нового артефакта с использованием модального окна мастера
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies ArtifactWizardModal.js
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

const { ArtifactWizardModal } = require('../ArtifactWizardModal.js');

var createArtifact = async function(plugin, startPath = '', options = {}) {
    try {
        plugin.logDebug('=== createArtifact: начало ===');
        
        // Используем резолвер контекста из настроек
        let projectRoot = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
            projectRoot = ctx.projectRoot || '';
        }
        
        // Fallback: старый способ
        if (!projectRoot && startPath) {
            plugin.logDebug(`createArtifact: ищем projectRoot от ${startPath}`);
            projectRoot = window.findProjectRoot(plugin.app, startPath);
            plugin.logDebug(`Найденный projectRoot: ${projectRoot}`);
        }
        
        let project = '';
        if (projectRoot) {
            project = projectRoot;
            plugin.logDebug(`Используем найденный projectRoot: ${project}`);
        } else {
            // Fallback: выбор из всех проектов
            plugin.logDebug('Ищем все проекты...');
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            plugin.logDebug(`Найдено проектов: ${projects.length}`);
            
            if (projects.length === 0) {
                plugin.logDebug('Проекты не найдены!');
                new Notice('Проекты не найдены!');
                return;
            }
            
            plugin.logDebug('Вызываем selectProject для выбора проекта...');
            project = await plugin.selectProject(projects);
            if (!project) {
                plugin.logDebug('Проект не выбран');
                return;
            }
            plugin.logDebug(`Выбран проект: ${project}`);
        }

        plugin.logDebug('Проект выбран, открываем модальное окно...');

        // 2. Открыть модальное окно мастера
        const modal = new ArtifactWizardModal(
            plugin.app,
            Modal,
            Setting,
            Notice,
            plugin,
            project,
            () => {
                plugin.logDebug('Артефакт создан успешно');
            },
            options
        );
        
        modal.open();
        
    } catch (error) {
        plugin.logDebug(`Error in createArtifact: ${error.message}`);
        new Notice('Ошибка при создании артефакта: ' + error.message);
    }
};



module.exports = { createArtifact };
