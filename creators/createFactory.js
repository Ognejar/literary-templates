/**
 * @file       createFactory.js
 * @description Функция создания завода для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies FactoryWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate, findTagImage
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Импорт вспомогательных функций из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');
const { TFile } = require('obsidian');

/**
 * Создание завода
 */
var createFactory = async function(plugin, projectRoot, options = {}) {
    try {
        await plugin.logDebug('=== createFactory вызвана ===');
        await plugin.logDebug('startPath: ' + projectRoot);
        // 1. Найти projectRoot от startPath
        let projectRoot = '';
        if (projectRoot) {
            projectRoot = findProjectRoot(plugin.app, projectRoot);
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
        // --- Запуск FactoryWizardModal ---
        const modal = new FactoryWizardModal(plugin.app, Modal, Setting, Notice, project, async (factoryData) => {
            try {
                await plugin.logDebug('Создание завода с данными: ' + JSON.stringify(factoryData));
                
                // Подготавливаем данные для шаблона
                const cleanName = factoryData.factoryName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
                
                // Ищем картинку для завода
                const imageBlock = window.litSettingsService ? window.litSettingsService.getTagImageBlock(plugin.app, projectRoot, 'Завод') : '';
                
                // Подготавливаем секции
                const productsSection = (factoryData.products || []).map(f => `- ${f}`).join('\n') || '';
                const materialsSection = (factoryData.materials || []).map(f => `- ${f}`).join('\n') || '';
                const technologiesSection = (factoryData.technologies || []).map(f => `- ${f}`).join('\n') || '';
                const featuresSection = (factoryData.features || []).map(f => `- ${f}`).join('\n') || '';
                
                let provinceSection = '';
                if (factoryData.province && factoryData.province.trim()) {
                    provinceSection = `**Провинция:** [[${factoryData.province.trim()}]]`;
                }
                
                let stateSection = '';
                if (factoryData.state && factoryData.state.trim()) {
                    stateSection = `**Государство:** [[${factoryData.state.trim()}]]`;
                }
                
                // Формируем данные для шаблона
                const data = {
                    name: factoryData.factoryName,
                    type: factoryData.type || 'Завод',
                    climate: factoryData.climate || '',
                    dominantFaction: factoryData.dominantFaction || '',
                    factoryType: factoryData.factoryType || '',
                    province: factoryData.province || '',
                    state: factoryData.state || '',
                    country: factoryData.country || '',
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                    projectName: project.split('/').pop(),
                    // Статус и причина
                    status: factoryData.status || 'действует',
                    statusReason: factoryData.statusReason || '',
                    statusLabel: (factoryData.status === 'заброшено' ? '🏚️ Заброшено' : (factoryData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                    // Автоссылки для незаполненных полей
                    description: factoryData.description || `[[${cleanName}_Описание|Описание завода]]`,
                    history: factoryData.history || `[[${cleanName}_История|История завода]]`,
                    economy: factoryData.economy || `[[${cleanName}_Экономика|Экономика завода]]`,
                    culture: factoryData.culture || `[[${cleanName}_Культура|Культура завода]]`,
                    modernProblems: factoryData.modernProblems || `[[${cleanName}_Современные_проблемы|Современные проблемы завода]]`,
                    geography: factoryData.geography || `[[${cleanName}_География|География завода]]`,
                    infrastructure: factoryData.infrastructure || `[[${cleanName}_Инфраструктура|Инфраструктура завода]]`,
                    production: factoryData.production || `[[${cleanName}_Производство|Производство завода]]`,
                    // Остальные поля
                    workshops: factoryData.workshops || '',
                    productsSection: productsSection || 'Не указаны',
                    materialsSection: materialsSection || 'Не указаны',
                    technologiesSection: technologiesSection || 'Не указаны',
                    featuresSection: featuresSection || 'Не указаны',
                    provinceSection: factoryData.province ? `**Провинция:** [[${factoryData.province}]]` : '',
                    stateSection: factoryData.state ? `**Государство:** [[${factoryData.state}]]` : '',
                    imageBlock
                };
                
                // Генерируем контент из шаблона
                const content = await generateFromTemplate('Новый_завод', data, plugin);
                
                // Создаем файл
                const fileName = cleanName;
                const targetFolder = `${project}/Локации/Заводы`;
                await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
                const targetPath = `${targetFolder}/${fileName}.md`;
                await safeCreateFile(targetPath, content, plugin.app);
                
                // Открываем файл
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(file);
                }
                
                new Notice(`Создан завод: ${fileName}`);
                await plugin.logDebug(`Завод создан: ${targetPath}`);
                
            } catch (error) {
                new Notice('Ошибка при создании завода: ' + error.message);
                await plugin.logDebug('Ошибка создания завода: ' + error.message);
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании завода: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
}

module.exports = { createFactory };
