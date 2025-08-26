/**
 * @file       createCity.js
 * @description Функция создания города для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, modals.js, CityWizardModal
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

// Импортируем необходимые функции из main.js
const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');

// Импортируем TFile для проверки типа файла
const { TFile } = require('obsidian');

// Импортируем модальное окно
const { CityWizardModal } = require('../CityWizardModal.js');

/**
 * Создание города
 */
var createCity = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('[DEBUG] createCity: ТЕСТОВЫЙ ЛОГ — ЭТО ТОЧНО НОВЫЙ КОД!');
        await plugin.logDebug('=== createCity вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        console.log('createCity вызвана!');

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

        const modal = new CityWizardModal(plugin.app, Modal, Setting, Notice, project, async (cityData) => {
            try {
                await plugin.logDebug('=== Обработка данных города ===');
                await plugin.logDebug('cityData: ' + JSON.stringify(cityData));
                
                const cleanName = cityData.cityName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
                await plugin.logDebug('cleanName: ' + cleanName);
                
                const featuresContent = cityData.features.map(f => `- ${f}`).join('\n');
                const mainIndustriesContent = cityData.mainIndustries ? cityData.mainIndustries.map(i => `- ${i}`).join('\n') : '';
                const districtsContent = cityData.districts ? cityData.districts.map(d => `- ${d}`).join('\n') : '';
                const uniqueFeaturesContent = cityData.uniqueFeatures ? cityData.uniqueFeatures.map(f => `- ${f}`).join('\n') : '';

                // Поиск изображения в Теговые_картинки по типу
                const tagFolder = `${project}/Теговые_картинки`;
                const baseName = cityData.type || 'Город';
                const exts = ['jpg','jpeg','png','webp'];
                let tagImage = '';
                for (const ext of exts) {
                    const p = `${tagFolder}/${baseName}.${ext}`;
                    const f = plugin.app.vault.getAbstractFileByPath(p);
                    if (f && f instanceof TFile) { tagImage = p; break; }
                }
                const imageBlock = tagImage ? `![[${tagImage}]]` : '';

                // Определяем целевую папку и финальное имя файла (с авто-нумерацией при конфликте)
                const targetFolder = `${project}/Локации/Города`;
                await plugin.logDebug('targetFolder: ' + targetFolder);
                await ensureEntityInfrastructure(targetFolder, cleanName, plugin.app);
                
                let fileName = cleanName;
                const makePath = (name) => `${targetFolder}/${name}.md`;
                let attempt = 1;
                // Если файл существует — добавляем суффикс _2, _3, ...
                while (plugin.app.vault.getAbstractFileByPath(makePath(fileName))) {
                    attempt += 1;
                    fileName = `${cleanName}_${attempt}`;
                }
                await plugin.logDebug('final fileName: ' + fileName);
                
                // Формируем данные для шаблона с ссылками на заметки под финальное имя файла
                const cityNameForFile = fileName;
                // Определяем государство
                let country = '';
                if (cityData.jurisdictionMode === 'province' && cityData.province) {
                    // Если есть провинция, ищем её государство
                    const provinceFile = plugin.app.vault.getAbstractFileByPath(`${project}/Локации/Провинции/${cityData.province}.md`);
                    if (provinceFile) {
                        try {
                            const provinceContent = await plugin.app.vault.read(provinceFile);
                            const stateMatch = provinceContent.match(/state:\s*"([^"]+)"/);
                            if (stateMatch) {
                                country = stateMatch[1];
                            }
                        } catch (e) {
                            await plugin.logDebug('Не удалось прочитать файл провинции для определения государства: ' + e.message);
                        }
                    }
                } else if (cityData.jurisdictionMode === 'countryOnly') {
                    // Если прямой режим, берем государство напрямую
                    country = (cityData.country === 'manual') ? (cityData.countryManual || '') : (cityData.country || '');
                }

                const data = {
                    cityName: cityData.cityName,
                    type: cityData.type || 'Город',
                    typeLower: cityData.type ? cityData.type.toLowerCase() : 'город',
                    province: cityData.province || '',
                    country: country, // Добавляем государство
                    climate: cityData.climate || '',
                    dominantFaction: cityData.dominantFaction || '',
                    // Статус и причина
                    status: cityData.status || 'действует',
                    statusReason: cityData.statusReason || '',
                    statusLabel: (cityData.status === 'заброшено' ? '🏚️ Заброшено' : (cityData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                    description: cityData.description || `[[${cityNameForFile}_Описание|Описание города]]`,
                    history: cityData.history || `[[${cityNameForFile}_История|История города]]`,
                    infrastructure: cityData.infrastructure || `[[${cityNameForFile}_Инфраструктура|Инфраструктура города]]`,
                    economy: cityData.economy || `[[${cityNameForFile}_Экономика|Экономика города]]`,
                    culture: cityData.culture || `[[${cityNameForFile}_Культура|Культура города]]`,
                    date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                    projectName: project.split('/').pop(),
                    mainIndustriesSection: mainIndustriesContent || 'Не указаны',
                    districtsSection: districtsContent || 'Не указаны',
                    featuresContent: featuresContent || 'Не указаны',
                    uniqueFeaturesSection: uniqueFeaturesContent || 'Не указаны',
                    imageBlock
                };
                
                await plugin.logDebug('data для шаблона: ' + JSON.stringify(data));

                // Генерируем контент из шаблона
                await plugin.logDebug('Генерируем контент из шаблона...');
                const content = await generateFromTemplate('Новый_город', data, plugin);
                await plugin.logDebug('Контент сгенерирован, длина: ' + content.length);
                
                const targetPath = makePath(fileName);
                await plugin.logDebug('targetPath: ' + targetPath);
                await plugin.logDebug('targetPath тип: ' + typeof targetPath);
                await plugin.logDebug('targetPath длина: ' + targetPath.length);
                
                await plugin.logDebug('Создаем файл...');
                const file = await safeCreateFile(targetPath, content, plugin.app);
                
                if (file instanceof TFile) {
                    await plugin.logDebug('Файл успешно создан, открываем...');
                    await plugin.app.workspace.getLeaf().openFile(file);
                    new Notice(`Создан город: ${fileName}`);
                }
            } catch (error) {
                await plugin.logDebug('Ошибка в обработке данных города: ' + error.message);
                new Notice('Ошибка при создании города: ' + error.message);
                console.error('Ошибка в createCity:', error);
                // Пробрасываем ошибку дальше, чтобы мастер не закрылся
                throw error;
            }
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании города: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createCity:', error);
    }
}

module.exports = { createCity };
