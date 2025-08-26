/**
 * @file       createState.js
 * @description Функция создания государства для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies StateWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Классы Obsidian доступны глобально

/**
 * Создает новое государство в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта
 */
var createState = async function(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createState вызвана ===');
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

        const modal = new StateWizardModal(plugin.app, Modal, Setting, Notice, project, async (stateData) => {
            const dateStr = window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10);

            // Поиск изображения для государства в папке проекта/Теговые_картинки
            const tagFolder = `${project}/Теговые_картинки`;
            const baseName = 'Государство';
            const exts = ['jpg','jpeg','png','webp'];
            let tagImage = '';
            for (const ext of exts) {
                const p = `${tagFolder}/${baseName}.${ext}`;
                const f = plugin.app.vault.getAbstractFileByPath(p);
                if (f && f instanceof TFile) { tagImage = p; break; }
            }
            const imageBlock = tagImage ? `![[${tagImage}]]` : '';

            const data = {
                ...stateData,
                date: dateStr,
                project: project,
                imageBlock
            };
            const markdown = await generateFromTemplate('Новое_государство', data, plugin);
            
            const cleanName = stateData.stateName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const targetFolder = `${project}/Локации/Государства`;
            await ensureEntityInfrastructure(targetFolder, cleanName, plugin.app);
            // Автонумерация при конфликте имени
            let fileName = cleanName;
            const toPath = (n) => `${targetFolder}/${n}.md`;
            let attempt = 1;
            while (plugin.app.vault.getAbstractFileByPath(toPath(fileName))) {
                attempt += 1;
                fileName = `${cleanName}_${attempt}`;
            }
            const targetPath = toPath(fileName);
            await safeCreateFile(targetPath, markdown, plugin.app);
            
            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создано государство: ${fileName}`);
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании государства: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createState };
