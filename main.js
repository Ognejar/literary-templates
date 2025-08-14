/**
 * @file       main.js
 * @description Плагин Obsidian "Literary Templates": регистрация команд, контекстного меню и генерация заметок по шаблонам
 * @author     Captain Ognejar
 * @version    1.0.0
 * @license    MIT
 * @dependencies creators/*, *WizardModal классы, Obsidian API
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       1_Plugun_work/docs/
 */
// const { writeFileSync } = require('fs'); // Неиспользуется
// const { join } = require('path'); // Неиспользуется
const { MarkdownView, TFile, TFolder, Notice } = require('obsidian');

// Импорт функций создания сущностей
const { createWorld } = require('./creators/createWorld.js');
const { createChapter } = require('./creators/createChapter.js');
const { createCity } = require('./creators/createCity.js');
const { createLocation } = require('./creators/createLocation.js');
const { createScene } = require('./creators/createScene.js');
const { createVillage } = require('./creators/createVillage.js');
const { createDeadZone } = require('./creators/createDeadZone.js');
const { createPort } = require('./creators/createPort.js');
const { createCastle } = require('./creators/createCastle.js');
const { createPotion } = require('./creators/createPotion.js');
const { createSpell } = require('./creators/createSpell.js');
const { createArtifact } = require('./creators/createArtifact.js');

const { createAlchemyRecipe } = require('./creators/createAlchemyRecipe.js');
const { createState } = require('./creators/createState.js');
const { createProvince } = require('./creators/createProvince.js');
const { createPeople } = require('./creators/createPeople.js');

const { createMine } = require('./creators/createMine.js');
const { createFactory } = require('./creators/createFactory.js');
const { createFarm } = require('./creators/createFarm.js');
const { createCharacter } = require('./creators/createCharacter.js');
const { createMonster } = require('./creators/createMonster.js');
const { createTask } = require('./creators/createTask.js');

// Функции для работы с проектами

/**
 * Находит корневую папку проекта, поднимаясь вверх по дереву папок
 * @param {App} app - Экземпляр приложения Obsidian
 * @param {string} startPath - Путь для начала поиска
 * @returns {string|null} - Путь к корневой папке проекта или null
 */
function findProjectRoot(app, startPath = '') {
    if (!startPath) return null;
    
    let currentPath = startPath;
    const maxDepth = 10; // Защита от бесконечного цикла
    let depth = 0;
    
    while (currentPath && depth < maxDepth) {
        const settingsFile = `${currentPath}/Настройки_мира.md`;
        const file = app.vault.getAbstractFileByPath(settingsFile);
        
        if (file && file instanceof TFile) {
            return currentPath;
        }
        
        // Поднимаемся на уровень выше
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        if (parentPath === currentPath) break; // Достигли корня
        currentPath = parentPath;
        depth++;
    }
    
    return null;
}

/**
 * Проверяет, является ли папка папкой проектов (содержит файл-маркер Проекты.md)
 * @param {App} app - Экземпляр приложения Obsidian
 * @param {string} folderPath - Путь к папке для проверки
 * @returns {boolean} - true если это папка проектов
 */
function isProjectFolder(app, folderPath) {
    const projectMarkerFile = `${folderPath}/Проекты.md`;
    const file = app.vault.getAbstractFileByPath(projectMarkerFile);
    return file && file instanceof TFile;
}

/**
 * Получает список всех папок проектов
 * @param {App} app - Экземпляр приложения Obsidian
 * @returns {Promise<string[]>} - Массив путей к папкам проектов
 */
async function getAllProjectFolders(app) {
    const allFiles = app.vault.getMarkdownFiles();
    const projectMarkerFiles = allFiles.filter(f => f.basename === 'Проекты');
    return projectMarkerFiles.map(f => f.parent.path);
}

/**
 * Получает список всех корневых папок проектов
 * @param {App} app - Экземпляр приложения Obsidian
 * @returns {Promise<string[]>} - Массив путей к корневым папкам проектов
 */
async function getAllProjectRoots(app) {
    const allFiles = app.vault.getMarkdownFiles();
    const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
    return projectFiles.map(f => f.parent.path);
}

// --- Вспомогательные функции ---

function fillTemplate(template, data) {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? '');
}

/**
 * Генерирует Markdown-файл из шаблона с плейсхолдерами {{...}}
 * @param {string} templatePath - Путь к .md-шаблону
 * @param {Object} data - Объект с данными для подстановки
 * @returns {Promise<string>} - Итоговый Markdown
 */
async function generateFromTemplate(templateName, data, plugin) {
    // Функция для загрузки шаблона из файла (асинхронно)
    await plugin.logDebug('Reading template: ' + templateName);
    const template = await plugin.readTemplateFile(templateName);
    await plugin.logDebug('Template loaded, length: ' + template.length);
    await plugin.logDebug('Template preview: ' + template.substring(0, 200) + '...');
    
    let result = template;
    
    // 1. Сначала обрабатываем include-блоки (собираем полный шаблон)
    await plugin.logDebug('Processing include blocks...');
    result = await plugin.processIncludeBlocks(result);
    await plugin.logDebug('Include blocks processed, length: ' + result.length);
    
    // 2. Подстановка всех известных плейсхолдеров вида {{key}}
    await plugin.logDebug('Replacing placeholders with data: ' + JSON.stringify(data));
    for (const key of Object.keys(data)) {
        const re = new RegExp(`{{${key}}}`, 'g');
        const replacement = data[key] ?? '';
        await plugin.logDebug(`Replacing {{${key}}} with: "${replacement}"`);
        result = result.replace(re, replacement);
    }
    
    // 3. Обработка условных блоков {{#if condition}}...{{/if}}
    await plugin.logDebug('Processing conditional blocks...');
    result = plugin.processConditionalBlocks(result, data);
    await plugin.logDebug('Conditional blocks processed');
    
    // 4. Финальная очистка: удаляем любые оставшиеся {{...}}
    // Это поведение как у fillTemplate: неизвестные ключи заменяются на пустую строку
    const cleanupRegex = /{{\s*([\w.]+)\s*}}/g;
    result = result.replace(cleanupRegex, '');
    await plugin.logDebug('Final result length: ' + result.length);
    return result;
}

/**
 * Проверяет и создаёт инфраструктуру для сущности: папку, индексный файл, ссылку в индексе
 * @param {string} folderPath - путь к папке (например, 'Провинции')
 * @param {string} entityName - имя новой сущности
 * @param {App} app - экземпляр Obsidian App
 */
async function ensureEntityInfrastructure(folderPath, entityName, app) {
    // console.log(`[DEBUG] ensureEntityInfrastructure вызвана с folderPath: "${folderPath}", entityName: "${entityName}"`);
    
    // 1. Проверить и создать папку
    let folder = app.vault.getAbstractFileByPath(folderPath);
    // console.log(`[DEBUG] Папка найдена: ${folder ? 'Да' : 'Нет'}`);
    if (folder) {
        // console.log(`[DEBUG] Тип папки: ${folder.constructor.name}`);
        // console.log(`[DEBUG] Путь папки: ${folder.path}`);
    }
    
    if (!folder) {
        // console.log(`[DEBUG] Создаем папку: ${folderPath}`);
        try {
            folder = await app.vault.createFolder(folderPath);
            // console.log(`[DEBUG] Папка успешно создана: ${folderPath}`);
            // console.log(`[DEBUG] Созданная папка:`, folder);
        } catch (error) {
            // console.error(`[DEBUG] Ошибка создания папки ${folderPath}:`, error);
            throw error;
        }
    }
    
    // Индексные файлы больше не используются
    // console.log(`[DEBUG] ensureEntityInfrastructure завершена успешно (без индексных файлов)`);
}
/**
 * Безопасно создает файл, проверяя его существование
 * @param {string} filePath - путь к файлу
 * @param {string} content - содержимое файла
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<TFile|null>} - созданный файл или null если файл уже существует
 */
async function safeCreateFile(filePath, content, app) {
    try {
        // Проверяем, существует ли файл
        const existingFile = app.vault.getAbstractFileByPath(filePath);
        if (existingFile) {
            console.warn(`[DEBUG] Файл уже существует: ${filePath}`);
            return existingFile;
        }
        // Создаем файл
        const newFile = await app.vault.create(filePath, content);
        console.log(`[DEBUG] Файл успешно создан: ${filePath}`);
        return newFile;
    } catch (error) {
        // console.error(`[DEBUG] Ошибка создания файла ${filePath}: ${error.message}`);
        throw error;
    }
}

// --- Modal классы определяются в других файлах при сборке ---
// PromptModal, SuggesterModal - в modals.js
// ProjectSelectorModal, ChapterSelectorModal - в отдельных файлах
// *WizardModal классы - в соответствующих файлах

class LiteraryTemplatesPlugin extends Plugin {
    // --- ВСТАВКИ В РЕДАКТОР ---
    getActiveEditor() {
        const ws = this.app.workspace;
        // Пытаемся получить через MarkdownView, если доступен
        try {
             
            if (typeof MarkdownView !== 'undefined' && ws.getActiveViewOfType) {
                 
                const view = ws.getActiveViewOfType(MarkdownView);
                if (view && view.editor) return view.editor;
            }
        } catch {}
        // Фолбэк: через активный лист
        const leaf = ws.getMostRecentLeaf ? ws.getMostRecentLeaf() : ws.activeLeaf;
        const view = leaf && leaf.view ? leaf.view : null;
        if (view && typeof view.getViewType === 'function' && view.getViewType() === 'markdown' && view.editor) {
            return view.editor;
        }
        if (view && view.editor) return view.editor;
        return null;
    }

    async insertTodoAtCursor() {
        const editor = this.getActiveEditor();
        if (!editor) {
            new Notice('Нет активного редактора Markdown');
            return;
        }

        const title = await this.prompt('Текст задачи:');
        if (!title || !title.trim()) {
            new Notice('Текст задачи не указан');
            return;
        }

        const priorityItems = ['', '#критично', '#важно', '#средне', '#низкий'];
        const priorityDisplay = ['Без приоритета', '#критично', '#важно', '#средне', '#низкий'];
        const priority = await this.suggester(priorityItems, priorityDisplay, 'Выберите приоритет (опционально)');

        const due = await this.prompt('Дата (YYYY-MM-DD, опционально):');

        const statusItems = ['open', 'in-progress', 'done'];
        const statusDisplay = ['Открыта', 'В работе', 'Сделано'];
        const status = await this.suggester(statusItems, statusDisplay, 'Статус задачи');

        const checked = status === 'done' ? 'x' : ' ';
        let line = `- [${checked}]`;
        if (priority) line += ` ${priority}`;
        if (due && due.trim()) line += ` \uD83D\uDCC5 ${due.trim()}`; // 📅
        line += ` ${title.trim()}`;
        editor.replaceSelection(line + '\n');
        new Notice('Задача вставлена');
    }

    async insertPlotlineIntoScene() {
        const editor = this.getActiveEditor();
        if (!editor) {
            new Notice('Нет активного редактора Markdown');
            return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) {
            new Notice('Нет активного файла');
            return;
        }
        const cache = this.app.metadataCache.getFileCache(activeFile) || {};
        const fmType = cache.frontmatter && cache.frontmatter.type ? String(cache.frontmatter.type) : '';
        if (fmType !== 'Сцена') {
            const choice = await this.suggester(['yes', 'no'], ['Вставить', 'Отмена'], 'Текущий файл не является сценой. Вставить всё равно?');
            if (choice !== 'yes') return;
        }

        // Определяем projectRoot
        const parentPath = activeFile.parent ? activeFile.parent.path : '';
        let projectRoot = findProjectRoot(this.app, parentPath) || parentPath || this.activeProjectRoot || '';
        if (!projectRoot) {
            const roots = await getAllProjectRoots(this.app);
            if (!roots || roots.length === 0) {
                new Notice('Проект не найден: отсутствует файл "Настройки_мира.md"');
                return;
            }
            projectRoot = roots[0];
        }

        const plotLinesPath = `${projectRoot}/Сюжетные_линии.md`;
        const plotFile = this.app.vault.getAbstractFileByPath(plotLinesPath);
        if (!(plotFile instanceof TFile)) {
            new Notice(`Файл сюжетных линий не найден: ${plotLinesPath}`);
            return;
        }
        const content = await this.app.vault.read(plotFile);

        const lines = content.split(/\r?\n/);
        /** @type {{id:string,title:string,description:string}[]} */
        const plotlines = [];
        let current = null;
        let collectingDesc = false;
        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const line = raw.trim();
            const themeMatch = line.match(/^#{0,3}\s*Тема(\d+)\s*-\s*(.+)$/);
            if (themeMatch) {
                if (current) {
                    plotlines.push(current);
                }
                current = { id: themeMatch[1], title: themeMatch[2].trim(), description: '' };
                collectingDesc = false;
                continue;
            }
            if (current) {
                if (!collectingDesc) {
                    if (/^Описание\s*:/.test(line)) {
                        const after = raw.substring(raw.indexOf('Описание') + 'Описание'.length).replace(/^[\s:]+/, '');
                        current.description = after;
                        collectingDesc = true;
                    }
                } else {
                    // копим описание до следующей темы
                    current.description += (current.description ? '\n' : '') + raw;
                }
            }
        }
        if (current) plotlines.push(current);

        if (plotlines.length === 0) {
            new Notice('Темы не найдены в Сюжетные_линии.md');
            return;
        }

        const items = plotlines.map((p) => `Тема${p.id}`);
        const display = plotlines.map((p) => `Тема${p.id} — ${p.title}`);
        const chosenId = await this.suggester(items, display, 'Выберите сюжетную линию');
        if (!chosenId) return;
        const chosen = plotlines.find((p) => `Тема${p.id}` === chosenId);
        if (!chosen) return;

        const degItems = ['прямая', 'связанная', 'фоновая'];
        const degDisplay = ['Прямая — глава напрямую развивает линию', 'Связанная — косвенная связь', 'Фоновая — создаёт фон'];
        const importance = await this.suggester(degItems, degDisplay, 'Важность сюжета в этой сцене');
        if (!importance) return;

        const role = await this.prompt(`Опишите роль главы в «${chosen.title}» (${importance})`);
        const link = `[[${plotLinesPath}#Тема${chosen.id} - ${chosen.title}|${chosen.title}]]`;
        let text = `- **${link}** (${importance})`;
        if (role && role.trim()) text += `: ${role.trim()}`;
        editor.replaceSelection(text + '\n');
        new Notice(`Сюжетная линия добавлена: ${chosen.title}`);
    }
    // Вспомогательные методы для модальных окон
    async prompt(header, initialValue) {
        // console.log(`[DEBUG] prompt вызван с header: "${header}", initialValue: "${initialValue}"`);
        await this.logDebug(`[DEBUG] prompt вызван с header: "${header}", initialValue: "${initialValue}"`);
        
        try {
            // console.log('[DEBUG] Создаем PromptModal...');
            await this.logDebug('[DEBUG] Создаем PromptModal...');
            const modal = new PromptModal(this.app, Modal, Setting, Notice, header, initialValue);
            // console.log('[DEBUG] PromptModal создан, вызываем openAndGetValue...');
            await this.logDebug('[DEBUG] PromptModal создан, вызываем openAndGetValue...');
            const result = await modal.openAndGetValue();
            // console.log(`[DEBUG] prompt вернул: "${result}"`);
            await this.logDebug(`[DEBUG] prompt вернул: "${result}"`);
            return result;
        } catch (error) {
            // console.error('[DEBUG] Ошибка в prompt:', error);
            await this.logDebug(`[DEBUG] Ошибка в prompt: ${error.message}`);
            throw error;
        }
    }

    async suggester(items, display, placeholder) {
        // console.log(`[DEBUG] suggester вызван с items: ${items.length}, display: ${display.length}, placeholder: "${placeholder}"`);
        await this.logDebug(`[DEBUG] suggester вызван с items: ${items.length}, display: ${display.length}, placeholder: "${placeholder}"`);
        
        try {
            // console.log('[DEBUG] Создаем SuggesterModal...');
            await this.logDebug('[DEBUG] Создаем SuggesterModal...');
            const modal = new SuggesterModal(this.app, Modal, Setting, Notice, items, display, placeholder);
            // console.log('[DEBUG] SuggesterModal создан, вызываем openAndGetValue...');
            await this.logDebug('[DEBUG] SuggesterModal создан, вызываем openAndGetValue...');
            const result = await modal.openAndGetValue();
            // console.log(`[DEBUG] suggester вернул: "${result}"`);
            await this.logDebug(`[DEBUG] suggester вернул: "${result}"`);
            return result;
        } catch (error) {
            // console.error('[DEBUG] Ошибка в suggester:', error);
            await this.logDebug(`[DEBUG] Ошибка в suggester: ${error.message}`);
            throw error;
        }
    }

    async selectProject(projects) {
        return new Promise((resolve) => {
            const modal = new ProjectSelectorModal(this.app, Modal, Setting, Notice, projects, (selectedProject) => {
                resolve(selectedProject);
            });
            modal.open();
        });
    }

    async selectChapter(chapters) {
        return new Promise((resolve) => {
            const modal = new ChapterSelectorModal(this.app, Modal, Setting, Notice, chapters, (selectedChapter) => {
                resolve(selectedChapter);
            });
            modal.open();
        });
    }

    async readTemplateFile(templateName) {
        // Сначала пробуем прочитать из папки плагина
        try {
            // @ts-ignore
            const pluginTemplatePath = '.obsidian/plugins/literary-templates/templates/' + templateName + '.md';
            await this.logDebug(`Пробуем прочитать относительный путь: ${pluginTemplatePath}`);
            const content = await this.app.vault.adapter.read(pluginTemplatePath);
            await this.logDebug(`Шаблон найден в папке плагина, длина: ${content.length}`);
            return content;
        } catch (error) {
            await this.logDebug(`Ошибка чтения из папки плагина: ${error.message}`);
            // Файл не найден в папке плагина, пробуем vault
        }
        
        // Fallback: ищем в vault (для пользовательских шаблонов)
        const userTemplatePath = `Шаблоны/Литшаблоны/${templateName}.md`;
        let templateFile = this.app.vault.getAbstractFileByPath(userTemplatePath);
        
        if (!(templateFile instanceof TFile)) {
            await this.logDebug(`Шаблон не найден и в vault по пути: ${userTemplatePath}`);
            throw new Error(`Template file not found: ${templateName}.md (searched in plugin templates and ${userTemplatePath})`);
        }
        
        return await this.app.vault.read(templateFile);
    }

    applyTemplate(templateContent, data) {
        let content = templateContent;
        
        // Обработка условных операторов {{#if условие}} ... {{/if}}
        content = this.processConditionalBlocks(content, data);
        
        // Замена обычных плейсхолдеров {{key}}
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(placeholder, data[key]);
            }
        }
        
        return content;
    }
    
    processConditionalBlocks(content, data) {
        // Регулярное выражение для поиска условных блоков
        // {{#if условие}} содержимое {{/if}}
        const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
        
        return content.replace(conditionalRegex, (match, condition, blockContent) => {
            // Проверяем условие
            const isTrue = this.evaluateCondition(condition, data);
            
            if (isTrue) {
                // Если условие истинно, возвращаем содержимое блока
                return blockContent;
            } else {
                // Если условие ложно, возвращаем пустую строку
                return '';
            }
        });
    }
    
    evaluateCondition(condition, data) {
        // Убираем лишние пробелы
        condition = condition.trim();
        
        // Проверяем различные типы условий
        
        // 1. Проверка существования ключа: {{#if key}}
        if (data.hasOwnProperty(condition)) {
            const value = data[condition];
            // Возвращаем true если значение существует и не пустое
            return value !== null && value !== undefined && value !== '';
        }
        
        // 2. Проверка существования файла: {{#if file:path/to/file}}
        if (condition.startsWith('file:')) {
            const filePath = condition.substring(5); // Убираем 'file:'
            try {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                return file !== null;
            } catch {
                return false;
            }
        }
        
        // 3. Проверка существования изображения: {{#if image:type}}
        if (condition.startsWith('image:')) {
            const imageType = condition.substring(6); // Убираем 'image:'
            const imagePath = `img/${imageType}.jpg`;
            try {
                const file = this.app.vault.getAbstractFileByPath(imagePath);
                return file !== null;
            } catch {
                return false;
            }
        }
        
        // 4. Булевые значения: {{#if true}} или {{#if false}}
        if (condition === 'true') return true;
        if (condition === 'false') return false;
        
        // 5. Сравнение: {{#if key == value}}
        const comparisonMatch = condition.match(/^(.+)\s*==\s*(.+)$/);
        if (comparisonMatch) {
            const key = comparisonMatch[1].trim();
            const value = comparisonMatch[2].trim();
            return data[key] === value;
        }
        
        // 6. Неравенство: {{#if key != value}}
        const notEqualMatch = condition.match(/^(.+)\s*!=\s*(.+)$/);
        if (notEqualMatch) {
            const key = notEqualMatch[1].trim();
            const value = notEqualMatch[2].trim();
            // Если value - это строка без кавычек, сравниваем как строку
            if (value && !value.startsWith('"') && !value.startsWith('\'')) {
                return data[key] !== value;
            } else {
                // Если value в кавычках, убираем их
                const cleanValue = value.replace(/^["']|["']$/g, '');
                return data[key] !== cleanValue;
            }
        }
        
        // По умолчанию возвращаем false
        return false;
    }
    
    async processIncludeBlocks(content) {
        // Регулярное выражение для поиска include-блоков
        // {{include:path/to/file}}
        const includeRegex = /{{include:([^}]+)}}/g;
        
        // Используем Promise.all для обработки всех include-блоков параллельно
        const promises = [];
        const matches = [];
        
        let match;
        while ((match = includeRegex.exec(content)) !== null) {
            matches.push(match);
            promises.push(this.processSingleInclude(match[1]));
        }
        
        // Ждем все результаты
        const results = await Promise.all(promises);
        
        // Заменяем все include-блоки
        let result = content;
        for (let i = 0; i < matches.length; i++) {
            result = result.replace(matches[i][0], results[i]);
        }
        
        return result;
    }
    
    async processSingleInclude(filePath) {
            try {
                // Сначала пробуем найти в vault (для пользовательских файлов)
                let foundFile = this.app.vault.getAbstractFileByPath(filePath);
                
                if (!foundFile) {
                    // Если не найден в vault, ищем в папке плагина
                    const pluginPath = '.obsidian/plugins/literary-templates/templates/' + filePath;
                    foundFile = this.app.vault.getAbstractFileByPath(pluginPath);
                }
                
                if (!foundFile) {
                    // Если всё ещё не найден, пробуем относительные пути
                    const possiblePaths = [
                        'templates/' + filePath,
                        'sections/' + filePath.replace('sections/', ''),
                        filePath.replace('sections/', '')
                    ];
                    
                    for (const path of possiblePaths) {
                        foundFile = this.app.vault.getAbstractFileByPath(path);
                        if (foundFile) break;
                    }
                }
                
                if (foundFile && foundFile instanceof TFile) {
                    try {
                        const fileContent = await this.app.vault.read(foundFile);
                        return fileContent;
                    } catch (readError) {
                        return `<!-- INCLUDE ERROR: ${filePath} - read error: ${readError.message} -->`;
                    }
                } else {
                    // Если файл не найден в vault, пробуем прочитать напрямую из файловой системы
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        
                        // Путь к папке плагина
                        const pluginDir = path.join(this.app.vault.adapter.basePath, '.obsidian', 'plugins', 'literary-templates', 'templates');
                        const fullPath = path.join(pluginDir, filePath);
                        
                        if (fs.existsSync(fullPath)) {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            return content;
                        }
                    } catch {
                        // Игнорируем ошибки файловой системы
                    }
                    
                    return `<!-- INCLUDE ERROR: ${filePath} not found -->`;
                }
            } catch (error) {
                return `<!-- INCLUDE ERROR: ${filePath} - ${error.message} -->`;
            }
    }

    async onload() {
        // console.log('Literary Templates plugin loading...');
        this.activeProjectRoot = null;
        this.debugEnabled = false;
        
        this.loadData().then(data => {
            if (data && data.activeProjectRoot) {
                this.activeProjectRoot = data.activeProjectRoot;
                // console.log('Загружен активный проект:', this.activeProjectRoot);
            }
            if (data && typeof data.debugEnabled === 'boolean') {
                this.debugEnabled = data.debugEnabled;
            }
        });

        // Создаем папку для секций шаблонов, если её нет
        try {
            const sectionsFolder = 'Шаблоны/sections';
            const folder = this.app.vault.getAbstractFileByPath(sectionsFolder);
            if (!folder) {
                await this.app.vault.createFolder(sectionsFolder);
                // console.log('Создана папка для секций шаблонов:', sectionsFolder);
            }
        } catch (error) {
            console.warn('Не удалось создать папку для секций шаблонов:', error.message);
        }

        this.registerCommands();
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                // console.log('Добавляем меню для файла:', file.path);
                this.addContextMenu(menu, file);
            })
        );
        this.registerEvent(
            this.app.workspace.on('folder-menu', (menu, folder) => {
                // console.log('Добавляем меню для папки:', folder.path);
                this.addContextMenu(menu, folder);
            })
        );
        // Автозапуск редактора при открытии файла "Редактор_настроек.md"
        this.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                try {
                    if (!(file instanceof TFile)) return;
                    if (file.basename !== 'Редактор_настроек') return;
                    const parentPath = file.parent ? file.parent.path : '';
                    const projectRoot = findProjectRoot(this.app, parentPath) || parentPath;
                    await this.logDebug('Auto-open WorldSettings editor for: ' + projectRoot);
                    await this.editWorldSettings(projectRoot);
                    // Автозакрытие вкладки с файлом редактора, чтобы не мешал
                    window.setTimeout(() => {
                        try {
                            const leaves = this.app.workspace.getLeavesOfType('markdown');
                            for (const leaf of leaves) {
                                const view = leaf.view;
                                if (view && view.file && view.file.path === file.path) {
                                    // Закрываем вкладку
                                    if (typeof leaf.detach === 'function') {
                                        leaf.detach();
                                    } else if (this.app.workspace.detachLeaf) {
                                        // @ts-ignore старые версии API
                                        this.app.workspace.detachLeaf(leaf);
                                    }
                                }
                            }
                        } catch {
                            // ignore
                        }
                    }, 50);
                } catch (e) {
                    await this.logDebug('file-open handler error: ' + e.message);
                }
            })
        );
        // Автозапуск мастеров при создании пустых файлов в целевых папках Магии (мягкий режим)
        this.registerEvent(
            this.app.vault.on('create', async (abstractFile) => {
                try {
                    if (!(abstractFile instanceof TFile)) return;
                    if (!abstractFile.extension || abstractFile.extension.toLowerCase() !== 'md') return;
                    const parentPath = abstractFile.parent ? abstractFile.parent.path : '';
                    if (!parentPath) return;
                    // Определяем корень проекта
                    const projectRoot = findProjectRoot(this.app, parentPath);
                    if (!projectRoot) return;
                    // Проверяем, что файл пустой
                    let isEmpty = true;
                    try {
                        if (abstractFile.stat && typeof abstractFile.stat.size === 'number') {
                            isEmpty = abstractFile.stat.size === 0;
                        } else {
                            const text = await this.app.vault.read(abstractFile);
                            isEmpty = !String(text || '').trim();
                        }
                    } catch {}
                    if (!isEmpty) return;
                    // Относительный путь от projectRoot
                    const rel = abstractFile.path.startsWith(projectRoot + '/')
                        ? abstractFile.path.slice(projectRoot.length + 1)
                        : '';
                    if (!rel) return;
                    // Карта целевых папок → тип мастера
                    const map = [
                        { prefix: 'Магия/Зелья/', type: 'potion' },
                        { prefix: 'Магия/Заклинания/', type: 'spell' },
                        { prefix: 'Магия/Артефакты/', type: 'artifact' },
                        { prefix: 'Магия/Алхимия/', type: 'alchemy' },
                    ];
                    const found = map.find(m => rel.startsWith(m.prefix));
                    if (!found) return;
                    const baseName = abstractFile.basename || '';
                    // Мягкий запуск: спрашиваем подтверждение
                    const actionMap = {
                        potion: 'зелья',
                        spell: 'заклинания',
                        artifact: 'артефакта',
                        alchemy: 'алхимического рецепта',
                    };
                    const confirm = await this.suggester(
                        ['yes', 'no'],
                        ['Запустить мастер', 'Отмена'],
                        `Обнаружен новый пустой файл ${actionMap[found.type]} «${baseName}». Запустить мастер и заполнить его?`
                    );
                    if (confirm !== 'yes') return;
                    const options = { targetFile: abstractFile, prefillName: baseName };
                    // Запускаем соответствующий мастер с предзаполнением и записью в уже созданный файл
                    switch (found.type) {
                        case 'potion':
                            await createPotion(this, projectRoot, options);
                            break;
                        case 'spell':
                            await createSpell(this, projectRoot, options);
                            break;
                        case 'artifact':
                            await window.createArtifact(this, projectRoot, options);
                            break;
                        case 'alchemy':
                            await window.createAlchemyRecipe(this, projectRoot, options);
                            break;
                        default:
                            break;
                    }
                } catch (e) {
                    await this.logDebug('create event handler error: ' + (e && e.message ? e.message : String(e)));
                }
            })
        );
        this.addCommand({
            id: 'create-artifact',
            name: 'Создать артефакт (минишаблонизатор)',
            callback: () => createArtifact(this, ''),
        });
        this.addCommand({
            id: 'create-conflict',
            name: 'Создать конфликт (мастер)',
            callback: () => createConflictWizard(this, ''),
        });
        this.addCommand({
            id: 'create-chapter',
            name: 'Создать главу (минишаблонизатор)',
            callback: () => createChapter(this, ''),
        });
        this.addCommand({
            id: 'create-scene',
            name: 'Создать сцену (минишаблонизатор)',
            callback: () => createScene(this, ''),
        });
        this.addCommand({
            id: 'create-village',
            name: 'Создать деревню (минишаблонизатор)',
            callback: () => createVillage(this, ''),
        });
        this.addCommand({
            id: 'create-mine',
            name: 'Создать шахту (минишаблонизатор)',
            callback: () => createMine(this, ''),
        });
        this.addCommand({
            id: 'create-factory',
            name: 'Создать завод (минишаблонизатор)',
            callback: () => createFactory(this, ''),
        });
        this.addCommand({
            id: 'create-farm',
            name: 'Создать ферму (минишаблонизатор)',
            callback: () => createFarm(this, ''),
        });
        this.addCommand({
            id: 'create-potion',
            name: 'Создать зелье (минишаблонизатор)',
            callback: () => createPotion(this, ''),
        });
        this.addCommand({
            id: 'create-people',
            name: 'Создать народ (минишаблонизатор)',
            callback: () => createPeople(this, ''),
        });
        this.addCommand({
            id: 'create-religion',
            name: 'Создать религию (мастер)',
            callback: () => createReligionWizard(this, ''),
        });
        this.addCommand({
            id: 'create-cult',
            name: 'Создать культ (мастер)',
            callback: () => createCultWizard(this, ''),
        });
        this.addCommand({
            id: 'create-trade-route',
            name: 'Создать торговый путь (мастер)',
            callback: () => createTradeRouteWizard(this, ''),
        });
        this.addCommand({
            id: 'create-faction',
            name: 'Создать фракцию (мастер)',
            callback: () => createFactionWizard(this, ''),
        });
        this.addCommand({
            id: 'create-quest',
            name: 'Создать квест (мастер)',
            callback: () => createQuestWizard(this, ''),
        });
        this.addCommand({
            id: 'create-event',
            name: 'Создать событие (мастер)',
            callback: () => createEventWizard(this, ''),
        });
        this.addCommand({
            id: 'create-task',
            name: 'Создать задачу (мастер)',
            callback: () => createTask(this, ''),
        });
        this.addCommand({
            id: 'create-organization',
            name: 'Создать организацию (мастер)',
            callback: () => createOrganizationWizard(this, ''),
        });
        this.addCommand({
            id: 'create-new-potion',
            name: 'Создать новое зелье',
            callback: async () => {
                const project = await findProjectRoot(this.app);
                if (!project) return;
                const modal = new PotionWizardModal(this.app, Modal, Setting, Notice, project, async () => {
                    // Логика создания файла зелья здесь
                });
                modal.open();
            }
        });
        this.addCommand({
            id: 'create-new-spell-wizard',
            name: 'Создать новое заклинание (мастер)',
            callback: () => createSpell(this, ''),
        });
        this.addCommand({
            id: 'insert-todo',
            name: 'Вставить TODO',
            callback: () => this.insertTodoAtCursor(),
        });
        this.addCommand({
            id: 'insert-plotline-into-scene',
            name: 'Вставить сюжетную линию в сцену',
            callback: () => this.insertPlotlineIntoScene(),
        });
        this.addCommand({
            id: 'open-writer-handbook',
            name: 'Справочник писателя (создать/открыть)',
            callback: async () => {
                try {
                    await this.openWriterHandbook();
                } catch (e) {
                    new Notice('Ошибка открытия справочника: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'add-project-tasks-block',
            name: 'Проект: добавить виджет задач (Dataview) на главную',
            callback: async () => {
                try {
                    const activeFile = this.app.workspace.getActiveFile();
                    const startPath = activeFile ? activeFile.parent.path : '';
                    const projectRoot = startPath ? findProjectRoot(this.app, startPath) : null;
                    if (!projectRoot) { new Notice('Проект не найден'); return; }
                    const mainPath = `${projectRoot}/${projectRoot.split('/').pop()}.md`;
                    const file = this.app.vault.getAbstractFileByPath(mainPath);
                    if (!(file instanceof TFile)) { new Notice('Главный файл проекта не найден'); return; }
                    let content = await this.app.vault.read(file);
                    if (content.includes('## Задачи проекта')) { new Notice('Виджет задач уже добавлен'); return; }
                    const dvBlock = [
                        '',
                        '## Задачи проекта',
                        '',
                        '```dataview',
                        'TASK',
                        `WHERE !completed AND contains(file.path, "${projectRoot}/")`,
                        'SORT file.ctime desc',
                        '```',
                        ''
                    ].join('\n');
                    await this.app.vault.modify(file, content + dvBlock);
                    new Notice('Виджет задач добавлен');
                } catch (e) {
                    new Notice('Ошибка добавления виджета задач: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'set-writer-handbook-status',
            name: 'Справочник: установить статус (planned/started/writing/done/abandoned)',
            callback: async () => {
                try {
                    await this.setWriterHandbookStatus();
                } catch (e) {
                    new Notice('Ошибка смены статуса: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'open-writer-handbook',
            name: 'Справочник писателя (создать/открыть)',
            callback: async () => {
                try {
                    await this.openWriterHandbook();
                } catch (e) {
                    new Notice('Ошибка открытия справочника: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'toggle-debug-logging',
            name: 'Переключить отладку (логирование)',
            callback: async () => {
                try {
                    this.debugEnabled = !this.debugEnabled;
                    const state = this.debugEnabled ? 'включена' : 'выключена';
                    new Notice(`Отладка ${state}`);
                    const prev = (await this.loadData()) || {};
                    await this.saveData({
                        ...prev,
                        activeProjectRoot: this.activeProjectRoot || prev.activeProjectRoot || null,
                        debugEnabled: this.debugEnabled
                    });
                } catch (e) {
                    new Notice('Не удалось переключить отладку: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'create-new-character',
            name: 'Создать нового персонажа',
            callback: async () => {
                        try {
            await window.createCharacter(this);
        } catch (error) {
            new Notice('Ошибка при создании персонажа: ' + error.message);
        }
            },
        });
        this.addCommand({
            id: 'create-monster',
            name: 'Создать монстра (минишаблонизатор)',
            callback: () => createMonster(this, ''),
        });
        this.addCommand({
            id: 'create-world',
            name: 'Создать новый мир/проект',
            callback: async () => {
                try {
                    // Выбираем родительскую папку для проекта
                    const parentFolder = await this._selectProjectParentFolder();
                    if (!parentFolder) {
                        await this.logDebug('Создание мира отменено: не выбрана родительская папка');
                        return;
                    }
                    await this.logDebug(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                    await createWorld(this, parentFolder);
                } catch (error) {
                    await this.logDebug(`Ошибка при выборе папки для создания мира: ${error.message}`);
                    new Notice('Ошибка при создании мира: ' + error.message);
                }
            },
        });
        this.addCommand({
            id: 'edit-world-settings',
            name: 'Редактировать настройки мира',
            callback: () => this.editWorldSettings(),
        });

        // Регистрируем obsidian:// обработчик
        try {
            this.registerObsidianProtocolHandler('literary-templates', async (params) => {
                const action = params.action;
                if (action === 'edit-settings') {
                    const path = params.path ? decodeURIComponent(params.path) : '';
                    // Если передан vault и он не совпадает — просто продолжаем, Obsidian сам проверит соответствие
                    await this.logDebug('Protocol edit-settings for path: ' + path);
                    await this.editWorldSettings(path);
                }
            });
        } catch (e) {
            await this.logDebug('Protocol handler error: ' + e.message);
        }
        
        // Делаем функции create* доступными в глобальной области видимости
        window.createWorld = createWorld;
        window.createChapter = createChapter;
        window.createCity = createCity;
        window.createLocation = createLocation;
        window.createScene = createScene;
        window.createVillage = createVillage;
        window.createDeadZone = createDeadZone;
        window.createPort = createPort;
        window.createCastle = createCastle;
        window.createPotion = createPotion;
        window.createSpell = createSpell;
        window.createConflict = createConflictWizard;
        window.createOrganization = createOrganizationWizard;
        window.createReligion = createReligionWizard;
        window.createCult = createCultWizard;
        window.createTradeRoute = createTradeRouteWizard;
        window.createFaction = createFactionWizard;
        window.createQuest = createQuestWizard;
        try {
            window.createArtifact = require('./creators/createArtifact.js').createArtifact;
        } catch {
            window.createArtifact = createArtifact;
        }
        // Явно подтягиваем из модуля, чтобы исключить случаи, когда символ выкинут сборщиком
        try {
            window.createAlchemyRecipe = require('./creators/createAlchemyRecipe.js').createAlchemyRecipe;
        } catch {
            window.createAlchemyRecipe = createAlchemyRecipe;
        }
        try {
            window.createCharacter = require('./creators/createCharacter.js').createCharacter;
        } catch {
            window.createCharacter = createCharacter;
        }
        window.createState = createState;
        window.createProvince = createProvince;
        window.createMine = createMine;
        window.createMonster = createMonster;
        window.createTask = createTask;
        
        // Делаем вспомогательные функции доступными в глобальной области видимости
        window.findProjectRoot = findProjectRoot;
        window.getAllProjectRoots = getAllProjectRoots;
        window.isProjectFolder = isProjectFolder;
        window.getAllProjectFolders = getAllProjectFolders;
        window.fillTemplate = fillTemplate;
        window.generateFromTemplate = generateFromTemplate;
        window.ensureEntityInfrastructure = ensureEntityInfrastructure;
        window.safeCreateFile = safeCreateFile;
        
        // Делаем методы шаблонизатора доступными в глобальной области видимости
        window.processConditionalBlocks = this.processConditionalBlocks.bind(this);
        window.evaluateCondition = this.evaluateCondition.bind(this);
        
        // console.log('Literary Templates plugin loaded');
    }



    async editWorldSettings(startPath = '') {
        try {
            await this.logDebug('=== editWorldSettings вызвана ===');
            // Определить корень проекта
            let projectRoot = '';
            const activeFile = this.app.workspace.getActiveFile();
            if (startPath) {
                projectRoot = findProjectRoot(this.app, startPath);
            } else if (activeFile) {
                projectRoot = findProjectRoot(this.app, activeFile.parent.path);
            }
            if (!projectRoot) {
                const allFiles = this.app.vault.getMarkdownFiles();
                const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
                const projects = projectFiles.map(f => f.parent.path);
                if (projects.length === 0) {
                    new Notice('Проекты не найдены!');
                    await this.logDebug('Проекты не найдены!');
                    return;
                }
                projectRoot = await this.selectProject(projects);
                if (!projectRoot) return;
            }
            await this.logDebug('projectRoot: ' + projectRoot);

            // Прочитать JSON
            const jsonPath = `${projectRoot}/Настройки_мира.json`;
            let settings = null;
            try {
                const raw = await this.app.vault.adapter.read(jsonPath);
                settings = JSON.parse(raw);
            } catch (e) {
                await this.logDebug('Не удалось прочитать JSON, создаем пустой: ' + e.message);
                settings = { projectName: projectRoot.split('/').pop(), date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10) };
            }

            // Открыть модал
            const modal = new WorldSettingsModal(this.app, Modal, Setting, Notice, settings, async (newData) => {
                // Сохранить JSON
                const newRaw = JSON.stringify(newData, null, 2);
                try {
                    if (this.app.vault.getAbstractFileByPath(jsonPath)) {
                        await this.app.vault.adapter.write(jsonPath, newRaw);
                    } else {
                        await this.app.vault.create(jsonPath, newRaw);
                    }
                    await this.logDebug('Настройки сохранены в JSON');
                } catch (e) {
                    await this.logDebug('Ошибка сохранения JSON: ' + e.message);
                }

                // Перегенерировать Настройки_мира.md из шаблона
                try {
                    const md = await generateFromTemplate('Настройки_мира', newData, this);
                    const mdPath = `${projectRoot}/Настройки_мира.md`;
                    const mdFile = this.app.vault.getAbstractFileByPath(mdPath);
                    if (mdFile instanceof TFile) {
                        await this.app.vault.modify(mdFile, md);
                    } else {
                        await this.app.vault.create(mdPath, md);
                    }
                    await this.logDebug('Настройки_мира.md перегенерирован');
                } catch (e) {
                    await this.logDebug('Ошибка генерации Настройки_мира.md: ' + e.message);
                }
            });
            modal.open();
        } catch (error) {
            new Notice('Ошибка при редактировании настроек: ' + error.message);
            await this.logDebug('Ошибка editWorldSettings: ' + error.message);
        }
    }



    async chooseProjectRoot() {
        // console.log('chooseProjectRoot вызвана');
        const roots = await getAllProjectRoots(this.app);
        if (roots.length === 0) {
            new Notice('Проекты не найдены (нет ни одной папки с Настройки_мира.md)');
                return;
        }
        if (roots.length === 1) {
            this.activeProjectRoot = roots[0];
            await this.saveData({ activeProjectRoot: roots[0] });
            new Notice(`Активный проект: ${roots[0]}`);
        } else {
            // TODO: Реализовать модальное окно выбора проекта
            this.activeProjectRoot = roots[0];
            await this.saveData({ activeProjectRoot: roots[0] });
            let projectList = 'Доступные проекты:\n';
            roots.forEach((root, index) => {
                projectList += `${index + 1}. ${root}\n`;
            });
            new Notice(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
        }
    }

    async openTemplaterPalette(templateName) {
        // console.log('openTemplaterPalette вызвана с templateName:', templateName);
        try {
            // Определяем проект и устанавливаем переменную
            const activeFile = this.app.workspace.getActiveFile();
            // console.log('Активный файл:', activeFile ? activeFile.path : 'нет');
            
            let startPath = '';
            
            if (activeFile) {
                startPath = activeFile.parent.path;
                // console.log('Путь из активного файла:', startPath);
            } else if (this.activeProjectRoot) {
                startPath = this.activeProjectRoot;
                // console.log('Путь из активного проекта:', startPath);
            }
            
            let projectRoot = findProjectRoot(this.app, startPath);
            // console.log('Найденный projectRoot:', projectRoot);
            
            if (!projectRoot) {
                // console.log('Проект не найден, ищем все проекты');
                const roots = await getAllProjectRoots(this.app);
                if (roots.length === 0) {
                    new Notice('Проекты не найдены (нет ни одной папки с Настройки_мира.md)');
                return;
                }
                if (roots.length === 1) {
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    await this.saveData({ activeProjectRoot: roots[0] });
                    new Notice(`Выбран проект: ${roots[0]}`);
                } else {
                    // TODO: Реализовать модальное окно выбора проекта
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    await this.saveData({ activeProjectRoot: roots[0] });
                    let projectList = 'Доступные проекты:\n';
                    roots.forEach((root, index) => {
                        projectList += `${index + 1}. ${root}\n`;
                    });
                    new Notice(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
                }
            }
            
            // Устанавливаем переменную для шаблонов
            window.tp = window.tp || {};
            window.tp.literaryProjectRoot = projectRoot;
            // console.log('Установлена переменная tp.literaryProjectRoot:', projectRoot);
            
            // Открываем палитру команд Templater через Obsidian API
            // console.log('Выполняем команду templater-obsidian:insert-templater');
            this.app.commands.executeCommandById('templater-obsidian:insert-templater');
            new Notice(`Открыта палитра Templater. Выберите шаблон "${templateName}"`);
            // console.log('Команда выполнена, уведомление показано');
        } catch (error) {
            // console.error('Ошибка при открытии палитры Templater:', error);
            new Notice(`Ошибка: ${error.message}`);
        }
    }



    async logDebug(message) {
        // Тихий режим: если отладка выключена — выходим
        if (!this.debugEnabled) return;
        // Дублируем вывод в консоль для удобной отладки
        try {
            const now = window.moment ? window.moment().format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString();
            const line = `[${now}] ${message}`;
            // Единая точка консольного вывода
             
            console.log(line);

            // Пишем лог в .obsidian, чтобы Dataview его не индексировал
            const logPath = '.obsidian/plugins/literary-templates/log.md';
            let prev = '';
            try {
                prev = await this.app.vault.adapter.read(logPath);
            } catch {
                prev = '';
            }
            await this.app.vault.adapter.write(logPath, prev + line + '\n');
        } catch (e) {
             
            console.error('logDebug error:', e);
        }
    }











    async openWriterHandbook() {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
            let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
            if (!projectRoot) {
                const roots = await getAllProjectRoots(this.app);
                if (!roots || roots.length === 0) {
                    new Notice('Проект не найден: отсутствует "Настройки_мира.md"');
                    return;
                }
                projectRoot = roots[0];
            }
            const dir = `${projectRoot}/Справочник`;
            await ensureEntityInfrastructure(dir, 'index', this.app);
            const pages = [
                ['Справочник_писателя.md', 'Справочник писателя'],
                ['Сюжет_и_персонажи.md', 'Сюжет и персонажи'],
                ['Мир_и_экология.md', 'Мир и экология'],
                ['Культура_и_религия.md', 'Культура и религия'],
                ['Геополитика_и_экономика.md', 'Геополитика и экономика'],
                ['Технологии_и_инфраструктура.md', 'Технологии и инфраструктура'],
                ['Социальное_и_психологическое.md', 'Социальное и психологическое'],
            ];
            const fm = (title) => `---\n` +
                `type: Справочник\n` +
                `status: planned\n` +
                `name: "${title}"\n` +
                `---\n`;
            const hub = fm('Справочник писателя') +
`# Справочник писателя

> [!tip] Навигация
> - [[Справочник/Сюжет_и_персонажи|Сюжет и персонажи]]
> - [[Справочник/Мир_и_экология|Мир и экология]]
> - [[Справочник/Культура_и_религия|Культура и религия]]
> - [[Справочник/Геополитика_и_экономика|Геополитика и экономика]]
> - [[Справочник/Технологии_и_инфраструктура|Технологии и инфраструктура]]
> - [[Справочник/Социальное_и_психологическое|Социальное и психологическое]]

## Статусы
planned | started | writing | done | abandoned

## Вкладки
- [[Справочник/Сюжет_и_персонажи]]
- [[Справочник/Мир_и_экология]]
- [[Справочник/Культура_и_религия]]
- [[Справочник/Геополитика_и_экономика]]
- [[Справочник/Технологии_и_инфраструктура]]
- [[Справочник/Социальное_и_психологическое]]
`;
            const page = (title) => fm(title) + `\n# ${title}\n\n> Статус: {{status}}\n\n`;
            for (const [fileName, title] of pages) {
                const full = `${dir}/${fileName}`;
                const exists = this.app.vault.getAbstractFileByPath(full);
                const content = fileName === 'Справочник_писателя.md' ? hub : page(title);
                if (exists instanceof TFile) {
                    const text = await this.app.vault.read(exists);
                    if (!String(text || '').trim()) await this.app.vault.modify(exists, content);
                } else {
                    await safeCreateFile(full, content, this.app);
                }
            }
            const hubPath = `${dir}/Справочник_писателя.md`;
            const file = this.app.vault.getAbstractFileByPath(hubPath);
            if (file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
            new Notice('Справочник писателя готов');
        } catch (error) {
            new Notice('Ошибка справочника: ' + error.message);
        }
    }

    async setWriterHandbookStatus() {
        const editorFile = this.app.workspace.getActiveFile();
        if (!(editorFile instanceof TFile)) {
            new Notice('Нет активного файла');
            return;
        }
        const path = editorFile.path || '';
        if (!/\/Справочник\//.test(path)) {
            new Notice('Команда работает для файлов в папке "Справочник"');
            return;
        }
        const items = ['planned', 'started', 'writing', 'done', 'abandoned'];
        const display = ['planned', 'started', 'writing', 'done', 'abandoned'];
        const chosen = await this.suggester(items, display, 'Выберите статус');
        if (!chosen) return;
        const content = await this.app.vault.read(editorFile);
        // Заменяем/добавляем status в frontmatter
        let newContent = content;
        const fmRegex = /^---[\s\S]*?---/;
        const hasFm = fmRegex.test(content);
        if (hasFm) {
            newContent = content.replace(/^(---[\s\S]*?\n)(status:\s*.*\n)?/m, `$1status: ${chosen}\n`);
        } else {
            newContent = `---\nstatus: ${chosen}\n---\n\n` + content;
        }
        await this.app.vault.modify(editorFile, newContent);
        new Notice(`Статус: ${chosen}`);
    }

    registerCommands() {
        this.addCommand({
            id: 'literary-switch-project',
            name: 'Литературные шаблоны: Сменить проект',
            callback: () => this.chooseProjectRoot(),
            hotkeys: []
        });
        // console.log('Команды зарегистрированы');
    }

    addContextMenu(menu, target) {
        // Литературные шаблоны - главное меню
        menu.addItem((item) => {
            item.setTitle('Литературные шаблоны').setIcon('book-open');
            const subMenu = item.setSubmenu();
            
            // 1. Сюжет и главы
            subMenu.addItem((subItem) => {
                subItem.setTitle('📚 Сюжет и главы').setIcon('book');
                const storySubMenu = subItem.setSubmenu();
                storySubMenu.addItem((storyItem) => {
                    storyItem.setTitle('Создать главу').setIcon('book').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createChapter(this, startPath);
                    });
                });
                storySubMenu.addItem((storyItem) => {
                    storyItem.setTitle('Создать сцену').setIcon('film').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createScene(this, startPath);
                    });
                });
                storySubMenu.addItem((storyItem) => {
                    storyItem.setTitle('Создать конфликт').setIcon('flame').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createConflictWizard(this, startPath);
                    });
                });
            });
            
            // Разделитель
            subMenu.addSeparator();
            
            // 2. Локации
            subMenu.addItem((subItem) => {
                subItem.setTitle('🗺️ Локации').setIcon('map-pin');
                const locationSubMenu = subItem.setSubmenu();
                
                // Жильё
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏠 Жильё').setIcon('home');
                    const housingSubMenu = locItem.setSubmenu();
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать государство').setIcon('crown').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            window.createState(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать провинцию').setIcon('map').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createProvince(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать город').setIcon('building').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCity(this, startPath);
                        });
                    });
                    
                    housingSubMenu.addItem((hItem) => {
                        hItem.setTitle('Создать деревню').setIcon('home').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createVillage(this, startPath);
                        });
                    });
                });
                
                // Фортификация
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏰 Фортификация').setIcon('fortress');
                    const fortsSubMenu = locItem.setSubmenu();
                    
                    fortsSubMenu.addItem((fItem) => {
                        fItem.setTitle('Создать крепость').setIcon('shield').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCastle(this, startPath, 'Крепость');
                        });
                    });
                    
                    fortsSubMenu.addItem((fItem) => {
                        fItem.setTitle('Создать замок').setIcon('castle').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCastle(this, startPath, 'Замок');
                        });
                    });
                    
                    fortsSubMenu.addItem((fItem) => {
                        fItem.setTitle('Создать форт').setIcon('shield-half').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCastle(this, startPath, 'Форт');
                        });
                    });
                    
                    fortsSubMenu.addSeparator();
                    
                    fortsSubMenu.addItem((fItem) => {
                        fItem.setTitle('Мастер создания').setIcon('fortress').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCastle(this, startPath);
                        });
                    });
                });
                
                // Производство было перенесено в раздел «Экономика»
                
                // Прочее
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('📍 Прочее').setIcon('map-pin');
                    const otherSubMenu = locItem.setSubmenu();
                    
                    // Порт перенесён в раздел «Экономика → Логистика»
                    
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать мертвую зону').setIcon('skull').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createDeadZone(this, startPath);
                        });
                    });
                    
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать общую локацию').setIcon('map-pin').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createLocation(this, startPath);
                        });
                    });
                    otherSubMenu.addItem((oItem) => {
                        oItem.setTitle('Создать монстра').setIcon('skull').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createMonster(this, startPath);
                        });
                    });
                });
                // Народы
                subMenu.addItem((subItem) => {
                    subItem.setTitle('👥 Народы').setIcon('users');
                    const peopleSubMenu = subItem.setSubmenu();
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать народ').setIcon('users').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createPeople(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать организацию').setIcon('users').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createOrganizationWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать религию').setIcon('book').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createReligionWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать культ (религ.)').setIcon('flame').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createCultWizard(this, startPath);
                        });
                    });
                    peopleSubMenu.addItem((pItem) => {
                        pItem.setTitle('Создать фракцию').setIcon('flag').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFactionWizard(this, startPath);
                        });
                    });
                });
            });
            
            // 3. Экономика
            subMenu.addItem((subItem) => {
                subItem.setTitle('💰 Экономика').setIcon('factory');
                const ecoSubMenu = subItem.setSubmenu();
                // Производство
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🏭 Производство').setIcon('factory');
                    const prod = ecoItem.setSubmenu();
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать шахту').setIcon('pickaxe').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createMine(this, startPath);
                        });
                    });
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать ферму').setIcon('wheat').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFarm(this, startPath);
                        });
                    });
                    prod.addItem((pItem) => {
                        pItem.setTitle('Создать завод').setIcon('factory').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createFactory(this, startPath);
                        });
                    });
                });
                // Торговля
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🧾 Торговля').setIcon('map');
                    const trade = ecoItem.setSubmenu();
                    trade.addItem((tItem) => {
                        tItem.setTitle('Создать торговый путь').setIcon('map').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createTradeRouteWizard(this, startPath);
                        });
                    });
                });
                // Логистика
                ecoSubMenu.addItem((ecoItem) => {
                    ecoItem.setTitle('🚚 Логистика').setIcon('map-pin');
                    const logi = ecoItem.setSubmenu();
                    logi.addItem((lItem) => {
                        lItem.setTitle('Создать порт').setIcon('anchor').onClick(() => {
                            let startPath = '';
                            if (target instanceof TFile) startPath = target.parent.path;
                            else if (target instanceof TFolder) startPath = target.path;
                            else if (target && target.path) startPath = target.path;
                            createPort(this, startPath);
                        });
                    });
                });
            });

            // 4. Магия
            subMenu.addItem((subItem) => {
                subItem.setTitle('✨ Магия').setIcon('sparkles');
                const magicSubMenu = subItem.setSubmenu();
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать зелье').setIcon('potion').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createPotion(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать заклинание').setIcon('sparkles').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createSpell(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать алхимический рецепт').setIcon('flask').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createAlchemyRecipe(this, startPath);
                    });
                });
                
                magicSubMenu.addItem((magicItem) => {
                    magicItem.setTitle('Создать артефакт').setIcon('sword').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createArtifact(this, startPath);
                    });
                });
            });
            
            // 5. Персонажи
            subMenu.addItem((subItem) => {
                subItem.setTitle('👤 Персонажи').setIcon('user');
                const characterSubMenu = subItem.setSubmenu();
                characterSubMenu.addItem((charItem) => {
                    charItem.setTitle('Создать персонажа').setIcon('user').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        window.createCharacter(this, startPath);
                    });
                });
            });
            
            // 6. События
            subMenu.addItem((subItem) => {
                subItem.setTitle('📅 События').setIcon('calendar');
                const eventSubMenu = subItem.setSubmenu();
                eventSubMenu.addItem((eventItem) => {
                    eventItem.setTitle('Создать квест').setIcon('target').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createQuestWizard(this, startPath);
                    });
                });
                eventSubMenu.addItem((eventItem) => {
                    eventItem.setTitle('Создать событие').setIcon('calendar').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createEventWizard(this, startPath);
                    });
                });
            });
            
            // Разделитель
            subMenu.addSeparator();
            
            // 6. Мир и проекты (в конце как служебные функции)
            subMenu.addItem((subItem) => {
                subItem.setTitle('🌍 Мир и проекты').setIcon('globe');
                const worldSubMenu = subItem.setSubmenu();
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Создать новый мир/проект').setIcon('globe').onClick(async () => {
                        try {
                            // Выбираем родительскую папку для проекта
                            const parentFolder = await this._selectProjectParentFolder();
                            if (!parentFolder) {
                                await this.logDebug('Создание мира отменено: не выбрана родительская папка');
                                return;
                            }
                            await this.logDebug(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                            await window.createWorld(this, parentFolder);
                        } catch (error) {
                            await this.logDebug(`Ошибка при выборе папки для создания мира: ${error.message}`);
                            new Notice('Ошибка при создании мира: ' + error.message);
                        }
                    });
                });
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Настройки мира').setIcon('settings').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        this.editWorldSettings(startPath);
                    });
                });
            });
        });
    }


    // --- Вспомогательные методы для модальных окон ---


    onunload() {
        // console.log('Literary Templates plugin unloaded');
    }




    async _selectProjectParentFolder() {
        try {
            await this.logDebug('=== _selectProjectParentFolder вызвана ===');
            
            // 1. Сначала ищем существующие папки проектов
            const existingProjectFolders = await getAllProjectFolders(this.app);
            await this.logDebug(`Найдено существующих папок проектов: ${existingProjectFolders.length}: ${existingProjectFolders.join(', ')}`);
            
            // 2. Получаем все папки первого уровня (корня)
            const allFiles = this.app.vault.getAllLoadedFiles();
            const allFolders = allFiles.filter(f => f instanceof TFolder);
            const vaultRoot = this.app.vault.getRoot();
            let rootFolders = allFolders.filter(f => f.parent === vaultRoot);
            await this.logDebug(`Найдено папок первого уровня: ${rootFolders.length}: ${rootFolders.map(f => f.name).join(', ')}`);
            await this.logDebug(`Из них папки проектов: ${existingProjectFolders.length}: ${existingProjectFolders.join(', ')}`);
            
            // 3. Ищем "Мои Проекты" среди папок первого уровня
            let myProjects = rootFolders.find(f => f.name === 'Мои Проекты');
            
            // 4. Если "Мои Проекты" не найдена, создаем её
            if (!myProjects) {
                await this.logDebug('Папка "Мои Проекты" не найдена, создаем...');
                try {
                    myProjects = await this.app.vault.createFolder('Мои Проекты');
                    await this.logDebug('Создана папка "Мои Проекты"');
                    
                    // Создаем файл-маркер в папке проектов
                    try {
                        const projectMarkerContent = await this.readTemplateFile('Проекты');
                        if (projectMarkerContent) {
                            const filledContent = this.applyTemplate(projectMarkerContent, {
                                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)
                            });
                            await safeCreateFile('Мои Проекты/Проекты.md', filledContent, this.app);
                            await this.logDebug('Создан файл-маркер Проекты.md в папке "Мои Проекты"');
                        } else {
                            // Fallback если шаблон не найден
                            const fallbackContent = `# Папка проектов

Эта папка предназначена для хранения всех ваших литературных проектов и миров.

---
*Создано автоматически плагином Literary Templates*`;
                            await safeCreateFile('Мои Проекты/Проекты.md', fallbackContent, this.app);
                            await this.logDebug('Создан файл-маркер Проекты.md (fallback) в папке "Мои Проекты"');
                        }
                    } catch (e) {
                        await this.logDebug(`Ошибка создания файла-маркера: ${e.message}`);
                        // Продолжаем без файла-маркера
                    }
                    await this.logDebug('Создан файл-маркер Проекты.md в папке "Мои Проекты"');
                    
                    new Notice('Создана папка "Мои Проекты" для хранения проектов.');
                } catch (e) {
                    await this.logDebug(`Ошибка создания папки "Мои Проекты": ${e.message}`);
                    new Notice('Ошибка создания папки проектов: ' + e.message);
                    return null;
                }
            }
            
            // 5. Формируем список папок для выбора
            let folderList = [];
            
            // Сначала добавляем существующие папки проектов
            for (const projectFolderPath of existingProjectFolders) {
                const projectFolder = this.app.vault.getAbstractFileByPath(projectFolderPath);
                if (projectFolder && projectFolder instanceof TFolder) {
                    folderList.push(projectFolder);
                }
            }
            
            // Затем добавляем "Мои Проекты" если её еще нет в списке
            if (!folderList.find(f => f.path === myProjects.path)) {
                folderList.unshift(myProjects); // Добавляем в начало
            }
            
            // НЕ добавляем остальные папки первого уровня - только папки проектов
            // folderList уже содержит только папки проектов и "Мои Проекты"
            
            const folderPaths = folderList.map(f => f.path);
            await this.logDebug(`Итоговый список папок для выбора (только папки проектов): ${folderPaths.length}: ${folderPaths.join(', ')}`);
            
            // 6. Показываем список пользователю
            let selectedPath = null;
            if (typeof window !== 'undefined' && window.app && window.app.plugins) {
                selectedPath = await this.suggester(
                    folderPaths,
                    folderPaths,
                    'Выберите папку для нового мира/проекта:'
                );
            } else if (typeof window !== 'undefined' && window.suggester) {
                selectedPath = await window.suggester(folderPaths, folderPaths, 'Выберите папку для нового мира/проекта:');
            } else {
                selectedPath = folderPaths[0]; // По умолчанию первая папка
            }
            
            // 7. Проверяем результат выбора
            if (selectedPath === undefined || selectedPath === null) {
                await this.logDebug('Выбор папки отменён пользователем');
                return null;
            }
            
            await this.logDebug(`Выбрана папка: ${selectedPath}`);
            return selectedPath;
            
        } catch (error) {
            await this.logDebug(`Ошибка в _selectProjectParentFolder: ${error.message}`);
            new Notice('Ошибка при выборе папки проектов: ' + error.message);
            return null;
        }
    }
}

// Функции-обёртки для новых визардов
async function createConflictWizard(plugin, projectPath, options = {}) {
    const { ConflictWizardModal } = require('./creators/ConflictWizardModal.js');
    const modal = new ConflictWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createOrganizationWizard(plugin, projectPath, options = {}) {
    const { OrganizationWizardModal } = require('./creators/OrganizationWizardModal.js');
    const modal = new OrganizationWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createReligionWizard(plugin, projectPath, options = {}) {
    const { ReligionWizardModal } = require('./creators/ReligionWizardModal.js');
    const modal = new ReligionWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createCultWizard(plugin, projectPath, options = {}) {
    const { CultWizardModal } = require('./creators/CultWizardModal.js');
    const modal = new CultWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createTradeRouteWizard(plugin, projectPath, options = {}) {
    const { TradeRouteWizardModal } = require('./creators/TradeRouteWizardModal.js');
    const modal = new TradeRouteWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createFactionWizard(plugin, projectPath, options = {}) {
    const { FactionWizardModal } = require('./creators/FactionWizardModal.js');
    const modal = new FactionWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createQuestWizard(plugin, projectPath, options = {}) {
    const { QuestWizardModal } = require('./creators/QuestWizardModal.js');
    const modal = new QuestWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

async function createEventWizard(plugin, projectPath, options = {}) {
    const { EventWizardModal } = require('./creators/EventWizardModal.js');
    const modal = new EventWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, () => {}, options);
    modal.open();
}

module.exports = LiteraryTemplatesPlugin; 


