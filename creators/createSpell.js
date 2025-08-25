/**
 * @file       createSpell.js
 * @description Функция создания заклинания для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies SpellWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Классы Obsidian доступны глобально
// Функции импортируются из main.js при сборке
/* global findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile, TFile, Notice, Modal, Setting, SpellWizardModal */

/**
 * Создает новое заклинание в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта (может быть корнем проекта)
 * @param {Object} [options] - Доп. опции: { targetFile?: TFile, prefillName?: string }
 */
var createSpell = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createSpell вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        }
        let project = '';
        if (projectRoot) {
            project = projectRoot;
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

        const modal = new SpellWizardModal(plugin.app, Modal, Setting, Notice, project, async (spellData) => {
            // Добавляем дату и project в данные для шаблона
            // Обрабатываем поля с суффиксом Manual
            // Подбор картинки: по первому тегу заклинания, иначе по слову "Заклинание"
            let tagImage = '';
            try {
                const firstTag = (spellData.tag1 || spellData.tag1Manual || '').trim();
                if (typeof window !== 'undefined' && window.litSettingsService) {
                    if (firstTag) tagImage = window.litSettingsService.findTagImage(plugin.app, project, firstTag);
                    if (!tagImage) tagImage = window.litSettingsService.findTagImage(plugin.app, project, 'Заклинание');
                }
            } catch {}

            // Нормализация значений с учётом режима "manual"
            const normalize = (v, manual) => (v === 'manual' ? (manual || '') : (v || ''));

            const data = {
                ...spellData,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                project: project,
                // Используем manual-текст вместо ключа 'manual'
                school: normalize(spellData.school, spellData.schoolManual),
                level: normalize(spellData.level, spellData.levelManual),
                tag1: normalize(spellData.tag1, spellData.tag1Manual),
                tag2: normalize(spellData.tag2, spellData.tag2Manual),
                tag3: normalize(spellData.tag3, spellData.tag3Manual),
                class1: normalize(spellData.class1, spellData.class1Manual),
                class2: normalize(spellData.class2, spellData.class2Manual),
                effect1Name: normalize(spellData.effect1Name, spellData.effect1Manual),
                effect2Name: normalize(spellData.effect2Name, spellData.effect2Manual),
                effect3Name: normalize(spellData.effect3Name, spellData.effect3Manual),
                tagImage
            };
            const markdown = await generateFromTemplate('Новое_заклинание', data, plugin);
            
            // Сохранение файла в папку проекта
            const cleanName = spellData.spellName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            if (options && options.targetFile instanceof TFile) {
                await plugin.app.vault.modify(options.targetFile, markdown);
                await plugin.app.workspace.getLeaf(true).openFile(options.targetFile);
            } else {
                const targetFolder = `${project}/Магия/Заклинания`;
                await ensureEntityInfrastructure(targetFolder, cleanName, plugin.app);
                const targetPath = `${targetFolder}/${cleanName}.md`;
                await safeCreateFile(targetPath, markdown, plugin.app);
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf(true).openFile(file);
                }
            }
            new Notice(`Создано заклинание: ${cleanName}`);
        }, options);
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании заклинания: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createSpell };
