/**
 * @file       createLocation.js
 * @description Функция создания локации для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, modals.js, LocationWizardModal
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Создание локации
 */
var createLocation = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createLocation вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        let resolvedProjectRoot = '';
        if (startPath) {
            resolvedProjectRoot = findProjectRoot(plugin.app, startPath) || startPath;
        }
        let project = '';
        if (resolvedProjectRoot) {
            project = resolvedProjectRoot;
        } else {
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            if (projects.length === 0) {
                new Notice('Проекты не найдены!');
                await plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;
        }
        await plugin.logDebug('project: ' + project);

        const modal = new LocationWizardModal(plugin.app, Modal, Setting, Notice, project, async (locationData) => {
            const cleanName = locationData.locationName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const featuresContent = locationData.features.map(f => `- ${f}`).join('\n');

            // Формируем данные для шаблона
            const data = {
                ...locationData,
                cleanName: cleanName,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                typeLowercase: locationData.type.toLowerCase(),
                // Статус и причина
                status: locationData.status || 'действует',
                statusReason: locationData.statusReason || '',
                statusLabel: (locationData.status === 'заброшено' ? '🏚️ Заброшено' : (locationData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                featuresContent: featuresContent
            };

            // Генерируем контент из шаблона
            const content = await generateFromTemplate('Новая_локация', data, plugin);
            
            const fileName = cleanName;
            const targetFolder = `${project}/Локации`;
            await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
            const targetPath = `${targetFolder}/${fileName}.md`;
            await safeCreateFile(targetPath, content, plugin.app);

            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создана локация: ${fileName}`);
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании локации: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createLocation };
