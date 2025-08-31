/**
 * @file       createFarm.js
 * @description Функция создания фермы для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies FarmWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate, findTagImage
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Импорт вспомогательных функций из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');
// Импорт модального окна
const { FarmWizardModal } = require('../FarmWizardModal.js');
const { TFile } = require('obsidian');

/**
 * Создание фермы
 */
var createFarm = async function(plugin, projectRoot, options = {}) {
    try {
        await plugin.logDebug('=== createFarm вызвана ===');
        await plugin.logDebug('startPath: ' + projectRoot);
        // 1. Найти projectRoot от startPath
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
        // --- Запуск FarmWizardModal ---
        const modal = new FarmWizardModal(plugin.app, Modal, Setting, Notice, project, async (farmData) => {
            try {
                await plugin.logDebug('Создание фермы с данными: ' + JSON.stringify(farmData));
                
                // Подготавливаем данные для шаблона
                const cleanName = farmData.farmName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
                
                // Ищем картинку для фермы
                const imageBlock = window.litSettingsService ? window.litSettingsService.getTagImageBlock(plugin.app, projectRoot, 'Ферма') : '';
                
                // Подготавливаем секции
                const productsSection = (farmData.products || []).map(f => `- ${f}`).join('\n') || '';
                const livestockSection = (farmData.livestock || []).map(f => `- ${f}`).join('\n') || '';
                const methodsSection = (farmData.methods || []).map(f => `- ${f}`).join('\n') || '';
                const featuresSection = (farmData.features || []).map(f => `- ${f}`).join('\n') || '';
                
                let provinceSection = '';
                if (farmData.province && farmData.province.trim()) {
                    provinceSection = `**Провинция:** [[${farmData.province.trim()}]]`;
                }
                
                let stateSection = '';
                if (farmData.state && farmData.state.trim()) {
                    stateSection = `**Государство:** [[${farmData.state.trim()}]]`;
                }
                
                // Формируем данные для шаблона
                const data = {
                    name: farmData.farmName,
                    type: farmData.type || 'Ферма',
                    climate: farmData.climate || '',
                    dominantFaction: farmData.dominantFaction || '',
                    farmType: farmData.farmType || '',
                    province: farmData.province || '',
                    state: farmData.state || '',
                    country: farmData.country || '',
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                    projectName: project.split('/').pop(),
                    // Статус и причина
                    status: farmData.status || 'действует',
                    statusReason: farmData.statusReason || '',
                    statusLabel: (farmData.status === 'заброшено' ? '🏚️ Заброшено' : (farmData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                    // Автоссылки для незаполненных полей
                    description: farmData.description || `[[${cleanName}_Описание|Описание фермы]]`,
                    history: farmData.history || `[[${cleanName}_История|История фермы]]`,
                    economy: farmData.economy || `[[${cleanName}_Экономика|Экономика фермы]]`,
                    culture: farmData.culture || `[[${cleanName}_Культура|Культура фермы]]`,
                    modernProblems: farmData.modernProblems || `[[${cleanName}_Современные_проблемы|Современные проблемы фермы]]`,
                    geography: farmData.geography || `[[${cleanName}_География|География фермы]]`,
                    infrastructure: farmData.infrastructure || `[[${cleanName}_Инфраструктура|Инфраструктура фермы]]`,
                    production: farmData.production || `[[${cleanName}_Производство|Производство фермы]]`,
                    // Остальные поля
                    fields: farmData.fields || '',
                    productsSection: productsSection,
                    livestockSection: livestockSection,
                    methodsSection: methodsSection,
                    featuresSection: featuresSection,
                    provinceSection: provinceSection,
                    stateSection: stateSection,
                    imageBlock
                };
                
                // Генерируем контент из шаблона
                const content = await generateFromTemplate('Новая_ферма', data, plugin);
                
                // Создаем файл
                const fileName = cleanName;
                const targetFolder = `${project}/Локации/Фермы`;
                await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
                const targetPath = `${targetFolder}/${fileName}.md`;
                await safeCreateFile(targetPath, content, plugin.app);
                
                // Открываем файл
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(file);
                }
                
                new Notice(`Создана ферма: ${fileName}`);
                await plugin.logDebug(`Ферма создана: ${targetPath}`);
                
            } catch (error) {
                new Notice('Ошибка при создании фермы: ' + error.message);
                await plugin.logDebug('Ошибка создания фермы: ' + error.message);
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании фермы: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createFarm };
