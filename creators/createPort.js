/**
 * @file       createPort.js
 * @description Функция создания порта для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies PortWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate, findTagImage
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Импорт вспомогательных функций из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');
const { TFile } = require('obsidian');

/**
 * Создает новый порт в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта
 */
async function createPort(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createPort вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        // Находим корень проекта
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

        const modal = new PortWizardModal(plugin.app, Modal, Setting, Notice, project, async (portData) => {
            try {
                await plugin.logDebug('Создание порта с данными: ' + JSON.stringify(portData));
                
                // Подготавливаем данные для шаблона
                const cleanName = portData.portName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
                
                // Ищем картинку для порта
                const imageBlock = window.litSettingsService ? window.litSettingsService.getTagImageBlock(plugin.app, projectRoot, 'Порт') : '';
                
                // Подготавливаем секции
                const mainGoodsSection = (portData.mainGoods || []).map(f => `- ${f}`).join('\n') || '';
                const shipsSection = (portData.ships || []).map(f => `- ${f}`).join('\n') || '';
                const featuresSection = (portData.features || []).map(f => `- ${f}`).join('\n') || '';
                
                let provinceSection = '';
                if (portData.province && portData.province.trim()) {
                    provinceSection = `**Провинция:** [[${portData.province.trim()}]]`;
                }
                
                let stateSection = '';
                if (portData.state && portData.state.trim()) {
                    stateSection = `**Государство:** [[${portData.state.trim()}]]`;
                }
                
                // Формируем данные для шаблона
                const data = {
                    name: portData.portName,
                    type: portData.type || 'Порт',
                    climate: portData.climate || '',
                    dominantFaction: portData.dominantFaction || '',
                    harborType: portData.harborType || '',
                    province: portData.province || '',
                    state: portData.state || '',
                    country: portData.country || '',
                    // Статус и причина
                    status: portData.status || 'действует',
                    statusReason: portData.statusReason || '',
                    statusLabel: (portData.status === 'заброшено' ? '🏚️ Заброшено' : (portData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                    projectName: project.split('/').pop(),
                    // Автоссылки для незаполненных полей
                    description: portData.description || `[[${cleanName}_Описание|Описание порта]]`,
                    history: portData.history || `[[${cleanName}_История|История порта]]`,
                    economy: portData.economy || `[[${cleanName}_Экономика|Экономика порта]]`,
                    culture: portData.culture || `[[${cleanName}_Культура|Культура порта]]`,
                    modernProblems: portData.modernProblems || `[[${cleanName}_Современные_проблемы|Современные проблемы порта]]`,
                    geography: portData.geography || `[[${cleanName}_География|География порта]]`,
                    infrastructure: portData.infrastructure || `[[${cleanName}_Инфраструктура|Инфраструктура порта]]`,
                    production: portData.production || `[[${cleanName}_Производство|Производство порта]]`,
                    // Остальные поля
                    docks: portData.docks || '',
                    mainGoodsSection: mainGoodsSection,
                    shipsSection: shipsSection,
                    featuresSection: featuresSection,
                    provinceSection: provinceSection,
                    stateSection: stateSection,
                    imageBlock
                };
                
                // Генерируем контент из шаблона
                const content = await generateFromTemplate('Новый_порт', data, plugin);
                
                // Создаем файл
                const fileName = cleanName;
                const targetFolder = `${project}/Локации/Порты`;
                await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
                const targetPath = `${targetFolder}/${fileName}.md`;
                await safeCreateFile(targetPath, content, plugin.app);
                
                // Открываем файл
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf().openFile(file);
                }
                
                new Notice(`Создан порт: ${fileName}`);
                await plugin.logDebug(`Порт создан: ${targetPath}`);
                
            } catch (error) {
                new Notice('Ошибка при создании порта: ' + error.message);
                await plugin.logDebug('Ошибка создания порта: ' + error.message);
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании порта: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
}

module.exports = { createPort };
