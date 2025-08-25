/**
 * @file       createWorld.js
 * @description Функция создания мира (проекта) для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, modals.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

const { TFolder, TFile } = require('obsidian');

/**
 * Создание мира (проекта)
 */
var createWorld = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createWorld вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        // 1. Запрос названия проекта
        const projectName = await plugin.prompt('Название проекта:');
        if (!projectName) return;
        
        const safeName = projectName.trim()
            .replace(/[^а-яА-ЯёЁ\w\s-.]/g, '')
            .replace(/\s+/g, '_');
        
        await plugin.logDebug('projectName: ' + projectName);
        await plugin.logDebug('safeName: ' + safeName);

        // 2. Выбор типа мира
        const worldTypes = [
            { name: 'Фэнтези', value: 'fantasy' },
            { name: 'Научная фантастика', value: 'scifi' },
            { name: 'Исторический', value: 'historical' },
            { name: 'Современный', value: 'modern' },
            { name: 'Другой', value: 'custom' }
        ];

        const worldType = await plugin.suggester(
            worldTypes.map(t => t.name),
            worldTypes.map(t => t.value),
            'Выберите тип мира:'
        );

        if (!worldType) return;
        await plugin.logDebug('worldType: ' + worldType);

        // 3. Загрузка шаблонов для выбранного типа мира
        const templates = {
            fantasy: {
                races: ['Люди', 'Эльфы', 'Гномы', 'Орки', 'Хоббиты'],
                genders: ['Мужской', 'Женский', 'Другой'],
                statuses: ['Благородный', 'Простолюдин', 'Раб', 'Священник', 'Маг'],
                locationTypes: [
                    'Город','Деревня','Замок','Порт','Храм','Таверна','Лес','Река','Озеро','Море','Гора','Шахта','Подземелье'
                ],
                climates: [
                    'Умеренный','Тропический','Арктический','Пустынный','Субтропический','Субарктический','Экваториальный','Континентальный','Морской','Высокогорный'
                ]
            },
            scifi: {
                races: ['Люди', 'Инопланетяне', 'Андроиды', 'Кибернетики'],
                genders: ['Мужской', 'Женский', 'Нейтральный'],
                statuses: ['Гражданин', 'Иммигрант', 'Преступник', 'Чиновник'],
                locationTypes: [
                    'Город','Деревня','Замок','Порт','Храм','Таверна','Лес','Река','Озеро','Море','Гора','Шахта','Подземелье'
                ],
                climates: [
                    'Умеренный','Тропический','Арктический','Пустынный','Субтропический','Субарктический','Экваториальный','Континентальный','Морской','Высокогорный'
                ]
            },
            historical: {
                races: ['Люди'],
                genders: ['Мужской', 'Женский'],
                statuses: ['Король', 'Дворянин', 'Рыцарь', 'Крестьянин', 'Купец', 'Священник'],
                locationTypes: [
                    'Город','Деревня','Замок','Порт','Храм','Таверна','Лес','Река','Озеро','Море','Гора','Шахта','Подземелье'
                ],
                climates: [
                    'Умеренный','Тропический','Арктический','Пустынный','Субтропический','Субарктический','Экваториальный','Континентальный','Морской','Высокогорный'
                ]
            },
            modern: {
                races: ['Люди'],
                genders: ['Мужской', 'Женский', 'Другой'],
                statuses: ['Гражданин', 'Чиновник', 'Бизнесмен', 'Рабочий', 'Студент'],
                locationTypes: [
                    'Город','Деревня','Замок','Порт','Храм','Таверна','Лес','Река','Озеро','Море','Гора','Шахта','Подземелье'
                ],
                climates: [
                    'Умеренный','Тропический','Арктический','Пустынный','Субтропический','Субарктический','Экваториальный','Континентальный','Морской','Высокогорный'
                ]
            },
            custom: {
                races: ['Люди'],
                genders: ['Мужской', 'Женский'],
                statuses: ['Обычный', 'Особый'],
                locationTypes: [
                    'Город','Деревня','Замок','Порт','Храм','Таверна','Лес','Река','Озеро','Море','Гора','Шахта','Подземелье'
                ],
                climates: [
                    'Умеренный','Тропический','Арктический','Пустынный','Субтропический','Субарктический','Экваториальный','Континентальный','Морской','Высокогорный'
                ]
            }
        };

        const template = templates[worldType] || templates.custom;

        // 4. Основные параметры мира
        const genre = await plugin.prompt('Жанр:', '');
        if (genre === null) return;

        const setting = await plugin.prompt('Сеттинг:', '');
        if (setting === null) return;

        const description = await plugin.prompt('Описание мира:', '');
        if (description === null) return;

        // 5. Расы и народы
        const racesInput = await plugin.prompt('Расы (через запятую):', template.races.join(', '));
        if (racesInput === null) return;
        const races = racesInput.split(',').map(r => r.trim()).filter(Boolean);

        const gendersInput = await plugin.prompt('Полы (через запятую):', template.genders.join(', '));
        if (gendersInput === null) return;
        const genders = gendersInput.split(',').map(g => g.trim()).filter(Boolean);

        const statusesInput = await plugin.prompt('Статусы (через запятую):', template.statuses.join(', '));
        if (statusesInput === null) return;
        const statuses = statusesInput.split(',').map(s => s.trim()).filter(Boolean);

        // 6. Локации
        const locationTypesInput = await plugin.prompt('Типы локаций (через запятую):', template.locationTypes.join(', '));
        if (locationTypesInput === null) return;
        const locationTypes = locationTypesInput.split(',').map(l => l.trim()).filter(Boolean);

        const climatesInput = await plugin.prompt('Климаты (через запятую):', template.climates.join(', '));
        if (climatesInput === null) return;
        const climates = climatesInput.split(',').map(c => c.trim()).filter(Boolean);

        // 7. Особенности народов
        const peopleFeatures = await plugin.prompt('Особенности для разных народов:', '');
        if (peopleFeatures === null) return;

        // 8. Сюжетные линии
        const mainTheme = await plugin.prompt('Главная тема:', '');
        if (mainTheme === null) return;

        const secondaryThemesInput = await plugin.prompt('Второстепенные темы (через запятую):', '');
        if (secondaryThemesInput === null) return;
        const secondaryThemes = secondaryThemesInput.split(',').map(t => t.trim()).filter(Boolean);

        // 9. Создание проекта
        const baseRoot = startPath ? (findProjectRoot(plugin.app, startPath) || startPath) : '';
        const projectPath = baseRoot ? `${baseRoot}/${safeName}` : safeName;
        await plugin.logDebug('startPath: ' + startPath);
        await plugin.logDebug('safeName: ' + safeName);
        await plugin.logDebug('projectPath: ' + projectPath);

        // Создание основной папки проекта
        try {
            await plugin.app.vault.createFolder(projectPath);
            await plugin.logDebug(`Создана основная папка проекта: ${projectPath}`);
        } catch (e) {
            await plugin.logDebug(`Ошибка создания основной папки проекта: ${e.message}`);
            // Проверяем, может папка уже существует
            const existingFolder = plugin.app.vault.getAbstractFileByPath(projectPath);
            if (existingFolder && existingFolder instanceof TFolder) {
                await plugin.logDebug(`Папка проекта уже существует: ${projectPath}`);
            } else {
                throw new Error(`Не удалось создать папку проекта: ${e.message}`);
            }
        }

        // Создание папки для теговых картинок
        const tagImagesPath = `${projectPath}/Теговые_картинки`;
        try {
            await plugin.app.vault.createFolder(tagImagesPath);
            await plugin.logDebug(`Создана папка для теговых картинок: ${tagImagesPath}`);
        } catch (e) {
            await plugin.logDebug(`Ошибка создания папки теговых картинок: ${e.message}`);
            // Проверяем, может папка уже существует
            const existingTagFolder = plugin.app.vault.getAbstractFileByPath(tagImagesPath);
            if (existingTagFolder && existingTagFolder instanceof TFolder) {
                await plugin.logDebug(`Папка теговых картинок уже существует: ${tagImagesPath}`);
            } else {
                await plugin.logDebug(`Не удалось создать папку теговых картинок, но продолжаем создание проекта`);
            }
        }

        // 10. Данные для шаблонов и JSON настроек
        const date = window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10);
        const templateData = {
            projectName: projectName,
            safeName: safeName,
            date: date
        };

        // Создание README файла для папки теговых картинок
        try {
            const readmeContent = await plugin.readTemplateFile('README_Теговые_картинки');
            if (readmeContent) {
                const filledReadme = plugin.applyTemplate(readmeContent, templateData);
                const readmePath = `${tagImagesPath}/README.md`;
                await window.safeCreateFile(readmePath, filledReadme, plugin.app);
                await plugin.logDebug(`Создан README для теговых картинок: ${readmePath}`);
            } else {
                await plugin.logDebug(`Шаблон README_Теговые_картинки не найден`);
            }
        } catch (e) {
            await plugin.logDebug(`Ошибка создания README для теговых картинок: ${e.message}`);
        }

        // Ссылка на редактор настроек
        const vaultName = plugin.app.vault.getName ? plugin.app.vault.getName() : '';
        const editLink = `obsidian://literary-templates?action=edit-settings&vault=${encodeURIComponent(vaultName)}&path=${encodeURIComponent(projectPath)}`;

        // 11. Создание JSON с настройками мира
        const worldSettings = {
            projectName: projectName,
            date: date,
            worldType: worldType,
            genre: genre,
            setting: setting,
            races: races.join(', '),
            genders: genders.join(', '),
            statuses: statuses.join(', '),
            locationTypes: locationTypes.join(', '),
            climates: climates.join(', '),
            peopleFeatures: peopleFeatures,
            mainTheme: mainTheme,
            secondaryThemes: secondaryThemes.join(', '),
            description: description
        };

        const settingsJsonPath = `${projectPath}/Настройки_мира.json`;
        try {
            await window.safeCreateFile(settingsJsonPath, JSON.stringify(worldSettings, null, 2), plugin.app);
            await plugin.logDebug(`Создан JSON настроек: ${settingsJsonPath}`);
        } catch (e) {
            await plugin.logDebug(`Не удалось создать JSON настроек: ${e.message}`);
        }

        // 12. Создание основных файлов проекта
        const filesToCreate = [
            { template: 'Создать_проект', filename: `${projectName}.md` },
            { template: 'Настройки_мира', filename: 'Настройки_мира.md' },
            { template: 'Редактор_настроек', filename: 'Редактор_настроек.md' },
            { template: 'Сюжетные_линии', filename: 'Сюжетные_линии.md' },
            { template: 'Фракции', filename: 'Фракции.md' },
            { template: 'Государства', filename: 'Государства.md' }
        ];

        for (const fileInfo of filesToCreate) {
            try {
                const templateContent = await plugin.readTemplateFile(fileInfo.template);
                if (templateContent) {
                    const filledContent = plugin.applyTemplate(templateContent, templateData);
                    const filePath = `${projectPath}/${fileInfo.filename}`;
                    await window.safeCreateFile(filePath, filledContent, plugin.app);
                    await plugin.logDebug(`Создан файл: ${filePath}`);
                }
            } catch (e) {
                await plugin.logDebug(`Ошибка создания файла ${fileInfo.filename}: ${e.message}`);
            }
        }

        // 13. Заполнение файла настроек мира
        try {
            const settingsContent = await plugin.readTemplateFile('Настройки_мира');
            if (settingsContent) {
                const filledSettings = plugin.applyTemplate(settingsContent, worldSettings);
                const settingsPath = `${projectPath}/Настройки_мира.md`;
                await window.safeCreateFile(settingsPath, filledSettings, plugin.app); // Перезаписать
                await plugin.logDebug(`Обновлен файл настроек: ${settingsPath}`);
            }
        } catch (e) {
            await plugin.logDebug(`Ошибка обновления настроек: ${e.message}`);
        }

        // 14. Заполнение файла сюжетных линий
        try {
            const plotContent = await plugin.readTemplateFile('Сюжетные_линии');
            if (plotContent) {
                const plotData = {
                    ...templateData,
                    mainTheme: mainTheme,
                    secondaryThemes: secondaryThemes
                };
                const filledPlot = plugin.applyTemplate(plotContent, plotData);
                const plotPath = `${projectPath}/Сюжетные_линии.md`;
                await window.safeCreateFile(plotPath, filledPlot, plugin.app); // Перезаписать
                await plugin.logDebug(`Обновлен файл сюжетных линий: ${plotPath}`);
            }
        } catch (e) {
            await plugin.logDebug(`Ошибка обновления сюжетных линий: ${e.message}`);
        }

        // 15. Создание справочника писателя
        try {
            await plugin.logDebug('Создание справочника писателя...');
            const справочникPath = `${projectPath}/Справочник`;
            
            // Создаем папку Справочник
            await plugin.app.vault.createFolder(справочникPath);
            await plugin.logDebug(`Создана папка: ${справочникPath}`);
            
            // Список файлов справочника для копирования
            const справочникFiles = [
                'Справочник_писателя.md',
                'README_справочника.md',
                'Сюжет_и_персонажи.md',
                'Мир_и_экология.md',
                'Культура_и_религия.md',
                'Геополитика_и_экономика.md',
                'Технологии_и_инфраструктура.md',
                'Социальное_и_психологическое.md',
                'История_и_хронология.md',
                'Лингвистика.md'
            ];
            
            // Копируем файлы справочника
            for (const filename of справочникFiles) {
                try {
                    const templateContent = await plugin.readTemplateFile(`Справочник/${filename}`);
                    if (templateContent) {
                        // Настраиваем справочник под конкретный мир
                        const справочникData = {
                            ...templateData,
                            projectName: projectName,
                            worldType: worldType,
                            genre: genre
                        };
                        
                        const filledContent = plugin.applyTemplate(templateContent, справочникData);
                        const filePath = `${справочникPath}/${filename}`;
                        await window.safeCreateFile(filePath, filledContent, plugin.app);
                        await plugin.logDebug(`Создан файл справочника: ${filePath}`);
                    }
                } catch (e) {
                    await plugin.logDebug(`Ошибка создания файла справочника ${filename}: ${e.message}`);
                }
            }
            
            // Создаем папку Руководства
            const руководстваPath = `${справочникPath}/Руководства`;
            await plugin.app.vault.createFolder(руководстваPath);
            
            // Копируем README_руководств.md
            try {
                const руководстваContent = await plugin.readTemplateFile('Справочник/Руководства/README_руководств.md');
                if (руководстваContent) {
                    const filledContent = plugin.applyTemplate(руководстваContent, templateData);
                    const filePath = `${руководстваPath}/README_руководств.md`;
                    await window.safeCreateFile(filePath, filledContent, plugin.app);
                    await plugin.logDebug(`Создан файл руководств: ${filePath}`);
                }
            } catch (e) {
                await plugin.logDebug(`Ошибка создания файла руководств: ${e.message}`);
            }
            
            await plugin.logDebug('Справочник писателя создан успешно');
            
        } catch (e) {
            await plugin.logDebug(`Ошибка создания справочника: ${e.message}`);
        }

        // 16. Добавляем ссылку на справочник в главный файл проекта
        try {
            await plugin.logDebug('Добавление ссылки на справочник в главный файл...');
            const mainFilePath = `${projectPath}/${projectName}.md`;
            const mainFile = plugin.app.vault.getAbstractFileByPath(mainFilePath);
            
            if (mainFile instanceof TFile) {
                let content = await plugin.app.vault.read(mainFile);
                
                // Проверяем, есть ли уже ссылка на справочник
                if (!content.includes('Справочник писателя')) {
                    const справочникLink = `\n\n> [!tip] Методички\n> - [[Справочник/Справочник_писателя|Справочник писателя]]\n`;
                    content = content + справочникLink;
                    
                    await plugin.logDebug(`Добавлена ссылка на справочник в главный файл: ${mainFilePath}`);
                } else {
                    await plugin.logDebug(`Ссылка на справочник уже есть в главном файле`);
                }

                // Добавляем секцию задач проекта (Dataview)
                if (!content.includes('## Задачи проекта')) {
                    const dvBlock = [
                        '',
                        '## Задачи проекта',
                        '',
                        '```dataview',
                        'TASK',
                        `WHERE !completed AND contains(file.path, "${projectPath}/")`,
                        'SORT file.ctime desc',
                        '```',
                        ''
                    ].join('\n');
                    content += dvBlock;
                    await plugin.logDebug('Добавлен блок Dataview задач в главный файл проекта');
                }

                // Добавляем обзор папки проекта (folder-overview)
                if (!content.includes('```folder-overview')) {
                    const foBlock = [
                        '',
                        '## Обзор проекта',
                        '',
                        '```folder-overview',
                        `folderPath: "${projectPath}"`,
                        'title: "Обзор проекта"',
                        'showTitle: false',
                        'depth: 2',
                        'includeTypes:',
                        '  - folder',
                        '  - markdown',
                        'style: list',
                        'disableFileTag: false',
                        'sortBy: name',
                        'sortByAsc: true',
                        'showEmptyFolders: false',
                        'onlyIncludeSubfolders: false',
                        'storeFolderCondition: true',
                        'showFolderNotes: true',
                        'disableCollapseIcon: true',
                        'alwaysCollapse: false',
                        'autoSync: true',
                        'allowDragAndDrop: true',
                        'hideLinkList: true',
                        'hideFolderOverview: false',
                        'useActualLinks: false',
                        'fmtpIntegration: false',
                        '```',
                        ''
                    ].join('\n');
                    content += foBlock;
                    await plugin.logDebug('Добавлен блок folder-overview в главный файл проекта');
                }

                await plugin.app.vault.modify(mainFile, content);
            }
        } catch (e) {
            await plugin.logDebug(`Ошибка добавления ссылки на справочник: ${e.message}`);
        }

        // 17. Открытие основного файла проекта
        try {
            const mainFile = plugin.app.vault.getAbstractFileByPath(`${projectPath}/${projectName}.md`);
            if (mainFile) {
                await plugin.app.workspace.getLeaf().openFile(mainFile);
                await plugin.logDebug(`Открыт основной файл проекта: ${mainFile.path}`);
            }
        } catch (e) {
            await plugin.logDebug(`Ошибка открытия основного файла: ${e.message}`);
        }

        new Notice(`Проект "${projectName}" успешно создан!`);
        await plugin.logDebug(`=== createWorld завершена успешно ===`);

    } catch (error) {
        await plugin.logDebug(`Ошибка в createWorld: ${error.message}`);
        new Notice('Ошибка при создании проекта: ' + error.message);
        console.error('Ошибка создания проекта:', error);
    }
}

module.exports = { createWorld };
