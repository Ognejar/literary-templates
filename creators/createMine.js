/**
 * @file       createMine.js
 * @description Функция создания шахты для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies MineWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate, findTagImage
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Импорт вспомогательных функций из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');
const { TFile } = require('obsidian');

/**
 * Создание шахты
 */
async function createMine(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createMine вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);
        // 1. Найти projectRoot от startPath
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        }
        let project = '';

        if (projectRoot) {
            project = projectRoot;
        } else {
            // Fallback: выбор из всех проектов
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
        // --- Автозаполнение ---
        // 1. Провинции
        let provincesList = [];
        try {
            const provincesFolder = `${project}/Провинции`;
            const folder = plugin.app.vault.getAbstractFileByPath(provincesFolder);
            if (folder && folder.children) {
                provincesList = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
                await plugin.logDebug('provincesList: ' + provincesList.join(', '));
            } else {
                provincesList = [];
                await plugin.logDebug('No provinces found');
            }
        } catch (e) { 
            provincesList = []; 
            await plugin.logDebug('Error loading provinces: ' + e.message);
        }
        // --- Запуск MineWizardModal ---
        const modal = new MineWizardModal(plugin.app, Modal, Setting, Notice, project, async (mineData) => {
            try {
                await plugin.logDebug('Создание шахты с данными: ' + JSON.stringify(mineData));
                
                // Подготавливаем данные для шаблона
                const cleanName = mineData.mineName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
                
                // Ищем картинку для шахты
                const imageBlock = window.litSettingsService ? window.litSettingsService.getTagImageBlock(plugin.app, project, 'Шахта') : '';
                
                // Подготавливаем секции
                const resourcesSection = (mineData.resources || []).map(f => `- ${f}`).join('\n') || '';
                const methodsSection = (mineData.methods || []).map(f => `- ${f}`).join('\n') || '';
                const featuresSection = (mineData.features || []).map(f => `- ${f}`).join('\n') || '';
                
                let provinceSection = '';
                if (mineData.province && mineData.province.trim()) {
                    provinceSection = `**Провинция:** [[${mineData.province.trim()}]]`;
                }
                
                let stateSection = '';
                if (mineData.state && mineData.state.trim()) {
                    stateSection = `**Государство:** [[${mineData.state.trim()}]]`;
                }
                
                // Формируем данные для шаблона
                const data = {
                    name: mineData.mineName,
                    type: mineData.type || 'Шахта',
                    climate: mineData.climate || '',
                    dominantFaction: mineData.dominantFaction || '',
                    mineType: mineData.mineType || '',
                    province: mineData.province || '',
                    state: mineData.state || '',
                    country: mineData.country || '',
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                    projectName: project.split('/').pop(),
                    status: mineData.status || 'действует',
                    statusLabel: (mineData.status === 'заброшено' ? '🏚️ Заброшено' : (mineData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                    statusReason: mineData.statusReason || '',
                    // Автоссылки для незаполненных полей
                    description: mineData.description || `[[${cleanName}_Описание|Описание шахты]]`,
                    history: mineData.history || `[[${cleanName}_История|История шахты]]`,
                    economy: mineData.economy || `[[${cleanName}_Экономика|Экономика шахты]]`,
                    culture: mineData.culture || `[[${cleanName}_Культура|Культура шахты]]`,
                    modernProblems: mineData.modernProblems || `[[${cleanName}_Современные_проблемы|Современные проблемы шахты]]`,
                    geography: mineData.geography || `[[${cleanName}_География|География шахты]]`,
                    infrastructure: mineData.infrastructure || `[[${cleanName}_Инфраструктура|Инфраструктура шахты]]`,
                    production: mineData.production || `[[${cleanName}_Производство|Производство шахты]]`,
                    // Остальные поля
                    shafts: mineData.shafts || '',
                    resourcesSection: resourcesSection,
                    methodsSection: methodsSection,
                    featuresSection: featuresSection,
                    provinceSection: provinceSection,
                    stateSection: stateSection,
                    imageBlock
                };
                
                // Генерируем контент из шаблона
                const content = await generateFromTemplate('Новая_шахта', data, plugin);
                
                // Создаем файл
                const fileName = cleanName;
                const targetFolder = `${project}/Локации/Шахты`;
                await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
                const targetPath = `${targetFolder}/${fileName}.md`;
                await safeCreateFile(targetPath, content, plugin.app);
                
                // Открываем файл
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(file);
                }
                
                new Notice(`Создана шахта: ${fileName}`);
                await plugin.logDebug(`Шахта создана: ${targetPath}`);
                
            } catch (error) {
                new Notice('Ошибка при создании шахты: ' + error.message);
                await plugin.logDebug('Ошибка создания шахты: ' + error.message);
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании шахты: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
}

module.exports = { createMine };
