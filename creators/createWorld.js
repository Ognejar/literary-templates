/**
 * @file       createWorld.js
 * @description Функция создания нового мира/проекта с упрощенной структурой
 * @author     AI Assistant
 * @version    2.0.0
 * @license    MIT
 * @dependencies obsidian, safeCreateFile, generateFromTemplate, findProjectRoot
 * @created    2025-08-29
 * @updated    2025-08-29
 */

const { TFile, TFolder } = require('obsidian');
const fs = require('fs');
const path = require('path');
const { Notice } = require('obsidian');

/**
 * Создает новый мир/проект с базовой структурой
 */
async function createWorld(plugin, worldData, startPath = '') {
    try {
        console.log('=== createWorld вызвана ===');
        console.log('Данные мира:', worldData);

        // Определяем корень проекта
        let projectRoot = '';
        if (startPath) {
            // Если передан startPath, используем его как корень проекта
            projectRoot = startPath;
            } else {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) {
                projectRoot = findProjectRoot(plugin.app, activeFile.parent.path);
            }
        }

        if (!projectRoot) {
            projectRoot = '';
        }

        // Создаем безопасное имя для папки
        const safeName = worldData.projectName
            .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '')
            .replace(/\s+/g, '_');

        // Путь к папке проекта
        const projectPath = projectRoot ? `${projectRoot}/${safeName}` : safeName;
        
        // Создаем папку проекта
        await ensureFolderExists(plugin.app, projectPath);
        console.log('Папка проекта создана:', projectPath);

        // Создаем папку Локации
        const locationsPath = `${projectPath}/Локации`;
        await ensureFolderExists(plugin.app, locationsPath);
        console.log('Папка Локации создана:', locationsPath);

        // Создаем папку для теговых картинок
        const tagImagesPath = `${projectPath}/Теговые_картинки`;
        await ensureFolderExists(plugin.app, tagImagesPath);
        console.log('Папка теговых картинок создана:', tagImagesPath);

        // Копируем теговые картинки
        await copyTagImagesFs(plugin, tagImagesPath);

        // Подготавливаем данные для шаблона
        const templateData = {
            projectName: worldData.projectName,
            safeName: safeName,
            worldType: worldData.worldType,
            genre: worldData.genre,
            description: worldData.description,
            mainTheme: worldData.mainTheme,
            secondaryThemes: (worldData.secondaryThemes || []).map(s => `"${s}"`).join(', '),
            author: worldData.author,
            status: worldData.status,
            date: new Date().toLocaleDateString('ru-RU'),
            createdDate: new Date().toLocaleDateString('ru-RU')
        };

        console.log('Данные для шаблона:', templateData);

        // Создаем основной файл проекта: ИМЯ ФАЙЛА ДОЛЖНО СОВПАДАТЬ С ИМЕНЕМ ПАПКИ (safeName)
        const desiredMainPath = `${projectPath}/${safeName}.md`;
        const legacyMainPath = `${projectPath}/${worldData.projectName}.md`;
        const mainFileContent = await generateFromTemplate('Новый_мир', templateData, plugin);
        
        // Логируем создание управляющего файла
        plugin.logDebug(
          `Создание управляющего файла: ${desiredMainPath}\nПервые строки:\n${mainFileContent.split('\n').slice(0, 20).join('\n')}`
        );

        // Миграция/создание главного файла согласно правилу
        const desiredFile = plugin.app.vault.getAbstractFileByPath(desiredMainPath);
        const legacyFile = plugin.app.vault.getAbstractFileByPath(legacyMainPath);

        if (desiredFile) {
            // Целевой файл уже есть — опционально обновим, если это пустая болванка overview
            try {
                const content = await plugin.app.vault.read(desiredFile);
                const isOverview = /folder-overview/.test(content);
                if (isOverview) {
                    await plugin.app.vault.adapter.write(desiredMainPath, mainFileContent);
                    plugin.logDebug(`Главный файл обновлён по шаблону (overview -> template): ${desiredMainPath}`);
                }
            } catch (_) {}
            // Удаляем легаси-файл с пробелами, если он дублирует главный
            if (legacyFile) {
                try { await plugin.app.vault.delete(legacyFile); plugin.logDebug(`Удалён дублирующий файл: ${legacyMainPath}`); } catch (_) {}
            }
        } else {
            // Целевого файла нет
            if (legacyFile) {
                // Переносим содержимое из легаси-файла в новый и удаляем старый
                try {
                    const oldContent = await plugin.app.vault.read(legacyFile);
                    const contentToWrite = (oldContent && oldContent.trim().length > 0) ? oldContent : mainFileContent;
                    await plugin.app.vault.adapter.write(desiredMainPath, contentToWrite);
                    await plugin.app.vault.delete(legacyFile);
                    plugin.logDebug(`Перенесён контент из ${legacyMainPath} в ${desiredMainPath} и удалён легаси-файл`);
                } catch (e) {
                    // Если перенос не удался — хотя бы создадим целевой по шаблону
                    await plugin.app.vault.adapter.write(desiredMainPath, mainFileContent);
                    plugin.logDebug(`Создан главный файл по шаблону (перенос не удался): ${desiredMainPath}`);
                }
            } else {
                // Ничего не было — создаём новый по шаблону
                await plugin.app.vault.adapter.write(desiredMainPath, mainFileContent);
                plugin.logDebug(`Создан главный файл: ${desiredMainPath}`);
            }
        }
        console.log('Основной файл создан/подтверждён:', desiredMainPath);

        // Создаем файл настроек мира
        const settingsFilePath = `${projectPath}/Настройки_мира.md`;
        const settingsContent = `# Настройки мира: ${worldData.projectName}

## Основная информация
- **Название:** ${worldData.projectName}
- **Тип:** ${worldData.worldType}
- **Жанр:** ${worldData.genre}
- **Автор:** ${worldData.author}
- **Статус:** ${worldData.status}
- **Дата создания:** ${templateData.createdDate}

## Описание
${worldData.description}

## Темы
- **Главная тема:** ${worldData.mainTheme}
- **Второстепенные темы:** ${worldData.secondaryThemes.join(', ')}

## Структура проекта
- [[${safeName}|Основной файл проекта]]
- [[Локации|Локации]]
- [[Персонажи|Персонажи]]
- [[Сюжетные_линии|Сюжетные линии]]

---
*Этот файл создан автоматически при создании мира*
`;

        await safeCreateFile(settingsFilePath, settingsContent, plugin.app);
        console.log('Файл настроек создан:', settingsFilePath);

        // Создаем базовые файлы структуры (без глав - они создаются отдельным мастером)
        await createStructureFiles(plugin.app, projectPath, safeName, plugin);

        // Создаем справочник писателя
        await createWriterReference(plugin.app, projectPath);

        // Устанавливаем созданный мир как активный проект
        if (plugin.settings) {
            plugin.settings.projectRoot = projectPath;
            await plugin.saveSettings();
            console.log('Проект установлен как активный:', projectPath);
        }

        // Открываем основной файл проекта
        try {
            const openFileRef = plugin.app.vault.getAbstractFileByPath(desiredMainPath);
            if (openFileRef) { await plugin.app.workspace.getLeaf().openFile(openFileRef); console.log('Основной файл открыт'); }
        } catch (_) {}

        console.log('=== createWorld завершена успешно ===');

        return {
            success: true,
            worldPath: projectPath,
            mainFile: desiredMainPath,
            message: `Мир "${worldData.projectName}" успешно создан!`
        };

    } catch (error) {
        console.error('Ошибка в createWorld:', error);
        return {
            success: false,
            error: error.message,
            message: `Ошибка создания мира: ${error.message}`
        };
    }
}

/**
 * Создает базовые файлы структуры проекта
 */
async function createStructureFiles(app, projectPath, safeName, plugin) {
    const structureFiles = [
            {
                path: `${projectPath}/Локации/Локации.md`,
                content: await generateFromTemplate('Локации', { projectName: safeName }, plugin)
            },
        {
            path: `${projectPath}/Персонажи/Персонажи.md`,
            content: await generateFromTemplate('Персонажи', { projectName: safeName }, plugin)
        },
        {
            path: `${projectPath}/Сюжетные_линии/Сюжетные_линии.md`,
            content: await generateFromTemplate('Сюжетные_линии', { projectName: safeName }, plugin)
        },
    ];

    // Создаем папки и файлы структуры
    for (const fileInfo of structureFiles) {
        const folderPath = fileInfo.path.substring(0, fileInfo.path.lastIndexOf('/'));
        await ensureFolderExists(app, folderPath);
        // Логируем создание overview-файла
        if (typeof plugin !== 'undefined' && plugin.logDebug) {
            plugin.logDebug(
                `Создание файла структуры: ${fileInfo.path}\nПервые строки:\n${fileInfo.content.split('\n').slice(0, 10).join('\n')}`
            );
        }
        await safeCreateFile(fileInfo.path, fileInfo.content, app);
        console.log('Файл структуры создан:', fileInfo.path);
    }
}

/**
 * Создает папку, если она не существует
 */
async function ensureFolderExists(app, folderPath) {
    try {
        const folder = app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await app.vault.createFolder(folderPath);
            console.log('Папка создана:', folderPath);
        } else {
            console.log('Папка уже существует:', folderPath);
        }
    } catch (error) {
        console.error('Ошибка создания папки:', folderPath, error);
        throw error;
    }
}


/**
 * Создает справочник писателя
 */
async function createWriterReference(app, projectPath) {
    try {
        console.log('Создание справочника писателя...');
            const справочникPath = `${projectPath}/Справочник`;
            
            // Создаем папку Справочник
        await ensureFolderExists(app, справочникPath);
        console.log('Папка Справочник создана:', справочникPath);
            
        // Создаем файлы справочника
            const pages = [
                ['Справочник_писателя.md', 'Справочник писателя'],
                ['Сюжет_и_персонажи.md', 'Сюжет и персонажи'],
                ['Мир_и_экология.md', 'Мир и экология'],
                ['Культура_и_религия.md', 'Культура и религия'],
                ['Геополитика_и_экономика.md', 'Геополитика и экономика'],
                ['Технологии_и_инфраструктура.md', 'Технологии и инфраструктура'],
                ['Социальное_и_психологическое.md', 'Социальное и психологическое'],
                ['История_и_хронология.md', 'История и хронология'],
                ['Лингвистика.md', 'Лингвистика']
            ];
            
        const fm = (title) => `---
type: Справочник
status: planned
name: "${title}"
---
`;
                
            const hub = fm('Справочник писателя') +
`# Справочник писателя

> [!tip] Навигация
> - [[Справочник/Сюжет_и_персонажи|Сюжет и персонажи]]
> - [[Справочник/Мир_и_экология|Мир и экология]]
> - [[Справочник/Культура_и_религия|Культура и религия]]
> - [[Справочник/Геополитика_и_экономика|Геополитика и экономика]]
> - [[Справочник/Технологии_и_инфраструктура|Технологии и инфраструктура]]
> - [[Справочник/Социальное_и_психологическое|Социальное и психологическое]]
> - [[Справочник/История_и_хронология|История и хронология]]
> - [[Справочник/Лингвистика|Лингвистика]]

## Статусы
planned | started | writing | done | abandoned

## Вкладки
- [[Справочник/Сюжет_и_персонажи]]
- [[Справочник/Мир_и_экология]]
- [[Справочник/Культура_и_религия]]
- [[Справочник/Геополитика_и_экономика]]
- [[Справочник/Технологии_и_инфраструктура]]
- [[Справочник/Социальное_и_психологическое]]
- [[Справочник/История_и_хронология]]
- [[Справочник/Лингвистика]]
`;
            
            const page = (title) => fm(title) + `\n# ${title}\n\n> Статус: {{status}}\n\n`;
            
            for (const [fileName, title] of pages) {
                try {
                    const full = `${справочникPath}/${fileName}`;
                    // Пытаемся прочитать пользовательский шаблон из плагина
                    const tplRel = `.obsidian/plugins/literary-templates/templates/Справочник/${fileName}`;
                    let content = '';
                    try {
                        const exists = await app.vault.adapter.exists(tplRel);
                        if (exists) {
                            content = await app.vault.adapter.read(tplRel);
                        }
                    } catch (_) {}
                    // Фолбэк: генерируем болванку
                    if (!content || content.trim() === '') {
                        content = (fileName === 'Справочник_писателя.md') ? hub : page(title);
                    }
                    await safeCreateFile(full, content, app);
                    // console.log('Файл справочника создан:', full);
                } catch (e) {
                    console.error('Ошибка создания файла справочника', fileName, ':', e.message);
                }
            }
            
        console.log('Справочник писателя создан успешно');
            
        } catch (e) {
        console.error('Ошибка создания справочника:', e.message);
    }
}

/**
 * Копирует все картинки из папки плагина в папку нового мира
 */
async function copyTagImagesFs(plugin, targetPath) {
    try {
        // Абсолютный путь к папке плагина
        const pluginDir = plugin.app.vault.adapter.basePath
            ? path.join(plugin.app.vault.adapter.basePath, '.obsidian', 'plugins', plugin.manifest.id)
            : plugin.app.vault.adapter.getBasePath
                ? path.join(plugin.app.vault.adapter.getBasePath(), '.obsidian', 'plugins', plugin.manifest.id)
                : null;

        if (!pluginDir) {
            new Notice('Не удалось определить путь к папке плагина.');
            return;
        }

        const sourceDir = path.join(pluginDir, 'templates', 'Теговые_картинки');
        if (!fs.existsSync(sourceDir)) {
            new Notice('Папка с теговыми картинками не найдена в плагине.');
            return;
        }

        // Получаем список файлов
        const files = fs.readdirSync(sourceDir);
        for (const fileName of files) {
            const srcFile = path.join(sourceDir, fileName);
            const destFile = path.join(plugin.app.vault.adapter.basePath, targetPath, fileName);

            // Копируем только если это файл
            if (fs.statSync(srcFile).isFile()) {
                // Создаём папку назначения, если нужно
                fs.mkdirSync(path.dirname(destFile), { recursive: true });
                fs.copyFileSync(srcFile, destFile);
                // console.log('Скопирована картинка:', fileName);
            }
        }
        new Notice('Теговые картинки скопированы!');
    } catch (e) {
        new Notice('Ошибка копирования теговых картинок: ' + e.message);
        console.error('Ошибка копирования теговых картинок:', e);
    }
}

module.exports = { createWorld };
