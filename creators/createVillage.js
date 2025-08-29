/**
 * @file       createVillage.js
 * @description Функция создания деревни для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.1
 * @license    MIT
 * @dependencies main.js, VillageWizardModal.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

// Импорт вспомогательных функций из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');
const { TFile } = require('obsidian');

/**
 * Создание деревни
 */
var createVillage = async function(plugin, projectRoot, options = {}) {
    try {
        await plugin.logDebug('=== createVillage вызвана ===');
        await plugin.logDebug('startPath: ' + projectRoot);
        // 1. Найти projectRoot от startPath
        let project = '';
        if (projectRoot) {
            // Используем findProjectRoot для правильного определения корня проекта
            project = findProjectRoot(plugin.app, projectRoot);
            if (!project) {
                await plugin.logDebug('Не удалось найти корень проекта для: ' + projectRoot);
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
            const provincesFolder = `${project}/Локации/Провинции`;
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
        // --- Запуск VillageWizardModal ---
        const modal = new VillageWizardModal(plugin.app, Modal, Setting, Notice, { provincesList, projectRoot: project }, async (villageData) => {
            // После завершения мастера — создать файл деревни по шаблону
            const cleanName = villageData.villageName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const createdDate = window.moment().format('YYYY-MM-DD');
            
            // Поиск изображения для деревни
            const baseName = 'Деревня';
            const tagImage = window.litSettingsService ? window.litSettingsService.findTagImage(plugin.app, project, baseName) : '';
            const imageBlock = tagImage ? `![[${tagImage}]]` : '';
            
            // Определяем государство для деревни
            let state = villageData.state || '';
            if (!state && villageData.province) {
                try {
                    const provinceFile = plugin.app.vault.getAbstractFileByPath(`${project}/Локации/Провинции/${villageData.province}.md`);
                    if (provinceFile) {
                        const provinceContent = await plugin.app.vault.read(provinceFile);
                        // Ищем и state, и country в провинции
                        const stateMatch = provinceContent.match(/^state:\s*"?([^"\n]+)"?/m);
                        const countryMatch = provinceContent.match(/^country:\s*"?([^"\n]+)"?/m);
                        if (stateMatch) {
                            state = stateMatch[1];
                        } else if (countryMatch) {
                            state = countryMatch[1];
                        }
                    }
                } catch (e) {
                    await plugin.logDebug('Не удалось определить государство из провинции: ' + e.message);
                }
            }
            
            // Если государство всё ещё не определено, используем значение по умолчанию
            if (!state) {
                state = 'не указано';
            }

            // --- Формируем данные для шаблона ---
            const data = {
              date: createdDate,
              villageName: villageData.villageName?.trim() || cleanName,
              climate: villageData.climate || '',
              faction: villageData.faction || '',
              province: villageData.province || '',
              country: state, // Добавляем государство
              // Статус и причина
              status: villageData.status || 'действует',
              statusReason: villageData.statusReason || '',
              statusLabel: (villageData.status === 'заброшено' ? '🏚️ Заброшено' : (villageData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
              description: villageData.description || `[[${cleanName}_Описание|Описание деревни]]`,
              population: villageData.population || '',
              mainCropsSection: (villageData.mainCrops || []).map(c => `- ${c}`).join('\n') || '—',
              craftsSection: (villageData.crafts || []).map(c => `- ${c}`).join('\n') || '—',
              featuresSection: (villageData.features || []).map(f => `- ${f}`).join('\n') || '—',
              projectName: project.split('/').pop(),
              imageBlock
            };
            const content = await generateFromTemplate('Новая_деревня', data, plugin);

            const fileName = cleanName;
            const targetFolder = `${project}/Локации/Деревни`;
            await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
            const targetPath = `${targetFolder}/${fileName}.md`;
            try {
              await safeCreateFile(targetPath, content, plugin.app);
              await plugin.logDebug(`[Village] Файл создан: ${targetPath}`);
            } catch (e) {
              await plugin.logDebug('[Village] Ошибка при создании файла деревни: ' + e.message);
              return;
            }
            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создана деревня: ${fileName}`);
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании деревни: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createVillage };
