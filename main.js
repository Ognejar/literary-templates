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
/* global createWorld, createChapter, createScene, createVillage, createMine, createFactory, createFarm, createPeople, createTask, createSpell, createArtifact, createCity, createLocation, createPort, createCastle, createDeadZone, createProvince, createState, createAlchemyRecipe, createCharacter, createMonster, AISettingsModal, ArtifactWizardModal, LoreAnalysisModal, PeopleWizardModal, DeadZoneWizardModal, CastleWizardModal, CityWizardModal, PortWizardModal, FarmWizardModal, MineWizardModal, FactoryWizardModal, ProvinceWizardModal, TaskWizardModal, CharacterWizardModal, ConflictWizardModal, SpellWizardModal, AlchemyRecipeWizardModal, FactionWizardModal, TradeRouteWizardModal, CultWizardModal, ReligionWizardModal, OrganizationWizardModal, QuestWizardModal, EventWizardModal, HtmlWizardModal, PotionWizardModal, VillageWizardModal, StateWizardModal, LocationWizardModal, BaseWizardModal, SceneWizardModal, WorldSettingsModal, ProjectSelectorModal, ChapterSelectorModal, createPotion, createSpell, AIAnalysisResultModal, navigator, document */
// const { writeFileSync } = require('fs'); // Неиспользуется
// const { join } = require('path'); // Неиспользуется
const { Plugin, Notice, TFile, TFolder, Modal, Setting, MarkdownView } = require('obsidian');
// PromptSelectorModal и parsePromptYaml теперь определены в main.js

// Импорт функций создания сущностей
// const { createWorld } = require('./creators/createWorld.js');
// const { createChapter } = require('./creators/createChapter.js');
// const { createCity } = require('./creators/createCity.js');
// const { createLocation } = require('./creators/createLocation.js');
// const { createScene } = require('./creators/createScene.js');
// const { createVillage } = require('./creators/createVillage.js');
// const { createDeadZone } = require('./creators/createDeadZone.js');
// const { createPort } = require('./creators/createPort.js');
// const { createCastle } = require('./creators/createCastle.js');
// const { createMine } = require('./creators/createMine.js');
// const { createFactory } = require('./creators/createFactory.js');
// const { createFarm } = require('./creators/createFarm.js');
// const { createPotion } = require('./creators/createPotion.js');
// const { createSpell } = require('./creators/createSpell.js');
// const { createPeople } = require('./creators/createPeople.js');
// const { createMonster } = require('./creators/createMonster.js');
// const { createTask } = require('./creators/createTask.js');
// const { createArtifact } = require('./creators/createArtifact.js');
// const { createAlchemyRecipe } = require('./creators/createAlchemyRecipe.js');
// const { createState } = require('./creators/createState.js');
// const { createProvince } = require('./creators/createProvince.js');
// const { createCharacter } = require('./creators/createCharacter.js');

// Импорт сервисов для работы с временными слоями
const { TimelineService } = require('./src/TimelineService.js');
const { TemporalEntityService } = require('./src/TemporalEntityService.js');
const { TemporalContextService } = require('./src/TemporalContextService.js');
const { MigrationService } = require('./src/MigrationService.js');
const { TemporalAPI } = require('./src/TemporalAPI.js');

// Импорт сервисов
// const { KeyRotationService } = require('./src/KeyRotationService.js');
// const { AIProviderService } = require('./src/AIProviderService.js');
// const { LoreAnalyzerService } = require('./src/LoreAnalyzerService.js');

// Функции для создания сущностей будут зарегистрированы в onload()
// Функции-обертки для создания сущностей (вызывают функции из creators/*.js)
// Эти функции будут заменены на реальные функции из creators/*.js при сборке

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
    let result = template;
    
    // Обработка циклов {{#each arrayName}}...{{/each}}
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
        const array = data[arrayName];
        if (!Array.isArray(array) || array.length === 0) {
            return ''; // Если массив пустой или не существует, возвращаем пустую строку
        }
        
        return array.map(item => {
            let itemContent = content;
            // Заменяем плейсхолдеры внутри цикла
            itemContent = itemContent.replace(/{{(\w+)}}/g, (_, key) => item[key] ?? '');
            return itemContent;
        }).join('');
    });
    
    // Обработка простых плейсхолдеров {{key}}
    result = result.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? '');
    
    return result;
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
    
    // 2. Обработка циклов {{#each arrayName}}...{{/each}}
    await plugin.logDebug('Processing each loops...');
    await plugin.logDebug('Available data keys: ' + Object.keys(data).join(', '));
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
        const array = data[arrayName];
        plugin.logDebug(`Processing each loop for array: ${arrayName}, array:`, array);
        if (!Array.isArray(array) || array.length === 0) {
            plugin.logDebug(`Array ${arrayName} is empty or not an array`);
            return ''; // Если массив пустой или не существует, возвращаем пустую строку
        }
        
        return array.map(item => {
            let itemContent = content;
            plugin.logDebug(`Processing item in ${arrayName}:`, item);
            // Заменяем плейсхолдеры внутри цикла
            itemContent = itemContent.replace(/{{(\w+)}}/g, (_, key) => {
                const value = item[key] ?? '';
                plugin.logDebug(`Replacing {{${key}}} with: "${value}" in ${arrayName}`);
                return value;
            });
            return itemContent;
        }).join('');
    });
    
    // 3. Подстановка всех известных плейсхолдеров вида {{key}}
    await plugin.logDebug('Replacing placeholders with data: ' + JSON.stringify(data));
    for (const key of Object.keys(data)) {
        const re = new RegExp(`{{${key}}}`, 'g');
        const replacement = data[key] ?? '';
        await plugin.logDebug(`Replacing {{${key}}} with: "${replacement}"`);
        result = result.replace(re, replacement);
    }
    
    // 4. Обработка условных блоков {{#if condition}}...{{/if}}
    await plugin.logDebug('Processing conditional blocks...');
    result = plugin.processConditionalBlocks(result, data);
    await plugin.logDebug('Conditional blocks processed');
    
    // 5. Финальная очистка: удаляем любые оставшиеся {{...}}
    // Это поведение как у fillTemplate: неизвестные ключи заменяются на пустую строку
    const cleanupRegex = /{{\s*([\w.]+)\s*}}/g;
    result = result.replace(cleanupRegex, '');
    await plugin.logDebug('Final result length: ' + result.length);
    return result;
}

/**
 * Проверяет и создаёт инфраструктуру для сущности: папку, индексный файл, ссылку в индексе
 * @param {string} folderPath - путь к папке (например, 'Провинции')
 * @param {string} _entityName - имя новой сущности
 * @param {App} app - экземпляр Obsidian App
 */
async function ensureEntityInfrastructure(folderPath, _entityName, app) {
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
            console.error(`[DEBUG] Ошибка создания папки ${folderPath}:`, error);
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
        // Если файл существует — автонумерация: Имя -> Имя_2, Имя_3, ...
        let finalPath = filePath;
        let existingFile = app.vault.getAbstractFileByPath(finalPath);
        if (existingFile) {
            // Разбираем путь
            const parts = String(filePath).split('/');
            const fileWithExt = parts.pop();
            const folderPath = parts.join('/');
            const dotIdx = fileWithExt.lastIndexOf('.');
            const base = dotIdx !== -1 ? fileWithExt.slice(0, dotIdx) : fileWithExt;
            const ext = dotIdx !== -1 ? fileWithExt.slice(dotIdx) : '';
            let attempt = 1;
            let candidate;
            do {
                attempt += 1;
                candidate = `${folderPath}/${base}_${attempt}${ext}`;
                existingFile = app.vault.getAbstractFileByPath(candidate);
            } while (existingFile);
            finalPath = candidate;
            console.warn(`[DEBUG] Файл уже существовал, используем имя: ${finalPath}`);
        }
        // Создаем файл с уникальным именем
        const newFile = await app.vault.create(finalPath, content);
        console.log(`[DEBUG] Файл успешно создан: ${finalPath}`);
        return newFile;
    } catch (error) {
        console.error(`[DEBUG] Ошибка создания файла ${filePath}: ${error.message}`);
        throw error;
    }
}

// === ФАКТЫ: утилиты работы с базой фактов (русская схема ключей) ===
async function loadFacts(app, projectRoot) {
    try {
        const dir = `${projectRoot}/Лор-контекст`;
        const path = `${dir}/Факты.json`;
        const f = app.vault.getAbstractFileByPath(path);
        if (!(f instanceof TFile)) return [];
        const raw = await app.vault.read(f);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function saveFacts(app, projectRoot, facts) {
    const dir = `${projectRoot}/Лор-контекст`;
    const path = `${dir}/Факты.json`;
    try { if (!app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir); } catch {}
    const data = JSON.stringify(facts || [], null, 2);
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) await app.vault.modify(existing, data); else await app.vault.create(path, data);
}

function computeFactsDiagnostics(app, projectRoot) {
    // Эта функция синхронно формирует предикаты; загрузка/сохранение делается отдельно
    return {
        async run() {
            const facts = await loadFacts(app, projectRoot);
            const defined = new Set();
            const referenced = new Set();
            for (const raw of facts) {
                const f = normalizeRussianFactKeys(raw);
                if (f && f.id) defined.add(String(f.id));
                for (const r of collectReferencedIds(f)) referenced.add(r);
            }
            const missing = Array.from(referenced).filter(id => !defined.has(id));
            return { facts, definedIds: defined, referencedIds: referenced, missingIds: missing };
        }
    };
}

function normalizeRussianFactKeys(factAny) {
    const f = typeof factAny === 'object' && factAny !== null ? { ...factAny } : {};
    // Ключи верхнего уровня
    if (f.type && !f['тип']) { f['тип'] = String(f.type); delete f.type; }
    if (f.name && !f['имя']) { f['имя'] = String(f.name); delete f.name; }
    if (f.attrs && !f['атрибуты']) { f['атрибуты'] = f.attrs; delete f.attrs; }
    if (typeof f.confidence === 'number' && f['достоверность'] == null) { f['достоверность'] = f.confidence; delete f.confidence; }
    if (f.source && !f['источник']) {
        const s = { ...f.source };
        if (s.path && !s['путь']) { s['путь'] = s.path; delete s.path; }
        f['источник'] = s; delete f.source;
    }
    // Отношения
    if (Array.isArray(f.relations) && !Array.isArray(f['отношения'])) {
        f['отношения'] = f.relations.map(r => {
            const rr = { ...r };
            if (rr.predicate && !rr['связь']) { rr['связь'] = String(rr.predicate); delete rr.predicate; }
            if (rr.object && !rr['объект']) { rr['объект'] = String(rr.object); delete rr.object; }
            if (rr.attrs && !rr['атрибуты']) { rr['атрибуты'] = rr.attrs; delete rr.attrs; }
            return rr;
        });
        delete f.relations;
    }
    return f;
}

function collectReferencedIds(fact) {
    const refs = new Set();
    const rels = Array.isArray(fact['отношения']) ? fact['отношения'] : [];
    for (const r of rels) {
        if (r && typeof r === 'object' && r['объект']) refs.add(String(r['объект']));
    }
    return refs;
}

function parseTypeAndNameFromId(id) {
    const s = String(id || '');
    const idx = s.indexOf(':');
    if (idx === -1) return { тип: '', имя: s.replace(/_/g, ' ') };
    const typePart = s.slice(0, idx);
    const namePart = s.slice(idx + 1);
    return { тип: typePart, имя: namePart.replace(/_/g, ' ') };
}

function addMissingEntityStubs(facts) {
    const out = [];
    const byId = new Map();
    for (const raw of facts) {
        const f = normalizeRussianFactKeys(raw);
        if (f && f.id) byId.set(String(f.id), f);
        out.push(f);
    }
    const referenced = new Set();
    for (const f of out) {
        for (const ref of collectReferencedIds(f)) referenced.add(ref);
    }
    const added = [];
    for (const refId of referenced) {
        if (!byId.has(refId)) {
            const base = parseTypeAndNameFromId(refId);
            const stub = {
                id: refId,
                'тип': base.тип || 'сущность',
                'имя': base.имя || '',
                'атрибуты': {},
                'отношения': [],
                'достоверность': 0.2
            };
            out.push(stub);
            byId.set(refId, stub);
            added.push(refId);
        }
    }
    return { facts: out, addedIds: added };
}

function computeFactSignature(fact) {
    try {
        const id = String(fact.id || '');
        const type = String(fact['тип'] || '');
        const name = String(fact['имя'] || '');
        const attrs = fact['атрибуты'] ? JSON.stringify(fact['атрибуты'], Object.keys(fact['атрибуты']).sort()) : '';
        const rels = Array.isArray(fact['отношения'])
            ? JSON.stringify(
                fact['отношения']
                    .map(r => ({ связь: r['связь'], объект: r['объект'] }))
                    .sort((a, b) => (a.связь + a.объект).localeCompare(b.связь + b.объект))
              )
            : '';
        return `${type}|${id}|${name}|${attrs}|${rels}`;
    } catch { return Math.random().toString(36).slice(2); }
}

async function mergeFactsIntoProject(app, projectRoot, incomingFacts) {
    const existing = await loadFacts(app, projectRoot);
    const normalizedExisting = existing.map(normalizeRussianFactKeys);
    const map = new Map();
    for (const f of normalizedExisting) { map.set(computeFactSignature(f), f); }
    let mergedCount = 0, addedCount = 0, updatedCount = 0;
    for (const raw of incomingFacts) {
        mergedCount++;
        const f = normalizeRussianFactKeys(raw);
        const sig = computeFactSignature(f);
        if (!map.has(sig)) { map.set(sig, f); addedCount++; }
        else {
            const prev = map.get(sig);
            try {
                const nf = { ...prev };
                if (typeof f['достоверность'] === 'number') nf['достоверность'] = Math.max(prev['достоверность'] || 0, f['достоверность']);
                if (f['источник']) nf['источник'] = f['источник'];
                map.set(sig, nf);
                updatedCount++;
            } catch {}
        }
    }
    // Добавляем болванки по ссылкам
    const afterMerge = Array.from(map.values());
    const withStubs = addMissingEntityStubs(afterMerge).facts;
    await saveFacts(app, projectRoot, withStubs);
    return { mergedCount, addedCount, updatedCount };
}

function cleanJsonInput(text) {
    let s = String(text || '');
    // Удаляем BOM и невидимые пробелы
    s = s.replace(/^\uFEFF/, '');
    s = s.replace(/[\u00A0\u200B\u200C\u200D]/g, ' ');

    // Построчная очистка: игнорируем комментарии и ограждения
    const lines = s.split(/\r?\n/).filter(line => {
        const trimmed = String(line).trim();
        // Комментарии вида -- ... игнорируем
        if (/^--\s?/.test(trimmed)) return false;
        // Игнорируем строки, состоящие из одних бэктиков (``` или ``) или начинающиеся с них
        if (/^```/.test(trimmed)) return false;
        if (/^``\s*$/.test(trimmed)) return false;
        if (/^```json\b/i.test(trimmed)) return false;
        return true;
    });
    s = lines.join('\n');

    // Если остались ограждения в одном блоке
    if (/^```/.test(s.trim())) {
        s = s.trim().replace(/^```(?:json)?\s*[\r\n]/, '').replace(/```\s*$/, '');
    }

    return s.trim();
}

// --- Modal классы определяются в других файлах при сборке ---
// PromptModal, SuggesterModal - в modals.js
// ProjectSelectorModal, ChapterSelectorModal - в отдельных файлах
// *WizardModal классы - в соответствующих файлах

class LiteraryTemplatesPlugin extends Plugin {
    constructor() {
        super();
        // console.log('LiteraryTemplatesPlugin constructor called');
        
        // Настройки плагина
        this.settings = {
            aiKeys: [],
            currentKeyIndex: 0,
            keyUsage: {},
            aiEnabled: true,
            aiProvider: 'openrouter', // openrouter, anthropic, openai
            defaultModel: 'openrouter/mistralai/mistral-7b-instruct', // Бесплатная модель
            maxTokens: 2000,
            temperature: 0.7
        };
        
        // Инициализируем сервисы для работы с временными слоями
        try {
            this.timelineService = new TimelineService(this);
            this.temporalEntityService = new TemporalEntityService(this);
            this.temporalContextService = new TemporalContextService(this);
            this.migrationService = new MigrationService(this);
            this.temporalAPI = new TemporalAPI(this);
        } catch (e) {
            console.warn('Ошибка инициализации сервисов временных слоев:', e);
        }
        
        // console.log('LiteraryTemplatesPlugin constructor completed');
    }

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
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const title = await this.prompt('Текст задачи:');
        if (!title || !title.trim()) {
            this.logDebug(`[ERROR] Текст задачи не указан`);
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
        this.logDebug('Задача вставлена');
    }

    async insertPlotlineIntoScene() {
        const editor = this.getActiveEditor();
        if (!editor) {
            this.logDebug(`[ERROR] Нет активного редактора Markdown`);
            return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!(activeFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
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
                this.logDebug(`[ERROR] Проект не найден: отсутствует файл "Настройки_мира.md"`);
                return;
            }
            projectRoot = roots[0];
        }

        const plotLinesPath = `${projectRoot}/Сюжетные_линии.md`;
        const plotFile = this.app.vault.getAbstractFileByPath(plotLinesPath);
        if (!(plotFile instanceof TFile)) {
            this.logDebug(`[ERROR] Файл сюжетных линий не найден: ${plotLinesPath}`);
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
            this.logDebug(`[ERROR] Темы не найдены в Сюжетные_линии.md`);
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
        this.logDebug(`Сюжетная линия добавлена: ${chosen.title}`);
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
            console.error('[DEBUG] Ошибка в prompt:', error);
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
            console.error('[DEBUG] Ошибка в suggester:', error);
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
        
        return content.replace(conditionalRegex, (_match, condition, blockContent) => {
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

    // Переопределяем loadCSS чтобы избежать ошибок при инициализации
    loadCSS() {
        // Не загружаем CSS до полной инициализации плагина
        return Promise.resolve();
    }

    async onload() {
        // console.log('Literary Templates plugin onload started');
        // console.log('Текущее время:', new Date().toISOString());
        // console.log('this:', this);
        // console.log('this.app:', this.app);
        // console.log('this.manifest:', this.manifest);
        
        // Пробуем разные способы получения app
        let app = null;
        let appTries = 0;
        
        while (!app && appTries < 50) {
            // console.log(`Попытка ${appTries + 1}/50: поиск app...`);
            
            // Способ 1: this.app
            if (this.app) {
                app = this.app;
                // console.log('Найден this.app');
                break;
            }
            
            // Способ 2: window.app
            if (window.app) {
                app = window.app;
                // console.log('Найден window.app');
                break;
            }
            
            // Способ 3: ждем и пробуем снова
            await new Promise(res => window.setTimeout(res, 300));
            appTries++;
        }
        
        if (!app) {
            console.error('Ошибка: app не найден ни через this.app, ни через window.app');
            this.logDebug(`[ERROR] Ошибка: app не найден`);
            return;
        }
        
        // Присваиваем app к this.app для совместимости
        this.app = app;
        // console.log('App найден и присвоен к this.app');
        // console.log('App доступен:', !!this.app);
        
        // Теперь ждём, пока app.vault будет готов
        let vaultTries = 0;
        while ((!this.app.vault || !this.app.vault.adapter) && vaultTries < 50) {
            // console.log(`Попытка ${vaultTries + 1}/50: ожидание инициализации app.vault...`);
            await new Promise(res => window.setTimeout(res, 300));
            vaultTries++;
        }
        
        if (!this.app.vault || !this.app.vault.adapter) {
            console.error('Ошибка: app.vault не инициализирован после 50 попыток');
            this.logDebug(`[ERROR] Ошибка: app.vault не инициализирован`);
            return;
        }
        
        // console.log('App.vault доступен:', !!(this.app && this.app.vault));
        // console.log('App.vault.adapter доступен:', !!(this.app && this.app.vault && this.app.vault.adapter));
        // console.log('Vault инициализирован успешно');
        // console.log('Vault путь:', this.app.vault.adapter.basePath);
        
        // Инициализируем базовые настройки
        this.settings = {
            aiKeys: [],
            currentKeyIndex: 0,
            keyUsage: {},
            aiEnabled: true,
            defaultModel: 'openrouter/mistralai/mistral-7b-instruct',
            maxTokens: 2000,
            temperature: 0.7
        };
        
        // Теперь можно безопасно работать с vault - загружаем настройки
        try {
        this.settings = await loadSettingsFromFile(this.app);
        } catch (e) {
            console.warn('Ошибка загрузки настроек плагина:', e);
            // Используем дефолтные настройки, которые уже установлены выше
        }
        
        // Принудительно создаем папку для логов
        try {
            const pluginDir = '.obsidian/plugins/literary-templates';
            await this.app.vault.adapter.mkdir(pluginDir);
            // console.log('Папка плагина создана/проверена:', pluginDir);
        } catch (e) {
            console.warn('Ошибка создания папки плагина:', e);
        }
        
        // Пытаемся получить manifest, если его нет
        if (!this.manifest) {
            // console.log('this.manifest недоступен, пытаемся найти альтернативно...');
            
            // Способ 1: через window.app.plugins
            if (window.app && window.app.plugins) {
                const plugin = window.app.plugins.plugins['literary-templates'];
                if (plugin && plugin.manifest) {
                    this.manifest = plugin.manifest;
                    // console.log('Manifest найден через window.app.plugins');
                }
            }
            
            // Способ 2: через this.app.plugins
            if (!this.manifest && this.app && this.app.plugins) {
                const plugin = this.app.plugins.plugins['literary-templates'];
                if (plugin && plugin.manifest) {
                    this.manifest = plugin.manifest;
                    // console.log('Manifest найден через this.app.plugins');
                }
            }
            
            // Способ 3: создаем базовый manifest вручную
            if (!this.manifest) {
                // console.log('Создаем базовый manifest вручную');
                this.manifest = {
                    id: 'literary-templates',
                    name: 'Literary Templates',
                    version: '1.0.0',
                    dir: '.obsidian/plugins/literary-templates'
                };
                // console.log('Базовый manifest создан:', this.manifest);
            }
        }
        // ... остальная инициализация ...
        // console.log('Literary Templates plugin loading...');
        this.activeProjectRoot = null;
        this.debugEnabled = false;
        // console.log('Базовые переменные инициализированы');

        // 1. Ждем загрузки данных (ВАЖНО: this.app гарантированно инициализирован только после этого)
        let data = null;
        try {
            // Проверяем, что manifest доступен перед вызовом loadData
            if (!this.manifest) {
                console.warn('Manifest недоступен, пропускаем loadData');
                data = {};
            } else {
            data = await this.loadData();
            }
        } catch (e) {
            console.warn('Ошибка загрузки данных плагина:', e);
            data = {};
        }

        // ВАЖНО: все действия только после loadData!
        if (data && data.activeProjectRoot) {
            this.activeProjectRoot = data.activeProjectRoot;
        }
        if (data && typeof data.debugEnabled === 'boolean') {
            this.debugEnabled = data.debugEnabled;
        }
        // Загружаем настройки AI
        if (data && data.aiKeys) {
            this.settings.aiKeys = data.aiKeys;
        }
        if (data && typeof data.currentKeyIndex === 'number') {
            this.settings.currentKeyIndex = data.currentKeyIndex;
        }
        if (data && data.keyUsage) {
            this.settings.keyUsage = data.keyUsage;
        }
        if (data && typeof data.aiEnabled === 'boolean') {
            this.settings.aiEnabled = data.aiEnabled;
        }
        if (data && data.aiProvider) {
            this.settings.aiProvider = data.aiProvider;
        }
        if (data && data.defaultModel) {
            this.settings.defaultModel = data.defaultModel;
        }
        if (data && typeof data.maxTokens === 'number') {
            this.settings.maxTokens = data.maxTokens;
        }
        if (data && typeof data.temperature === 'number') {
            this.settings.temperature = data.temperature;
        }

        this.registerCommands();

        // ... далее весь остальной код onload без циклов ожидания и window.setTimeout ...
        // (оставить только логику, которая была после loadData)
        
        // ТОЛЬКО ПОСЛЕ loadData регистрируем обработчики событий
        // console.log('Регистрация обработчиков событий');
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                // console.log('file-menu событие вызвано для:', file);
                this.addContextMenu(menu, file);
            })
        );
        this.registerEvent(
            this.app.workspace.on('folder-menu', (menu, folder) => {
                // console.log('folder-menu событие вызвано для:', folder);
                this.addContextMenu(menu, folder);
            })
        );
        // console.log('Обработчики событий зарегистрированы');
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
                    // Всегда передаем имя файла как предзаполнение, даже если это "Без названия"
                    const prefillName = baseName;
                    
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
                    const options = { targetFile: abstractFile, prefillName: prefillName };
                    // Запускаем соответствующий мастер с предзаполнением и записью в уже созданный файл
                    switch (found.type) {
                        case 'potion':
                            await window.createPotion(this, projectRoot, options);
                            break;
                        case 'spell':
                            await window.createSpell(this, projectRoot, options);
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
        // Автоматическое создание файлов управления при создании папок
        this.registerEvent(
            this.app.vault.on('create', async (abstractFile) => {
                try {
                    if (!(abstractFile instanceof TFolder)) return;
                    
                    const folderPath = abstractFile.path;
                    const folderName = abstractFile.name;
                    
                    // Проверяем, не является ли это корневой папкой проекта
                    if (folderPath.split('/').length === 1) {
                        return; // Пропускаем корневые папки
                    }
                    
                    // Пропускаем папки, которые создаются системно при создании сущностей
                    const systemFolders = [
                                // Рукопись и её подкатегории
        '1_Рукопись', 'Главы', 'Сцены', 'События', 'Конфликты', 'Квесты',
                        
                        // Локации и их подкатегории
                        'Локации', 'Государства', 'Провинции', 'Фракции', 'Торговые_пути',
                        'Города', 'Деревни', 'Замки', 'Порты', 'Шахты', 'Фермы', 'Заводы', 'Мёртвые_зоны',
                        
                        // Персонажи и социальные объекты
                        'Персонажи', 'Народы', 'Организации', 'Религии', 'Культы',
                        
                        // Магия и её подкатегории
                        'Магия', 'Зелья', 'Заклинания', 'Артефакты', 'Алхимия',
                        
                        // Справочники и задачи
                        'Справочник', 'Руководства', 'Задачи'
                    ];
                    if (systemFolders.includes(folderName)) {
                        return; // Пропускаем системные папки
                    }
                    
                    // Проверяем, есть ли уже файл управления
                    const managementFilePath = `${folderPath}/${folderName}.md`;
                    const existingFile = this.app.vault.getAbstractFileByPath(managementFilePath);
                    
                    if (!existingFile) {
                        try {
                            // Создаем файл управления с базовым содержимым
                            const content = [
                                `# ${folderName}`,
                                '',
                                '## Описание',
                                '',
                                '## Содержимое',
                                '',
                                '```folder-overview',
                                `folderPath: "${folderPath}"`,
                                `title: "${folderName}"`,
                                'showTitle: false',
                                'depth: 1',
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
                            
                            await this.app.vault.create(managementFilePath, content);
                            this.logDebug(`Создан файл управления для папки "${folderName}"`);
                        } catch (e) {
                            await this.logDebug('Ошибка создания файла управления: ' + (e && e.message ? e.message : String(e)));
                        }
                    } else {
                        await this.logDebug(`Файл управления уже существует: ${managementFilePath}`);
                    }
                } catch (e) {
                    await this.logDebug('folder create event handler error: ' + (e && e.message ? e.message : String(e)));
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
            callback: () => window.createPotion(this, ''),
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

        // Социальные учреждения (единый мастер)
        this.addCommand({
            id: 'create-social-institution',
            name: 'Создать социальный объект (мастер)',
            callback: () => (window.createSocialInstitution ? window.createSocialInstitution(this, '') : null),
        });
        
        // Команды для работы с эпохами и произведениями
        this.addCommand({
            id: 'select-epoch',
            name: 'Выбрать эпоху',
            callback: async () => {
                const { EpochSelectorModal } = require('./creators/EpochSelectorModal');
                const modal = new EpochSelectorModal(this.app, this);
                modal.open();
            },
        });
        
        this.addCommand({
            id: 'create-work',
            name: 'Создать произведение',
            callback: async () => {
                try {
                    if (typeof window.createWork === 'function') {
                        await window.createWork(this);
                    } else {
                        new Notice('Функция создания произведения недоступна. Перезагрузите плагин.');
                    }
                } catch (error) {
                    console.error('Ошибка создания произведения:', error);
                    new Notice('Ошибка создания произведения: ' + error.message);
                }
            },
        });
        
        this.addCommand({
            id: 'migrate-existing-content',
            name: 'Мигрировать существующий контент',
            callback: async () => {
                const { migrateExistingContent } = require('./creators/migrateExistingContent');
                await migrateExistingContent(this);
            },
        });
        
        // Команда 'Управление AI ключами' регистрируется ниже, удалён дубликат
        
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
                    this.logDebug('Ошибка открытия справочника: ' + e.message);
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
                    if (!projectRoot) { this.logDebug(`[ERROR] Проект не найден`); return; }
                    const mainPath = `${projectRoot}/${projectRoot.split('/').pop()}.md`;
                    const file = this.app.vault.getAbstractFileByPath(mainPath);
                    if (!(file instanceof TFile)) { this.logDebug(`[ERROR] Главный файл проекта не найден`); return; }
                    let content = await this.app.vault.read(file);
                    if (content.includes('## Задачи проекта')) { this.logDebug(`[ERROR] Виджет задач уже добавлен`); return; }
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
                    this.logDebug('Виджет задач добавлен');
                } catch (e) {
                    this.logDebug('Ошибка добавления виджета задач: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'add-project-overview-block',
            name: 'Проект: добавить список файлов (2 уровня)',
            callback: async () => {
                try {
                    const activeFile = this.app.workspace.getActiveFile();
                    const startPath = activeFile ? activeFile.parent.path : '';
                    const projectRoot = startPath ? findProjectRoot(this.app, startPath) : null;
                    if (!projectRoot) { this.logDebug(`[ERROR] Проект не найден`); return; }
                    const mainPath = `${projectRoot}/${projectRoot.split('/').pop()}.md`;
                    const file = this.app.vault.getAbstractFileByPath(mainPath);
                    if (!(file instanceof TFile)) { this.logDebug(`[ERROR] Главный файл проекта не найден`); return; }
                    let content = await this.app.vault.read(file);
                    if (content.includes('```folder-overview')) { this.logDebug(`[ERROR] Блок folder-overview уже есть`); return; }
                    const foBlock = [
                        '',
                        '## Обзор проекта',
                        '',
                        '```folder-overview',
                        `folderPath: "${projectRoot}"`,
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
                    await this.app.vault.modify(file, content + foBlock);
                    this.logDebug('Список файлов (2 уровня) добавлен');
                } catch (e) {
                    this.logDebug('Ошибка добавления списка файлов: ' + e.message);
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
                    this.logDebug('Ошибка смены статуса: ' + e.message);
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
                    this.logDebug('Ошибка открытия справочника: ' + e.message);
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
                    this.logDebug(`Отладка ${state}`);
                    let prev = {};
                    try {
                        prev = (await this.loadData()) || {};
                                    } catch (e) {
                    console.warn('Ошибка загрузки данных для отладки:', e);
                    }
                    try {
                    await this.saveData({
                        ...prev,
                        activeProjectRoot: this.activeProjectRoot || prev.activeProjectRoot || null,
                        debugEnabled: this.debugEnabled
                    });
                } catch (e) {
                        console.warn('Ошибка сохранения данных плагина:', e);
                    }
                } catch (e) {
                    this.logDebug('Не удалось переключить отладку: ' + e.message);
                }
            },
        });
        this.addCommand({
            id: 'create-log-file',
            name: 'Создать лог файл (принудительно)',
            callback: async () => {
                try {
                    console.log('Команда create-log-file вызвана');
                    
                    // Проверяем доступность vault
                    if (!this.app || !this.app.vault || !this.app.vault.adapter) {
                        this.logDebug(`[ERROR] Ошибка: app.vault недоступен`);
                        console.error('app.vault недоступен для создания лог-файла');
                        return;
                    }
                    
                    // Принудительно создаем папку плагина
                    const pluginDir = '.obsidian/plugins/literary-templates';
                    try {
                        await this.app.vault.adapter.mkdir(pluginDir);
                        console.log('Папка плагина создана:', pluginDir);
                    } catch (mkdirError) {
                        console.log('Папка плагина уже существует:', mkdirError.message);
                    }
                    
                    // Создаем тестовый лог-файл
                    const logPath = '.obsidian/plugins/literary-templates/log.md';
                    const testContent = `# Лог плагина Literary Templates

Создан: ${new Date().toISOString()}

## Тестовая запись
Лог-файл создан принудительно через команду.

---
`;
                    
                    try {
                        await this.app.vault.adapter.write(logPath, testContent);
                        console.log('Лог-файл создан успешно:', logPath);
                        this.logDebug('Лог файл создан успешно');
                    } catch (writeError) {
                        console.error('Ошибка записи лог-файла:', writeError);
                        this.logDebug('Ошибка записи лог-файла: ' + writeError.message);
                    }
                } catch (e) {
                    console.error('Общая ошибка в create-log-file:', e);
                    this.logDebug('Ошибка создания лог файла: ' + e.message);
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
            this.logDebug('Ошибка при создании персонажа: ' + error.message);
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
                        this.logDebug('Создание мира отменено: не выбрана родительская папка');
                        return;
                    }
                    this.logDebug(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                    await createWorld(this, parentFolder);
                } catch (error) {
                    this.logDebug(`Ошибка при выборе папки для создания мира: ${error.message}`);
                    this.logDebug('Ошибка при создании мира: ' + error.message);
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
        window.createPotion = createPotion; // оставляем, функции должны быть глобализованы сборщиком
        window.createSpell = createSpell;
        window.createConflict = createConflictWizard;
        window.createOrganization = createOrganizationWizard;
        window.createReligion = createReligionWizard;
        window.createCult = createCultWizard;
        window.createTradeRoute = createTradeRouteWizard;
        window.createFaction = createFactionWizard;
        window.createQuest = createQuestWizard;
        // Регистрируем функции-обертки как глобальные
        window.createArtifact = createArtifact;
        window.createAlchemyRecipe = createAlchemyRecipe;
        window.createCharacter = createCharacter;
        window.createState = createState;
        window.createProvince = createProvince;
        window.createMine = createMine;
        window.createFactory = createFactory;
        window.createFarm = createFarm;
        window.createPeople = createPeople;
        window.createMonster = createMonster;
        window.createTask = createTask;
        window.createSocialInstitution = (typeof window !== 'undefined' && typeof window.createSocialInstitution === 'function')
            ? window.createSocialInstitution
            : null;
        
        // Делаем вспомогательные функции доступными в глобальной области видимости
        window.findProjectRoot = findProjectRoot;
        window.getAllProjectRoots = getAllProjectRoots;
        window.isProjectFolder = isProjectFolder;
        window.getAllProjectFolders = getAllProjectFolders;
        window.fillTemplate = fillTemplate;
        window.generateFromTemplate = generateFromTemplate;
        window.ensureEntityInfrastructure = ensureEntityInfrastructure;
        window.safeCreateFile = safeCreateFile;
        
        // Делаем сервисы временных слоев доступными глобально
        window.timelineService = this.timelineService;
        window.temporalEntityService = this.temporalEntityService;
        window.temporalContextService = this.temporalContextService;
        window.migrationService = this.migrationService;
        window.temporalAPI = this.temporalAPI;
        
        // Делаем модальные окна доступными глобально
        
        // Делаем методы шаблонизатора доступными в глобальной области видимости
        window.processConditionalBlocks = this.processConditionalBlocks.bind(this);
        window.evaluateCondition = this.evaluateCondition.bind(this);
        
        // Инициализируем AI сервисы
        try {
            // console.log('=== ИНИЦИАЛИЗАЦИЯ AI СЕРВИСОВ ===');
            
            // Проверяем доступность модулей - используем глобальные переменные после сборки
            // KeyRotationService, AIProviderService, LoreAnalyzerService должны быть доступны глобально
            
            // Создаем безопасный контекст с проверками
            const pluginContext = this.createSafePluginContext();
            // console.log('PluginContext создан:', pluginContext);
            
            // Создаем сервисы по одному с обработкой ошибок
            // После сборки все классы доступны глобально
            try {
                // Проверяем доступность KeyRotationService
                if (typeof window.KeyRotationService === 'function') {
                    window.keyRotationService = new window.KeyRotationService(pluginContext);
                    // console.log('✅ KeyRotationService создан');
                } else {
                    // console.log('⚠️ KeyRotationService недоступен');
                    window.keyRotationService = null;
                }
            } catch (e) {
                console.error('❌ Ошибка создания KeyRotationService:', e.message);
                window.keyRotationService = null;
            }
            
            try {
                // Проверяем доступность AIProviderService
                if (typeof window.AIProviderService === 'function') {
                    window.aiProviderService = new window.AIProviderService(pluginContext);
                    // console.log('✅ AIProviderService создан');
                } else {
                    console.warn('⚠️ AIProviderService модуль не загружен, создаем fallback');
                    
                    try {
                        window.aiProviderService = new FallbackAIProviderService(pluginContext);
                        window.AIProviderService = FallbackAIProviderService;
                        // console.log('⚠️ FallbackAIProviderService добавлен в window');
                    } catch (e) {
                        console.error('❌ Ошибка создания FallbackAIProviderService:', e.message);
                        window.aiProviderService = null;
                        window.AIProviderService = null;
                    }
                }
            } catch (e) {
                console.error('❌ Ошибка создания AIProviderService:', e.message);
                window.aiProviderService = null;
            }
            
            try {
                // Проверяем доступность LoreAnalyzerService
                if (typeof window.LoreAnalyzerService === 'function') {
                    window.loreAnalyzerService = new window.LoreAnalyzerService(pluginContext);
                    // console.log('✅ LoreAnalyzerService создан');
                } else {
                    // console.log('⚠️ LoreAnalyzerService недоступен');
                    window.loreAnalyzerService = null;
                }
            } catch (e) {
                console.error('❌ Ошибка создания LoreAnalyzerService:', e.message);
                window.loreAnalyzerService = null;
            }
            
            // console.log('=== ИНИЦИАЛИЗАЦИЯ AI СЕРВИСОВ ЗАВЕРШЕНА ===');
        } catch (e) {
            console.error('Критическая ошибка инициализации AI сервисов:', e);
            console.error('Детали ошибки:', e.stack);
            // Продолжаем работу плагина даже если AI сервисы не инициализированы
        }
        
        // Создаем папку для секций шаблонов, если её нет (ПОСЛЕ всех операций с this.app)
        try {
            const sectionsFolder = 'Шаблоны/sections';
            const folder = this.app.vault.getAbstractFileByPath(sectionsFolder);
            if (!folder) {
                await this.app.vault.createFolder(sectionsFolder);
            }
        } catch (e) {
            console.warn('Не удалось создать папку для секций шаблонов:', e.message);
        }
        
        // console.log('Literary Templates plugin loaded successfully');
        
        // Загружаем CSS после полной инициализации
        try {
            if (this.manifest && this.manifest.dir) {
                const cssPath = this.manifest.dir + '/styles.css';
                const exists = await this.app.vault.adapter.exists(cssPath);
                if (exists) {
                    const css = await this.app.vault.adapter.read(cssPath);
                    const styleEl = window.document.createElement('style');
                    styleEl.setAttribute('type', 'text/css');
                    styleEl.textContent = css;
                    const customCss = this.app.customCss.styleEl;
                    window.document.head.insertBefore(styleEl, customCss);
                    this.register(() => styleEl.detach());
                    // console.log('CSS загружен успешно');
                                  } else {
                      // console.log('CSS файл не найден по пути:', cssPath);
                  }
                          } else {
                  // console.log('Manifest недоступен, CSS не загружается');
            }
        } catch (error) {
              console.warn('Ошибка загрузки CSS:', error);
        }
        
        this.addCommand({
            id: 'open-plugin-settings-file',
            name: 'Открыть настройки Literary Templates',
            callback: async () => {
                await openSettingsFile(this.app);
            }
        });
        
        this.addCommand({
            id: 'manage-ai-keys',
            name: 'Управление AI ключами',
            callback: async () => {
                await this.openAIKeysManager();
            }
        });
        
        // console.log('Команда "Управление AI ключами" зарегистрирована');
        // console.log('Literary Templates plugin onload завершен успешно');
        
        // Финальная проверка - создаем тестовый лог
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                await this.logDebug('Плагин успешно загружен - финальная проверка');
                // Тихая отложенная проверка AI сервисов (через 3 секунды после возможного retry)
                window.setTimeout(() => {
                    const ok = !!(window.keyRotationService && window.aiProviderService && window.loreAnalyzerService);
                    if (this.debugEnabled) {
                        this.logDebug('AI сервисы статус (через 3с): ' + (ok ? 'готовы' : 'не готовы'));
                        if (!ok) {
                            this.logDebug('Причина: '
                                + ' KeyRotationService=' + String(typeof window.KeyRotationService)
                                + ' AIProviderService=' + String(typeof window.AIProviderService)
                                + ' LoreAnalyzerService=' + String(typeof window.LoreAnalyzerService));
                        }
                    }
                }, 3000);
            } else {
                console.error('Финальная проверка: app.vault недоступен');
            }
        } catch (error) {
            console.error('Ошибка финальной проверки:', error);
        }
        
        // Планируем дополнительную проверку через 5 секунд
        window.setTimeout(() => {
            this.delayedInitializationCheck();
        }, 5000);
        
        // Также планируем проверку через 1 секунду для быстрой диагностики
        window.setTimeout(() => {
            this.quickInitializationCheck();
        }, 1000);
        
        // Планируем повторную попытку инициализации AI сервисов через 2 секунды
        window.setTimeout(() => {
            this.retryAIInitialization();
        }, 2000);

        // === КОМАНДЫ ДЛЯ ВНЕШНЕГО ЧАТА ===
        this.addCommand({
            id: 'ai-prompt-selector',
            name: 'AI промпт-селектор (выбор шаблона для внешнего чата)',
            callback: async () => {
                await this.showPromptSelector();
            }
        });
        
        // === КОМАНДЫ РАБОТЫ С БАЗОЙ ФАКТОВ ===
        
        this.addCommand({
            id: 'test-ai-connection',
            name: 'Тест AI подключения',
            callback: async () => {
                await this.testAIConnection();
            }
        });

        // Долгая команда: собрать лор по проекту и перезаписать сводный файл
        this.addCommand({
            id: 'ai-gather-project-lore',
            name: 'AI собрать лор по проекту (перезаписать файл)',
            callback: async () => {
                try {
                    await this.aiGatherProjectLore();
                } catch (e) {
                    this.logDebug('Ошибка при сборе лора: ' + e.message);
                }
            }
        });

        // Быстрая команда: добавить лор из текущего документа в сводный файл
        this.addCommand({
            id: 'ai-append-current-note-lore',
            name: 'AI добавить лор из текущего документа',
            callback: async () => {
                try {
                    await this.aiAppendCurrentNoteLore();
                } catch (e) {
                    this.logDebug('Ошибка добавления лора из заметки: ' + e.message);
                }
            }
        });

        // Социальные объекты: единый мастер
        this.addCommand({
            id: 'create-social-institution',
            name: 'Создать социальный объект (мастер)',
            callback: async () => {
                try {
                    const fn = (typeof window !== 'undefined' && typeof window.createSocialInstitution === 'function') ? window.createSocialInstitution : null;
                    if (fn) {
                        await fn(this);
                        return;
                    }
                    // Fallback: открываем модал напрямую
                    if (typeof window.SocialInstitutionWizardModal !== 'function') {
                        this.logDebug('[ERROR] SocialInstitutionWizardModal недоступен');
                        return;
                    }
                    const activeFile = this.app.workspace.getActiveFile();
                    const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        const roots = await getAllProjectRoots(this.app);
                        if (roots && roots.length > 0) projectRoot = roots[0];
                    }
                    const modal = new window.SocialInstitutionWizardModal(this.app, Modal, Setting, Notice, projectRoot, async (data) => {
                        // Без Unicode property escapes для совместимости
                        const cleanName = String(data.name || '').trim().replace(/[^A-Za-zА-Яа-яЁё0-9_\-\s]/g, '').replace(/\s+/g, '_');
                        const sub = String(data.subtype || 'Объект');
                        const folder = `${projectRoot}/Локации/Социальные_объекты/${sub}`;
                        await ensureEntityInfrastructure(folder, cleanName, this.app);
                        const path = `${folder}/${cleanName}.md`;
                        const md = await generateFromTemplate('Новый_социальный_объект', {
                            name: data.name,
                            subtype: sub,
                            country: data.country,
                            province: data.province,
                            city: data.city,
                            address: data.address,
                            founded: data.founded,
                            capacity: data.capacity,
                            owner: data.owner,
                            affiliation: data.affiliation,
                            status: data.status,
                            description: data.description,
                            date: (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)),
                            projectName: projectRoot.split('/').pop()
                        }, this);
                        const existing = this.app.vault.getAbstractFileByPath(path);
                        if (existing instanceof TFile) {
                            await this.app.vault.modify(existing, md);
                            await this.app.workspace.getLeaf(true).openFile(existing);
                        } else {
                            const file = await this.app.vault.create(path, md);
                            await this.app.workspace.getLeaf(true).openFile(file);
                        }
                        new Notice(`Создан объект: ${sub} — ${data.name}`);
                    });
                    modal.open();
                } catch (e) {
                    this.logDebug('Ошибка создания социального объекта: ' + e.message);
                }
            }
        });

        // Импорт фактов из буфера обмена в базу проекта (Лор-контекст/Факты.json)
        this.addCommand({
            id: 'import-facts-from-clipboard',
            name: 'Импортировать факты из буфера',
            callback: async () => {
                this.logDebug('=== Импорт фактов: команда вызвана ===');
                try {
                    let raw = '';
                    this.logDebug('Пробуем прочитать буфер обмена...');
                    
                    // Проверяем доступность буфера обмена
                    if (navigator && navigator.clipboard && navigator.clipboard.readText) {
                        try {
                            // Запрашиваем разрешение на доступ к буферу
                            const permission = await navigator.permissions.query({ name: 'clipboard-read' });
                            this.logDebug('Разрешение на буфер: ' + permission.state);
                            
                            if (permission.state === 'denied') {
                                this.logDebug('Доступ к буферу запрещён');
                                new Notice('Доступ к буферу обмена запрещён. Разрешите доступ в настройках браузера.');
                                return;
                            }
                            
                            raw = await navigator.clipboard.readText();
                            this.logDebug('Буфер обмена прочитан, длина: ' + raw.length);
                        } catch (clipboardError) {
                            this.logDebug('Ошибка чтения буфера: ' + clipboardError.message);
                            new Notice('Ошибка чтения буфера обмена: ' + clipboardError.message);
                            return;
                        }
                    } else if (document.queryCommandSupported && document.queryCommandSupported('paste')) {
                        // Альтернативный способ для старых браузеров
                        this.logDebug('Пробуем альтернативный способ чтения буфера...');
                        try {
                            // Создаём временный textarea для вставки
                            const textarea = document.createElement('textarea');
                            textarea.style.position = 'fixed';
                            textarea.style.left = '-9999px';
                            document.body.appendChild(textarea);
                            textarea.focus();
                            
                            // Пытаемся вставить
                            const success = document.execCommand('paste');
                            if (success) {
                                raw = textarea.value;
                                this.logDebug('Буфер прочитан альтернативным способом, длина: ' + raw.length);
                            } else {
                                throw new Error('Не удалось выполнить команду paste');
                            }
                            
                            document.body.removeChild(textarea);
                        } catch (altError) {
                            this.logDebug('Альтернативный способ не сработал: ' + altError.message);
                            new Notice('Не удалось прочитать буфер обмена. Скопируйте JSON вручную.');
                            return;
                        }
                    } else {
                        this.logDebug('Буфер обмена недоступен в этом браузере');
                        new Notice('Буфер обмена недоступен в этом браузере');
                        return;
                    }

                    // Предочистка ввода
                    this.logDebug('Сырой текст из буфера: ' + raw.substring(0, 200) + '...');
                    
                    let s = cleanJsonInput ? cleanJsonInput(raw) : String(raw || '').trim();
                    this.logDebug('После очистки: ' + s.substring(0, 200) + '...');
                    
                    // Удаляем многоточия в конце (… или ...)
                    s = s.replace(/[\u2026.]{3,}\s*$/u, '');
                    // Удаляем висячие запятые перед ] или }
                    s = s.replace(/,\s*(\]|\})/g, '$1');
                    // Если в тексте есть несколько блоков, оставляем самый внешний массив
                    if (!(s.trim().startsWith('[') && s.trim().endsWith(']'))) {
                        const first = s.indexOf('[');
                        const last = s.lastIndexOf(']');
                        if (first !== -1 && last !== -1 && last > first) {
                            s = s.slice(first, last + 1).trim();
                            this.logDebug('Извлечён массив из позиции ' + first + ' до ' + last);
                        }
                    }
                    
                    this.logDebug('Финальный текст для парсинга: ' + s.substring(0, 200) + '...');

                    let parsed = [];
                    try {
                        parsed = JSON.parse(s);
                        this.logDebug('JSON успешно распарсен, элементов: ' + (Array.isArray(parsed) ? parsed.length : 'не массив'));
                        new Notice(`JSON распарсен: ${parsed.length} элементов`);
                    } catch (e) {
                        this.logDebug('Ошибка парсинга JSON после очистки: ' + e.message);
                        // Логируем первые 200 символов для диагностики
                        this.logDebug('Фрагмент ввода: ' + s.slice(0, 200));
                        new Notice('Ошибка парсинга JSON: ' + e.message);
                        return;
                    }
                    if (!Array.isArray(parsed)) {
                        this.logDebug('Ожидался массив фактов');
                        new Notice('Ожидался массив фактов в JSON');
                        return;
                    }

                    // Нормализация ключей к русской схеме и правка отношений
                    let skipped = 0;
                    const newFacts = parsed.map(f => normalizeRussianFactKeys(f)).map(f => {
                        // Приводим отношения к массиву
                        if (f && f['отношения'] && !Array.isArray(f['отношения'])) {
                            const rel = f['отношения'];
                            if (rel && typeof rel === 'object') {
                                const keys = Object.keys(rel);
                                f['отношения'] = keys.length === 0
                                    ? []
                                    : keys.map(k => ({ 'связь': k, 'объект': String(rel[k]) }));
                            } else {
                                f['отношения'] = [];
                            }
                        }
                        return f;
                    }).filter(f => {
                        const ok = f && typeof f === 'object' && f['тип'] && f['имя'];
                        if (!ok) skipped++;
                        return ok;
                    });
                    
                    this.logDebug(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);
                    new Notice(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);

                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        // Пытаемся выбрать первый доступный проект
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch {}
                    }
                    this.logDebug('projectRoot: ' + projectRoot);
                    if (!projectRoot) {
                        this.logDebug('Проект не найден для импорта фактов');
                        return;
                    }

                    // Загружаем существующие факты
                    let existing = await loadFacts(this.app, projectRoot);
                    if (!Array.isArray(existing)) existing = [];
                    this.logDebug('Загружено существующих фактов: ' + existing.length);

                    // Индекс по тип+имя
                    const index = new Map();
                    for (const f of existing) {
                        const key = `${f['тип']}|${f['имя']}`;
                        index.set(key, { ...f });
                    }

                    // Умный merge
                    let added = 0, updated = 0;
                    for (const f of newFacts) {
                        const key = `${f['тип']}|${f['имя']}`;
                        if (index.has(key)) {
                            const old = index.get(key);
                            // Объединяем атрибуты
                            old['атрибуты'] = { ...(old['атрибуты'] || {}), ...(f['атрибуты'] || {}) };
                            // Объединяем отношения без дубликатов
                            const oldRels = Array.isArray(old['отношения']) ? old['отношения'] : [];
                            const newRels = Array.isArray(f['отношения']) ? f['отношения'] : [];
                            const relSet = new Set(oldRels.map(r => JSON.stringify(r)));
                            for (const r of newRels) {
                                const srl = JSON.stringify(r);
                                if (!relSet.has(srl)) {
                                    oldRels.push(r);
                                    relSet.add(srl);
                                }
                            }
                            old['отношения'] = oldRels;
                            index.set(key, old);
                            updated++;
                        } else {
                            index.set(key, f);
                            added++;
                        }
                    }

                    // Сохраняем
                    const merged = Array.from(index.values());
                    await saveFacts(this.app, projectRoot, merged);
                    this.logDebug(`Импорт фактов завершён: добавлено ${added}, обновлено ${updated}, пропущено ${skipped}`);
                    new Notice(`Импорт завершён: +${added}, обновлено ${updated}, пропущено ${skipped}`);
                } catch (e) {
                    this.logDebug('Ошибка импорта фактов: ' + e.message + (e.stack ? '\n' + e.stack : ''));
                    new Notice('Ошибка импорта фактов: ' + e.message);
                }
            }
        });

        // Импорт фактов через ручной ввод JSON
        this.addCommand({
            id: 'import-facts-manual',
            name: 'Импортировать факты (ручной ввод)',
            callback: async () => {
                this.logDebug('=== Ручной импорт фактов: команда вызвана ===');
                try {
                    const raw = await this.prompt('Вставьте JSON с фактами:');
                    if (!raw || !raw.trim()) {
                        this.logDebug('JSON не введён');
                        return;
                    }

                    this.logDebug('Ручной ввод получен, длина: ' + raw.length);
                    
                    // Используем ту же логику обработки
                    let s = cleanJsonInput ? cleanJsonInput(raw) : String(raw || '').trim();
                    this.logDebug('После очистки: ' + s.substring(0, 200) + '...');
                    
                    // Удаляем многоточия в конце (… или ...)
                    s = s.replace(/[\u2026.]{3,}\s*$/u, '');
                    // Удаляем висячие запятые перед ] или }
                    s = s.replace(/,\s*(\]|\})/g, '$1');
                    // Если в тексте есть несколько блоков, оставляем самый внешний массив
                    if (!(s.trim().startsWith('[') && s.trim().endsWith(']'))) {
                        const first = s.indexOf('[');
                        const last = s.lastIndexOf(']');
                        if (first !== -1 && last !== -1 && last > first) {
                            s = s.slice(first, last + 1).trim();
                            this.logDebug('Извлечён массив из позиции ' + first + ' до ' + last);
                        }
                    }
                    
                    this.logDebug('Финальный текст для парсинга: ' + s.substring(0, 200) + '...');

                    let parsed = [];
                    try {
                        parsed = JSON.parse(s);
                        this.logDebug('JSON успешно распарсен, элементов: ' + (Array.isArray(parsed) ? parsed.length : 'не массив'));
                        new Notice(`JSON распарсен: ${parsed.length} элементов`);
                    } catch (e) {
                        this.logDebug('Ошибка парсинга JSON после очистки: ' + e.message);
                        this.logDebug('Фрагмент ввода: ' + s.slice(0, 200));
                        new Notice('Ошибка парсинга JSON: ' + e.message);
                        return;
                    }
                    if (!Array.isArray(parsed)) {
                        this.logDebug('Ожидался массив фактов');
                        new Notice('Ожидался массив фактов в JSON');
                        return;
                    }

                    // Нормализация ключей к русской схеме и правка отношений
                    let skipped = 0;
                    const newFacts = parsed.map(f => normalizeRussianFactKeys(f)).map(f => {
                        // Приводим отношения к массиву
                        if (f && f['отношения'] && !Array.isArray(f['отношения'])) {
                            const rel = f['отношения'];
                            if (rel && typeof rel === 'object') {
                                const keys = Object.keys(rel);
                                f['отношения'] = keys.length === 0
                                    ? []
                                    : keys.map(k => ({ 'связь': k, 'объект': String(rel[k]) }));
                            } else {
                                f['отношения'] = [];
                            }
                        }
                        return f;
                    }).filter(f => {
                        const ok = f && typeof f === 'object' && f['тип'] && f['имя'];
                        if (!ok) skipped++;
                        return ok;
                    });
                    
                    this.logDebug(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);
                    new Notice(`Обработано фактов: ${newFacts.length}, пропущено: ${skipped}`);

                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        // Пытаемся выбрать первый доступный проект
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch {}
                    }
                    this.logDebug('projectRoot: ' + projectRoot);
                    if (!projectRoot) {
                        this.logDebug('Проект не найден для импорта фактов');
                        new Notice('Проект не найден для импорта фактов');
                        return;
                    }

                    // Загружаем существующие факты
                    let existing = await loadFacts(this.app, projectRoot);
                    if (!Array.isArray(existing)) existing = [];
                    this.logDebug('Загружено существующих фактов: ' + existing.length);

                    // Индекс по тип+имя
                    const index = new Map();
                    for (const f of existing) {
                        const key = `${f['тип']}|${f['имя']}`;
                        index.set(key, { ...f });
                    }

                    // Умный merge
                    let added = 0, updated = 0;
                    for (const f of newFacts) {
                        const key = `${f['тип']}|${f['имя']}`;
                        if (index.has(key)) {
                            const old = index.get(key);
                            // Объединяем атрибуты
                            old['атрибуты'] = { ...(old['атрибуты'] || {}), ...(f['атрибуты'] || {}) };
                            // Объединяем отношения без дубликатов
                            const oldRels = Array.isArray(old['отношения']) ? old['отношения'] : [];
                            const newRels = Array.isArray(f['отношения']) ? f['отношения'] : [];
                            const relSet = new Set(oldRels.map(r => JSON.stringify(r)));
                            for (const r of newRels) {
                                const srl = JSON.stringify(r);
                                if (!relSet.has(srl)) {
                                    oldRels.push(r);
                                    relSet.add(srl);
                                }
                            }
                            old['отношения'] = oldRels;
                            index.set(key, old);
                            updated++;
                        } else {
                            index.set(key, f);
                            added++;
                        }
                    }

                    // Сохраняем
                    const merged = Array.from(index.values());
                    await saveFacts(this.app, projectRoot, merged);
                    this.logDebug(`Импорт фактов завершён: добавлено ${added}, обновлено ${updated}, пропущено ${skipped}`);
                    new Notice(`Импорт завершён: +${added}, обновлено ${updated}, пропущено ${skipped}`);
                } catch (e) {
                    this.logDebug('Ошибка ручного импорта фактов: ' + e.message + (e.stack ? '\n' + e.stack : ''));
                    new Notice('Ошибка ручного импорта фактов: ' + e.message);
                }
            }
        });

        // Просмотр текущей базы фактов
        this.addCommand({
            id: 'view-facts-database',
            name: 'Просмотреть базу фактов',
            callback: async () => {
                this.logDebug('=== Просмотр базы фактов: команда вызвана ===');
                try {
                    // Определяем корень проекта
                    const active = this.app.workspace.getActiveFile();
                    const parentPath = active && active.parent ? active.parent.path : '';
                    let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                    if (!projectRoot) {
                        try {
                            const roots = await getAllProjectRoots(this.app);
                            if (roots && roots.length > 0) projectRoot = roots[0];
                        } catch {}
                    }
                    
                    if (!projectRoot) {
                        new Notice('Проект не найден');
                        return;
                    }

                    // Загружаем факты
                    const facts = await loadFacts(this.app, projectRoot);
                    if (!Array.isArray(facts) || facts.length === 0) {
                        new Notice('База фактов пуста');
                        return;
                    }

                    // Создаём временный файл для просмотра
                    const content = `# База фактов проекта: ${projectRoot}

## Статистика
- Всего фактов: ${facts.length}
- Типы: ${[...new Set(facts.map(f => f['тип'] || 'неизвестно'))].join(', ')}

## Все факты
\`\`\`json
${JSON.stringify(facts, null, 2)}
\`\`\`

---
*Создано автоматически для просмотра базы фактов*
`;

                    const fileName = `База_фактов_${new Date().toISOString().slice(0, 10)}.md`;
                    const filePath = `${projectRoot}/${fileName}`;
                    
                    await this.app.vault.create(filePath, content);
                    new Notice(`База фактов экспортирована в ${fileName}`);
                    
                    // Открываем файл
                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (file) {
                        this.app.workspace.openLinkText(fileName, filePath);
                    }
                    
                } catch (e) {
                    this.logDebug('Ошибка просмотра базы фактов: ' + e.message);
                    new Notice('Ошибка просмотра базы фактов: ' + e.message);
                }
            }
        });

        // === Глобализация сервисов для доступа через window ===
        // Пропускаем прямую глобализацию классов сервисов: классы становятся доступными глобально после сборки
    }
    
    async quickInitializationCheck() {
        // console.log('=== Quick Initialization Check (1 сек) ===');
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                // console.log('Quick check: все компоненты доступны');
                // console.log('Плагин готов к работе!');
            } else {
                console.error('Quick check: некоторые компоненты недоступны');
                console.error('this.app:', !!this.app);
                console.error('this.app.vault:', !!(this.app && this.app.vault));
                console.error('this.app.vault.adapter:', !!(this.app && this.app.vault && this.app.vault.adapter));
            }
        } catch (error) {
            console.error('Quick check error:', error);
        }
    }
    
    async delayedInitializationCheck() {
        // console.log('=== Delayed Initialization Check (5 сек) ===');
        try {
            if (this.app && this.app.vault && this.app.vault.adapter) {
                // console.log('Delayed check: все компоненты доступны');
                await this.logDebug('Delayed check: плагин работает корректно');
            } else {
                console.error('Delayed check: некоторые компоненты недоступны');
                console.error('this.app:', !!this.app);
                console.error('this.app.vault:', !!(this.app && this.app.vault));
                console.error('this.app.vault.adapter:', !!(this.app && this.app.vault && this.app.vault.adapter));
            }
        } catch (error) {
            console.error('Delayed check error:', error);
        }
    }
    
    async retryAIInitialization() {
        // console.log('=== Retry AI Initialization (2 сек) ===');
        try {
            // Проверяем, какие сервисы уже созданы
            const existingServices = {
                keyRotation: !!window.keyRotationService,
                aiProvider: !!window.aiProviderService,
                loreAnalyzer: !!window.loreAnalyzerService
            };
            
            // console.log('Существующие AI сервисы:', existingServices);
            
            // Если все сервисы уже созданы, не делаем ничего
            if (existingServices.keyRotation && existingServices.aiProvider && existingServices.loreAnalyzer) {
                // console.log('Все AI сервисы уже инициализированы');
                return;
            }
            
            // Пытаемся создать недостающие сервисы
            if (!existingServices.keyRotation) {
                try {
                    const pluginContext = this.createSafePluginContext();
                    const KS = typeof window !== 'undefined' ? window.KeyRotationService : undefined;
                    if (typeof KS === 'function') {
                        window.keyRotationService = new KS(pluginContext);
                        // console.log('KeyRotationService создан при повторной попытке');
                    }
                } catch (e) {
                    console.error('Ошибка создания KeyRotationService при повторной попытке:', e);
                }
            }
            
            if (!existingServices.aiProvider) {
                try {
                    const pluginContext = this.createSafePluginContext();
                    const APS = typeof window !== 'undefined' ? window.AIProviderService : undefined;
                    if (typeof APS === 'function') {
                        window.aiProviderService = new APS(pluginContext);
                        // console.log('AIProviderService создан при повторной попытке');
                    }
                } catch (e) {
                    console.error('Ошибка создания AIProviderService при повторной попытке:', e);
                }
            }
            
            if (!existingServices.loreAnalyzer) {
                try {
                    const pluginContext = this.createSafePluginContext();
                    const LAS = typeof window !== 'undefined' ? window.LoreAnalyzerService : undefined;
                    if (typeof LAS === 'function') {
                        window.loreAnalyzerService = new LAS(pluginContext);
                        // console.log('LoreAnalyzerService создан при повторной попытке');
                    }
                } catch (e) {
                    console.error('Ошибка создания LoreAnalyzerService при повторной попытке:', e);
                }
            }
            
            // console.log('Повторная инициализация AI сервисов завершена');
        } catch (error) {
            console.error('Ошибка повторной инициализации AI сервисов:', error);
        }
    }
    
    createSafePluginContext() {
        return {
            app: this.app || null,
            manifest: this.manifest || null,
            logDebug: (message) => {
                try {
                    // Используем console.log как fallback
                    console.log(`[AI DEBUG] ${message}`);
                    
                    // Пытаемся вызвать this.logDebug если он доступен
                    if (this && typeof this.logDebug === 'function') {
                        try {
                            this.logDebug(message);
                        } catch (e) {
                            console.log(`[AI DEBUG] logDebug error: ${e.message}`);
                        }
                    }
                } catch (e) {
                    console.log(`[AI DEBUG] ${message} (general error: ${e.message})`);
                }
            },
            settings: this.settings || {},
            // Добавляем безопасные методы для AI сервисов
            saveSettings: async () => {
                try {
                    if (this && typeof this.saveSettings === 'function') {
                        await this.saveSettings();
                    }
                } catch (e) {
                    console.log(`[AI DEBUG] saveSettings error: ${e.message}`);
                }
            }
        };
    }
    
    async openAIKeysManager() {
        try {
            // console.log('Открытие менеджера AI ключей...');
            
            // Создаем простое модальное окно для управления ключами
            const modal = new AIKeysManagerModal(this.app, Modal, Setting, Notice, this.settings, async (newSettings) => {
                // Сохраняем новые настройки
                this.settings = { ...this.settings, ...newSettings };
                await this.saveSettings();
                this.logDebug('AI ключи обновлены');
                //  console.log('AI ключи обновлены:', this.settings);
            });
            
            modal.open();
        } catch (error) {
            console.error('Ошибка открытия менеджера AI ключей:', error);
            this.logDebug('Ошибка открытия менеджера AI ключей: ' + error.message);
        }
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
                    this.logDebug(`[ERROR] Проекты не найдены!`);
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
            this.logDebug('Ошибка при редактировании настроек: ' + error.message);
            await this.logDebug('Ошибка editWorldSettings: ' + error.message);
        }
    }



    async chooseProjectRoot() {
        // console.log('chooseProjectRoot вызвана');
        const roots = await getAllProjectRoots(this.app);
        if (roots.length === 0) {
            this.logDebug(`[ERROR] Проекты не найдены (нет ни одной папки с Настройки_мира.md)`);
                return;
        }
        if (roots.length === 1) {
            this.activeProjectRoot = roots[0];
            try {
            await this.saveData({ activeProjectRoot: roots[0] });
            } catch (error) {
                console.warn('Ошибка сохранения активного проекта:', error);
            }
            this.logDebug(`Активный проект: ${roots[0]}`);
        } else {
            // TODO: Реализовать модальное окно выбора проекта
            this.activeProjectRoot = roots[0];
            try {
            await this.saveData({ activeProjectRoot: roots[0] });
            } catch (error) {
                console.warn('Ошибка сохранения активного проекта:', error);
            }
            let projectList = 'Доступные проекты:\n';
            roots.forEach((root, index) => {
                projectList += `${index + 1}. ${root}\n`;
            });
            this.logDebug(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
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
                    this.logDebug(`[ERROR] Проекты не найдены (нет ни одной папки с Настройки_мира.md)`);
                return;
                }
                if (roots.length === 1) {
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    try {
                    await this.saveData({ activeProjectRoot: roots[0] });
                    } catch (error) {
                        console.warn('Ошибка сохранения активного проекта:', error);
                    }
                    this.logDebug(`Выбран проект: ${roots[0]}`);
                } else {
                    // TODO: Реализовать модальное окно выбора проекта
                    projectRoot = roots[0];
                    this.activeProjectRoot = roots[0];
                    try {
                    await this.saveData({ activeProjectRoot: roots[0] });
                    } catch (error) {
                        console.warn('Ошибка сохранения активного проекта:', error);
                    }
                    let projectList = 'Доступные проекты:\n';
                    roots.forEach((root, index) => {
                        projectList += `${index + 1}. ${root}\n`;
                    });
                    this.logDebug(`Выбрано автоматически: ${roots[0]}\n(Реализуйте модальное окно выбора!)\n${projectList}`, 10000);
                }
            }
            
            // Устанавливаем переменную для шаблонов
            window.tp = window.tp || {};
            window.tp.literaryProjectRoot = projectRoot;
            // console.log('Установлена переменная tp.literaryProjectRoot:', projectRoot);
            
            // Открываем палитру команд Templater через Obsidian API
            // console.log('Выполняем команду templater-obsidian:insert-templater');
            this.app.commands.executeCommandById('templater-obsidian:insert-templater');
            this.logDebug(`Открыта палитра Templater. Выберите шаблон "${templateName}"`);
            // console.log('Команда выполнена, уведомление показано');
        } catch (error) {
            console.error('Ошибка при открытии палитры Templater:', error);
            this.logDebug(`[ERROR] Ошибка: ${error.message}`);
        }
    }



    async logDebug(message) {
        // Всегда выводим в консоль для отладки
        // console.log(`[DEBUG] ${message}`);
        
        // Тихий режим: если отладка выключена — не пишем в файл
        if (!this.debugEnabled) return;
        
        // Проверяем, что vault доступен
        if (!this.app || !this.app.vault || !this.app.vault.adapter) {
            // console.log(`[DEBUG] ${message} (vault недоступен)`);
            return;
        }
        // Дублируем вывод в консоль для удобной отладки
        try {
            const now = window.moment ? window.moment().format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString();
            const line = `[${now}] ${message}`;
            // Единая точка консольного вывода
             
            // console.log(line);

            // Пишем лог в .obsidian, чтобы Dataview его не индексировал
            const logPath = '.obsidian/plugins/literary-templates/log.md';
            let prev = '';
            try {
                // Принудительно создаем папку плагина
                const pluginDir = '.obsidian/plugins/literary-templates';
                try {
                    await this.app.vault.adapter.mkdir(pluginDir);
                    // console.log('Папка для логов создана:', pluginDir);
                } catch (mkdirError) {
                     
                    // console.log('Папка для логов уже существует или ошибка создания:', mkdirError.message);
                }
                
                // Пытаемся прочитать существующий лог
            try {
                prev = await this.app.vault.adapter.read(logPath);
            } catch {
                prev = '';
            }
                
                // Записываем новый лог
                try {
            await this.app.vault.adapter.write(logPath, prev + line + '\n');
                    //  console.log('Лог записан в файл:', logPath);
                } catch (writeError) {
                    console.warn('Не удалось записать лог:', writeError.message);
                }
            } catch (error) {
                console.error('Общая ошибка в logDebug:', error);
            }
        } catch (e) {
             
            console.error('logDebug error:', e);
        }
    }
    // Вспомогательная функция для определения типа контента по имени файла
    // Используется в aiAnalyzeAndExtendNote и aiBuildLoreContext
    getContentTypeByName(filename) {
        const name = filename.toLowerCase();
        
        // Карта типов контента и связанных с ними ключевых слов
        const contentTypeKeywords = {
            'castle': ['замок', 'крепость', 'форт'],
            'potion': ['зелье', 'настойка', 'отвар'],
            'artifact': ['артефакт', 'реликвия', 'сокровище'],
            'character': ['персонаж', 'герой', 'лицо'],
            'location': ['локация', 'место', 'точка'],
            'event': ['событие', 'происшествие'],
            'organization': ['организация', 'группа', 'союз'],
            'city': ['город', 'поселение'],
            'village': ['деревня', 'село'],
            'province': ['провинция', 'область'],
            'state': ['государство', 'страна'],
            'spell': ['заклинание', 'спелл'],
            'alchemy': ['алхимия', 'рецепт'],
            'mine': ['шахта', 'рудник'],
            'factory': ['завод', 'фабрика'],
            'farm': ['ферма', 'хозяйство'],
            'port': ['порт', 'гавань'],
            'people': ['народ', 'раса'],
            'monster': ['монстр', 'чудовище'],
            'task': ['задача', 'квест']
        };

        // Поиск соответствия по ключевым словам
        for (const [contentType, keywords] of Object.entries(contentTypeKeywords)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                return contentType;
            }
        }

        // Если тип не определен
        return '';
    }

    async saveSettings() {
        try {
        await saveSettingsToFile(this.app, this.settings);
        } catch (error) {
            console.warn('Ошибка сохранения настроек:', error);
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
                    this.logDebug(`[ERROR] Проект не найден: отсутствует "Настройки_мира.md"`);
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
            this.logDebug('Справочник писателя готов');
        } catch (error) {
            this.logDebug('Ошибка справочника: ' + error.message);
        }
    }

    async setWriterHandbookStatus() {
        const editorFile = this.app.workspace.getActiveFile();
        if (!(editorFile instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }
        const path = editorFile.path || '';
        if (!/\/Справочник\//.test(path)) {
            this.logDebug(`[ERROR] Команда работает для файлов в папке "Справочник"`);
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
        this.logDebug(`Статус: ${chosen}`);
    }

    // Добавляем команду для управления эпохами
    registerTemporalCommands() {
        this.addCommand({
            id: 'run-temporal-tests',
            name: 'Запустить тесты временных слоев',
            callback: async () => {
                try {
                    const { runTemporalTests } = require('./test/temporal_test.js');
                    const result = await runTemporalTests(this);
                    
                    if (result.success) {
                        new Notice(result.message);
                    } else {
                        new Notice('Тесты не пройдены: ' + result.message);
                    }
                } catch (error) {
                    console.error('Ошибка запуска тестов:', error);
                    new Notice('Ошибка запуска тестов: ' + error.message);
                }
            }
        });
    }

    registerCommands() {
        // console.log('Регистрация команд начата');
        
        try {
        this.addCommand({
            id: 'literary-switch-project',
            name: 'Литературные шаблоны: Сменить проект',
            callback: () => this.chooseProjectRoot(),
            hotkeys: []
        });
            
            this.addCommand({
                id: 'manage-ai-keys',
                name: 'Управление AI ключами',
                callback: async () => {
                    await this.openAIKeysManager();
                }
            });
            
        // console.log('Команды зарегистрированы');
        } catch (error) {
            console.error('Ошибка регистрации команд:', error);
            // Продолжаем работу плагина даже если команды не зарегистрированы
        }
        
        // Регистрируем команды для работы с временными слоями
        this.registerTemporalCommands();
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
                
                // Фортификация → один пункт, запускающий мастер
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏰 Фортификация (мастер)').setIcon('fortress').onClick(() => {
                        let startPath = '';
                        if (target instanceof TFile) startPath = target.parent.path;
                        else if (target instanceof TFolder) startPath = target.path;
                        else if (target && target.path) startPath = target.path;
                        createCastle(this, startPath);
                    });
                });

                // Социальные учреждения → один пункт, запускающий мастер
                locationSubMenu.addItem((locItem) => {
                    locItem.setTitle('🏛️ Социальные учреждения (мастер)').setIcon('library').onClick(async () => {
                        try {
                            await this.app.commands.executeCommandById('create-social-institution');
                        } catch (e) {
                            this.logDebug('Ошибка запуска мастера социальных объектов: ' + e.message);
                        }
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
                            this.logDebug('Функция createPort временно недоступна');
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
                        window.createPotion(this, startPath);
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
                    worldItem.setTitle('Управление AI ключами').setIcon('key').onClick(() => {
                        this.openAIKeysManager();
                    });
                });
                
                worldSubMenu.addSeparator();
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('Создать новый мир/проект').setIcon('globe').onClick(async () => {
                        try {
                            // Выбираем родительскую папку для проекта
                            const parentFolder = await this._selectProjectParentFolder();
                            if (!parentFolder) {
                                this.logDebug('Создание мира отменено: не выбрана родительская папка');
                                return;
                            }
                            this.logDebug(`Выбрана родительская папка для создания мира: ${parentFolder}`);
                            await window.createWorld(this, parentFolder);
                        } catch (error) {
                            this.logDebug(`Ошибка при выборе папки для создания мира: ${error.message}`);
                            this.logDebug('Ошибка при создании мира: ' + error.message);
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

                // ЛОР: команды AI
                worldSubMenu.addSeparator();
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('AI собрать лор по проекту (перезаписать файл)')
                        .setIcon('book')
                        .onClick(async () => {
                            try {
                                await this.aiGatherProjectLore();
                            } catch (e) {
                                this.logDebug('Ошибка при сборе лора: ' + e.message);
                            }
                        });
                });
                worldSubMenu.addItem((worldItem) => {
                    worldItem.setTitle('AI добавить лор из текущего документа')
                        .setIcon('book')
                        .onClick(async () => {
                            try {
                                await this.aiAppendCurrentNoteLore();
                            } catch (e) {
                                this.logDebug('Ошибка добавления лора из заметки: ' + e.message);
                            }
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
                    
                    this.logDebug('Создана папка "Мои Проекты" для хранения проектов.');
                } catch (e) {
                    await this.logDebug(`Ошибка создания папки "Мои Проекты": ${e.message}`);
                    this.logDebug('Ошибка создания папки проектов: ' + e.message);
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
            this.logDebug('Ошибка при выборе папки проектов: ' + error.message);
            return null;
        }
    }

    async aiAnalyzeAndExtendNote() {
        try {
            const file = this.app.workspace.getActiveFile();
            if (!file) {
                await this.logDebug('Нет активного файла для AI анализа');
                return;
            }
            
            const content = await this.app.vault.read(file);
            
            // Определяем тип сущности по frontmatter или названию файла
            let contentType = '';
            const cache = this.app.metadataCache.getFileCache(file) || {};
            
            if (cache.frontmatter && cache.frontmatter.type) {
                contentType = String(cache.frontmatter.type).toLowerCase();
                console.log('Тип определен из frontmatter:', contentType);
            } else {
                // Пробуем по названию файла (используем вспомогательную функцию)
                console.log('Анализируем название файла:', file.basename);
                contentType = this.getContentTypeByName(file.basename);
                console.log('Тип определен по названию:', contentType);
            }
            
            if (!contentType) {
                await this.logDebug('Не удалось определить тип сущности для AI анализа. Добавьте frontmatter с полем "type" или используйте название файла с ключевыми словами.');
                return;
            }
            
            // Проверяем доступность AI сервиса
            if (!window.loreAnalyzerService) {
                console.warn('AI сервис анализа не инициализирован, показываем базовую информацию');
                
                // Fallback: показываем базовую информацию о типе сущности
                let resultText = `# Анализ сущности: ${contentType}\n\n`;
                resultText += `## Файл: ${file.basename}\n`;
                resultText += `## Тип: ${contentType}\n`;
                resultText += `## Путь: ${file.path}\n\n`;
                
                // Добавляем рекомендации по типу
                const recommendations = this.getRecommendationsForType(contentType);
                if (recommendations.length > 0) {
                    resultText += `### Рекомендуемые разделы:\n`;
                    recommendations.forEach(rec => {
                        resultText += `- ${rec}\n`;
                    });
                }
                
                resultText += `\n> [!note] AI сервис недоступен\n> Для полного AI анализа добавьте API ключи в настройках плагина.`;
                
                // Показываем результат в модальном окне
                const modal = new PromptModal(this.app, Modal, Setting, Notice, 'Анализ сущности', resultText);
                modal.open();
                return;
            }
            
            // AI сервис доступен - выполняем полный анализ
            console.log('AI сервис доступен, начинаем анализ...');
            console.log('Тип контента для анализа:', contentType);
            console.log('Тип typeof contentType:', typeof contentType);
            console.log('AI сервис:', window.loreAnalyzerService);
            console.log('Методы AI сервиса:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.loreAnalyzerService)));
            
            const projectRoot = findProjectRoot(this.app, file.parent.path) || '';
            console.log('Project root:', projectRoot);
            
            try {
                const analysis = await window.loreAnalyzerService.analyzeContent(content, contentType, projectRoot);
                console.log('Анализ завершен успешно:', analysis);
                
                let resultText = `# AI анализ (${contentType})\n`;
                resultText += `## Полнота: ${analysis.completeness || 0}%\n`;
                
                if (analysis.missing && analysis.missing.length > 0) {
                    resultText += `### Недостающие разделы:\n- ` + analysis.missing.join('\n- ') + '\n';
                }
                
                if (analysis.recommendations && analysis.recommendations.length > 0) {
                    resultText += `### Рекомендации:\n- ` + analysis.recommendations.join('\n- ') + '\n';
                }
                
                // Показываем результат в специальном модале с опциями
                const modal = new AIAnalysisResultModal(this.app, Modal, Setting, Notice, 'AI анализ и дополнение', resultText);
                const result = await modal.openAndGetValue();
                
                // Если пользователь выбрал вставку, добавляем результат в заметку
                if (result === 'insert') {
                    const editor = this.getActiveEditor();
                    if (editor) {
                        const cursor = editor.getCursor();
                        const insertText = '\n\n' + resultText + '\n';
                        editor.replaceRange(insertText, cursor);
                        this.logDebug('✅ Результат AI анализа вставлен в заметку');
                        await this.logDebug('Результат AI анализа вставлен в заметку');
                    } else {
                        this.logDebug(`[ERROR] Не удалось вставить результат: редактор недоступен`);
                    }
                }
                
            } catch (analysisError) {
                console.error('Ошибка при вызове analyzeContent:', analysisError);
                console.error('Стек ошибки:', analysisError.stack);
                
                // Показываем детальную ошибку
                let resultText = `# Ошибка AI анализа\n\n`;
                resultText += `## Тип сущности: ${contentType}\n`;
                resultText += `## Ошибка: ${analysisError.message}\n`;
                resultText += `## Детали:\n\`\`\`\n${analysisError.stack}\n\`\`\`\n`;
                
                const modal = new PromptModal(this.app, Modal, Setting, Notice, 'Ошибка AI анализа', resultText);
                modal.open();
            }
            
        } catch (e) {
            console.error('Ошибка AI анализа:', e);
            await this.logDebug('Ошибка AI анализа: ' + e.message);
        }
    }

    async aiBuildLoreContext() {
        try {
            const file = this.app.workspace.getActiveFile();
            if (!file) {
                await this.logDebug('Нет активного файла для AI сбора лора');
                return;
            }
            
             
            const content = await this.app.vault.read(file);
            
            // Определяем тип сущности по frontmatter или названию файла
            let contentType = '';
            const cache = this.app.metadataCache.getFileCache(file) || {};
            
            if (cache.frontmatter && cache.frontmatter.type) {
                contentType = String(cache.frontmatter.type).toLowerCase();
            } else {
                // Пробуем по названию файла (используем вспомогательную функцию)
                contentType = this.getContentTypeByName(file.basename);
            }
            
            if (!contentType) {
                await this.logDebug('Не удалось определить тип сущности для сбора лора. Добавьте frontmatter с полем "type" или используйте название файла с ключевыми словами.');
                return;
            }
            
            // Проверяем доступность AI сервиса
            if (!window.loreAnalyzerService) {
                console.warn('AI сервис анализа не инициализирован, показываем базовую информацию');
                
                // Fallback: показываем базовую информацию о типе сущности
                let resultText = `# Лор-контекст для ${contentType}\n\n`;
                resultText += `## Файл: ${file.basename}\n`;
                resultText += `## Тип: ${contentType}\n`;
                resultText += `## Путь: ${file.path}\n\n`;
                
                // Добавляем рекомендации по типу
                const recommendations = this.getRecommendationsForType(contentType);
                if (recommendations.length > 0) {
                    resultText += `### Рекомендуемые разделы:\n`;
                    recommendations.forEach(rec => {
                        resultText += `- ${rec}\n`;
                    });
                }
                
                resultText += `\n> [!note] AI сервис недоступен\n> Для полного AI анализа добавьте API ключи в настройках плагина.`;
                
                // Показываем результат в модальном окне
                const modal = new PromptModal(this.app, Modal, Setting, Notice, 'Лор-контекст', resultText);
                modal.open();
                return;
            }
            
            // AI сервис доступен - выполняем полный анализ
            const projectRoot = findProjectRoot(this.app, file.parent.path) || '';
            const context = await window.loreAnalyzerService.gatherLoreContext(projectRoot, contentType);
            
            let resultText = `# Лор-контекст для ${contentType}\n`;
            resultText += '```json\n' + JSON.stringify(context, null, 2) + '\n```';
            
            // Показываем результат в модальном окне
            const modal = new PromptModal(this.app, Modal, Setting, Notice, 'AI сбор лор-контекста', resultText);
            modal.open();
            
        } catch (e) {
            console.error('Ошибка AI сбора лора:', e);
            await this.logDebug('Ошибка AI сбора лора: ' + e.message);
        }
    }

    // === ЛОР: ДОЛГАЯ КОМАНДА — полная пересборка сводного файла ===
    async aiGatherProjectLore() {
        const activeFile = this.app.workspace.getActiveFile();
        const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
        const projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
        if (!projectRoot) {
            this.logDebug(`[ERROR] Проект не найден: отсутствует "Настройки_мира.md"`);
            return;
        }

        // Папка и путь к сводному файлу
        const loreDir = `${projectRoot}/Лор-контекст`;
        const loreFilePath = `${loreDir}/Лор_проекта.md`;

        // Собираем контекст через сервис, если доступен
        let context = null;
        try {
            if (window.loreAnalyzerService && typeof window.loreAnalyzerService.gatherLoreContext === 'function') {
                context = await window.loreAnalyzerService.gatherLoreContext(projectRoot, 'all');
            }
        } catch (e) {
            await this.logDebug('gatherLoreContext error: ' + e.message);
        }

        // Формируем разделы с безопасными фолбэками
        const summaryText = (context && context.summary) ? String(context.summary) : '—';
        const contradictions = (context && Array.isArray(context.contradictions)) ? context.contradictions : [];
        const gaps = (context && Array.isArray(context.gaps)) ? context.gaps : [];
        const recommendations = (context && Array.isArray(context.recommendations)) ? context.recommendations : [];
        const byTypes = (context && context.byTypes) ? context.byTypes : {};
        const byNotes = (context && context.byNotes) ? context.byNotes : {};

        // Строим Markdown
        const parts = [];
        parts.push('# Лор проекта');
        parts.push('');

        // Диагностика базы фактов: Неопределённые сущности
        try {
            const diag = await computeFactsDiagnostics(this.app, projectRoot).run();
            parts.push('## Неопределённые сущности');
            if (diag.missingIds && diag.missingIds.length > 0) {
                diag.missingIds.forEach(id => parts.push(`- ${id} — нет собственного факта (добавьте базовую запись с типом и именем)`));
            } else {
                parts.push('—');
            }
            parts.push('');
        } catch {}
        parts.push('## Сводка');
        parts.push(summaryText || '—');
        parts.push('');
        parts.push('## Противоречия');
        if (contradictions.length > 0) {
            contradictions.forEach((c) => parts.push(`- ${String(c)}`));
        } else {
            parts.push('—');
        }
        parts.push('');
        parts.push('## Пробелы');
        if (gaps.length > 0) {
            gaps.forEach((g) => parts.push(`- ${String(g)}`));
        } else {
            parts.push('—');
        }
        parts.push('');
        parts.push('## Рекомендации');
        if (recommendations.length > 0) {
            recommendations.forEach((r) => parts.push(`- ${String(r)}`));
        } else {
            parts.push('—');
        }
        parts.push('');
        parts.push('## По типам сущностей');
        if (byTypes && typeof byTypes === 'object' && Object.keys(byTypes).length > 0) {
            for (const t of Object.keys(byTypes)) {
                const items = byTypes[t];
                parts.push(`### ${t}`);
                if (Array.isArray(items) && items.length > 0) {
                    items.forEach((i) => parts.push(`- ${typeof i === 'string' ? i : JSON.stringify(i)}`));
                } else {
                    parts.push('- —');
                }
                parts.push('');
            }
        } else {
            parts.push('—');
            parts.push('');
        }
        parts.push('## По заметкам');
        if (byNotes && typeof byNotes === 'object' && Object.keys(byNotes).length > 0) {
            for (const notePath of Object.keys(byNotes)) {
                const base = notePath.split('/').pop().replace(/\.md$/i, '');
                parts.push(`### ${base} ([[${notePath}|${base}]])`);
                const info = byNotes[notePath];
                if (info && typeof info === 'object') {
                    const lines = Object.keys(info).map((k) => `- ${k}: ${typeof info[k] === 'string' ? info[k] : JSON.stringify(info[k])}`);
                    parts.push(...lines);
                } else {
                    parts.push('- —');
                }
                parts.push('');
            }
        } else {
            parts.push('—');
            parts.push('');
        }

        // Контекст для ИИ в JSON
        parts.push('## Контекст для ИИ');
        parts.push('```json');
        try {
            parts.push(JSON.stringify(context || {}, null, 2));
        } catch {
            parts.push('{}');
        }
        parts.push('```');
        parts.push('');

        const finalMd = parts.join('\n');

        // Создаем папку и пишем файл
        try {
            const folder = this.app.vault.getAbstractFileByPath(loreDir);
            if (!folder) {
                await this.app.vault.createFolder(loreDir);
            }
        } catch {}

        try {
            const existing = this.app.vault.getAbstractFileByPath(loreFilePath);
            if (existing instanceof TFile) {
                await this.app.vault.modify(existing, finalMd);
            } else {
                await this.app.vault.create(loreFilePath, finalMd);
            }
            this.logDebug('Лор-проект обновлён: ' + loreFilePath);
        } catch (e) {
            this.logDebug('Ошибка записи лора: ' + e.message);
        }
    }

    // Получает список доступных промптов через adapter (как в креаторах)
    async getPromptFiles() {
        try {
            const promptDir = '.obsidian/plugins/literary-templates/templates/prompts';
            const adapter = this.app.vault.adapter;
            const exists = await adapter.exists(promptDir);
            if (!exists) {
                console.log('[PROMPT DEBUG] promptDir не найден (adapter.exists):', promptDir);
                return [];
            }
            let fileNames = [];
            if (adapter.list) {
                const listResult = await adapter.list(promptDir);
                fileNames = listResult.files.filter(f => f.endsWith('.md'));
            } else {
                try {
                    const fs = require('fs');
                    fileNames = fs.readdirSync(promptDir)
                        .filter(f => f.endsWith('.md'))
                        .map(f => promptDir + '/' + f);
                } catch (e) {
                    console.log('[PROMPT DEBUG] Не удалось получить список файлов через fs:', e.message);
                    return [];
                }
            }
            // Возвращаем массив {name, path}
            const files = fileNames.map(path => {
                const name = path.split('/').pop().replace(/\.md$/, '');
                return { name, path };
            });
            console.log('[PROMPT DEBUG] Найдено промптов (adapter):', files.length, files.map(f => f.name));
            return files;
        } catch (e) {
            console.error('Ошибка получения промптов (adapter):', e);
            return [];
        }
    }

    // Показывает вертикальный список промптов с предпросмотром и тегами (PromptSelectorModal)
    async showPromptSelector() {
        try {
            const promptFiles = await this.getPromptFiles();
            if (promptFiles.length === 0) {
                this.logDebug(`[ERROR] Промпты не найдены в папке .obsidian/plugins/literary-templates/templates/prompts`);
                return;
            }
            // Читаем и парсим все промпты
            const prompts = [];
            for (const file of promptFiles) {
                const raw = await this.app.vault.adapter.read(file.path);
                const { tags, content } = this.parsePromptYaml(raw);
                prompts.push({
                    title: tags.title || file.name,
                    tags,
                    content,
                    fileName: file.name
                });
            }
            // Открываем новый модал
            const modal = new PromptSelectorModal(this.app, prompts, async (selectedPrompt) => {
                // Получаем переменные для подстановки
                let content = selectedPrompt.content;
                const file = this.app.workspace.getActiveFile();

                // Определяем проект
                const parentPath = file && file.parent ? file.parent.path : '';
                let projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
                if (!projectRoot) {
                    try {
                        const roots = await getAllProjectRoots(this.app);
                        if (roots && roots.length > 0) projectRoot = roots[0];
                    } catch {}
                }
                const projectName = projectRoot ? projectRoot.split('/').pop() : (file?.basename || '');
                const projectType = '';
                const currentDate = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));

                // Источник контента: текущая заметка, база фактов, или оба
                let injectedContent = '';
                try {
                    const src = (selectedPrompt.tags && selectedPrompt.tags.source) || 'current_note';
                    if (src === 'facts_database') {
                        const facts = projectRoot ? await loadFacts(this.app, projectRoot) : [];
                        injectedContent = JSON.stringify(Array.isArray(facts) ? facts : [], null, 2);
                    } else if (src === 'facts_and_note') {
                        const facts = projectRoot ? await loadFacts(this.app, projectRoot) : [];
                        const note = file ? await this.app.vault.read(file) : '';
                        injectedContent = JSON.stringify({ facts: Array.isArray(facts) ? facts : [], note }, null, 2);
                    } else {
                        injectedContent = file ? await this.app.vault.read(file) : '';
                    }
                } catch (e) {
                     
                    injectedContent = '';
                }

                // Подстановка переменных
                content = content.replace(/{{content}}/g, injectedContent)
                    .replace(/{{projectName}}/g, projectName)
                    .replace(/{{projectType}}/g, projectType)
                    .replace(/{{currentDate}}/g, currentDate);

                // Копирование с fallback
                let copied = false;
                if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                        await navigator.clipboard.writeText(content);
                        this.logDebug('Промпт скопирован в буфер обмена! (clipboard.writeText)');
                        copied = true;
                    } catch (e) {
                        this.logDebug('Ошибка clipboard.writeText, fallback: ' + e.message);
                    }
                }
                if (!copied) {
                    try {
                        const textArea = document.createElement('textarea');
                        textArea.value = content;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        this.logDebug('Промпт скопирован в буфер обмена! (execCommand)');
                    } catch (e) {
                        this.logDebug('Ошибка копирования через execCommand: ' + e.message);
                    }
                }
            });
            modal.open();
        } catch (e) {
            console.error('Ошибка в showPromptSelector:', e);
            this.logDebug('Ошибка при выборе промпта: ' + e.message);
        }
    }

    // Парсит YAML-теги из начала промпта (--- ... ---) и возвращает {tags, content}
    parsePromptYaml(raw) {
        const yamlMatch = raw.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
        if (!yamlMatch) return { tags: {}, content: raw };
        const yaml = yamlMatch[1];
        const content = yamlMatch[2].trim();
        const tags = {};
        yaml.split(/\r?\n/).forEach(line => {
            const m = line.match(/^([\w-]+):\s*(.*)$/);
            if (m) {
                const key = m[1].trim();
                let value = m[2].trim();
                // Снимаем обрамляющие кавычки
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
                    value = value.slice(1, -1);
                }
                tags[key] = value;
            }
        });
        return { tags, content };
    }

    // === ЛОР: БЫСТРАЯ КОМАНДА — добавить информацию из текущей заметки ===
    async aiAppendCurrentNoteLore() {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile)) {
            this.logDebug(`[ERROR] Нет активного файла`);
            return;
        }

        const parentPath = file.parent ? file.parent.path : '';
        const projectRoot = findProjectRoot(this.app, parentPath) || this.activeProjectRoot || '';
        if (!projectRoot) {
            this.logDebug(`[ERROR] Проект не найден: отсутствует "Настройки_мира.md"`);
            return;
        }

        const loreDir = `${projectRoot}/Лор-контекст`;
        const loreFilePath = `${loreDir}/Лор_проекта.md`;

        // Обеспечиваем наличие папки
        try {
            const folder = this.app.vault.getAbstractFileByPath(loreDir);
            if (!folder) await this.app.vault.createFolder(loreDir);
        } catch {}

        // Получаем содержимое заметки и лёгкий анализ
        const content = await this.app.vault.read(file);
        let contentType = '';
        try {
            const cache = this.app.metadataCache.getFileCache(file) || {};
            if (cache.frontmatter && cache.frontmatter.type) {
                contentType = String(cache.frontmatter.type).toLowerCase();
            }
        } catch {}

        let quickSummary = '';
        try {
            if (window.loreAnalyzerService && typeof window.loreAnalyzerService.analyzeContent === 'function') {
                const analysis = await window.loreAnalyzerService.analyzeContent(content, contentType || 'unknown', projectRoot);
                if (analysis && analysis.summary) quickSummary = String(analysis.summary);
            }
        } catch {}

        const base = file.basename;
        const noteSection = [];
        noteSection.push(`### ${base} ([[${file.path}|${base}]])`);
        if (contentType) noteSection.push(`- Тип: ${contentType}`);
        noteSection.push(`- Кратко: ${quickSummary || '—'}`);
        noteSection.push('');

        const newNoteBlock = noteSection.join('\n');

        // Если файла ещё нет — создаём скелет и вставляем блок
        const existing = this.app.vault.getAbstractFileByPath(loreFilePath);
        if (!(existing instanceof TFile)) {
            const skeleton = [
                '# Лор проекта',
                '',
                '## Сводка',
                '—',
                '',
                '## Противоречия',
                '—',
                '',
                '## Пробелы',
                '—',
                '',
                '## Рекомендации',
                '—',
                '',
                '## По типам сущностей',
                '—',
                '',
                '## По заметкам',
                newNoteBlock,
                '## Контекст для ИИ',
                '```json',
                '{}',
                '```',
                ''
            ].join('\n');
            try {
                await this.app.vault.create(loreFilePath, skeleton);
                this.logDebug('Создан сводный файл лора и добавлена текущая заметка');
            } catch (e) {
                this.logDebug('Ошибка создания файла лора: ' + e.message);
            }
            return;
        }

        // Иначе модифицируем существующий: добавляем блок в секцию "## По заметкам"
        let md = await this.app.vault.read(existing);
        const sectionHeader = '## По заметкам';
        const idx = md.indexOf(sectionHeader);
        if (idx === -1) {
            // Нет секции — добавим её в конец
            md = md.trimEnd() + `\n\n${sectionHeader}\n${newNoteBlock}`;
        } else {
            // Вставляем после заголовка секции
            const head = md.slice(0, idx + sectionHeader.length);
            const tail = md.slice(idx + sectionHeader.length);
            md = head + '\n' + newNoteBlock + tail;
        }

        try {
            await this.app.vault.modify(existing, md);
            this.logDebug('Добавлен лор из текущей заметки в сводный файл');
        } catch (e) {
            this.logDebug('Ошибка обновления файла лора: ' + e.message);
        }
    }
    
    // Тест AI подключения
    async testAIConnection() {
        try {
            await this.logDebug('=== Тест AI подключения ===');
            
            // Собираем полную диагностику
            const diagnostics = {
                settings: {
                    aiEnabled: this.settings.aiEnabled || false,
                    aiKeys: this.settings.aiKeys ? this.settings.aiKeys.length : 0,
                    aiProvider: this.settings.aiProvider || 'не указан',
                    defaultModel: this.settings.defaultModel || 'не указана',
                    maxTokens: this.settings.maxTokens || 0,
                    temperature: this.settings.temperature || 0
                },
                services: {
                    keyRotationService: !!window.keyRotationService,
                    aiProviderService: !!window.aiProviderService,
                    AIProviderService: !!window.AIProviderService,
                    loreAnalyzerService: !!window.loreAnalyzerService
                },
                serviceTypes: {
                    aiProviderService: typeof window.aiProviderService,
                    AIProviderService: typeof window.AIProviderService
                },
                methods: {
                    generateText: window.aiProviderService ? typeof window.aiProviderService.generateText : 'недоступен',
                    sendRequest: window.aiProviderService ? typeof window.aiProviderService.sendRequest : 'недоступен'
                }
            };
            
            await this.logDebug('Диагностика собрана: ' + JSON.stringify(diagnostics, null, 2));
            
            // Проверяем настройки
            if (!this.settings.aiKeys || this.settings.aiKeys.length === 0) {
                await this.showDiagnostics('❌ AI ключи не настроены', diagnostics, 'Добавьте API ключи в "Управление AI ключами"');
                return;
            }
            
            if (!this.settings.aiEnabled) {
                await this.showDiagnostics('❌ AI отключен в настройках', diagnostics, 'Включите AI в настройках плагина');
                return;
            }
            
            // Проверяем доступность AI сервисов
            if (!window.aiProviderService) {
                await this.showDiagnostics('❌ AI сервис не инициализирован', diagnostics, 'Перезагрузите плагин или проверьте консоль на ошибки');
                return;
            }
            
            // Тестируем простой запрос
            try {
                const testPrompt = 'Скажи "Привет, мир!" на русском языке.';
                await this.logDebug(`Отправляем тестовый запрос: ${testPrompt}`);
                
                // Проверяем доступность метода generateText
                if (typeof window.aiProviderService.generateText !== 'function') {
                    await this.showDiagnostics('❌ AI сервис не имеет метода generateText', diagnostics, 'Проблема с инициализацией AI сервиса');
                    return;
                }
                
                const response = await window.aiProviderService.generateText(testPrompt, {
                    model: this.settings.defaultModel,
                    maxTokens: 100,
                    temperature: 0.7
                });
                
                if (response && response.text) {
                    this.logDebug(`AI ответ: ${response.text}`);
                    
                    // Показываем результат в модальном окне
                    const resultText = `# Тест AI подключения ✅\n\n` +
                        `## Запрос:\n${testPrompt}\n\n` +
                        `## Ответ:\n${response.text}\n\n` +
                        `## Настройки:\n` +
                        `- Провайдер: ${this.settings.aiProvider}\n` +
                        `- Модель: ${this.settings.defaultModel}\n` +
                        `- Ключей: ${this.settings.aiKeys.length}\n` +
                        `- Макс токенов: ${this.settings.maxTokens}\n` +
                        `- Температура: ${this.settings.temperature}`;
                    
                    const modal = new PromptModal(this.app, Modal, Setting, Notice, 'Тест AI подключения', resultText);
                    modal.open();
                } else {
                    await this.showDiagnostics('❌ AI ответ пустой или некорректный', diagnostics, 'Проблема с форматом ответа от AI сервиса');
                }
                
            } catch (aiError) {
                await this.logDebug(`Ошибка AI запроса: ${aiError.message}`);
                console.error('AI тест ошибка:', aiError);
                
                // Анализируем тип ошибки
                let errorType = 'Неизвестная ошибка';
                let errorAdvice = 'Проверьте консоль для деталей';
                
                if (aiError.message.includes('401') || aiError.message.includes('Unauthorized')) {
                    errorType = 'Ошибка авторизации (401)';
                    errorAdvice = 'API ключ неверный или истек. Обновите ключ в настройках.';
                } else if (aiError.message.includes('403') || aiError.message.includes('Forbidden')) {
                    errorType = 'Доступ запрещен (403)';
                    errorAdvice = 'API ключ не имеет доступа к выбранной модели. Проверьте права доступа.';
                } else if (aiError.message.includes('429') || aiError.message.includes('Rate limit')) {
                    errorType = 'Превышен лимит запросов (429)';
                    errorAdvice = 'Слишком много запросов. Подождите или используйте другой ключ.';
                } else if (aiError.message.includes('500') || aiError.message.includes('Internal server')) {
                    errorType = 'Ошибка сервера (500)';
                    errorAdvice = 'Проблема на стороне AI провайдера. Попробуйте позже.';
                } else if (aiError.message.includes('timeout') || aiError.message.includes('time out')) {
                    errorType = 'Таймаут соединения';
                    errorAdvice = 'Слишком долгий ответ. Проверьте интернет-соединение.';
                } else if (aiError.message.includes('network') || aiError.message.includes('fetch')) {
                    errorType = 'Ошибка сети';
                    errorAdvice = 'Проблема с интернет-соединением. Проверьте сеть.';
                }
                
                await this.showDiagnostics(`❌ ${errorType}`, diagnostics, errorAdvice);
            }
            
        } catch (e) {
            console.error('Ошибка теста AI:', e);
            this.logDebug('❌ Ошибка теста AI: ' + e.message);
            await this.logDebug('Ошибка теста AI: ' + e.message);
        }
    }
    
    // Показывает детальную диагностику
    async showDiagnostics(title, diagnostics, advice) {
        const diagnosticText = `# ${title}\n\n` +
            `## Статус сервисов:\n` +
            `- KeyRotationService: ${diagnostics.services.keyRotationService ? '✅' : '❌'}\n` +
            `- AIProviderService (класс): ${diagnostics.services.AIProviderService ? '✅' : '❌'}\n` +
            `- aiProviderService (экземпляр): ${diagnostics.services.aiProviderService ? '✅' : '❌'}\n` +
            `- LoreAnalyzerService: ${diagnostics.services.loreAnalyzerService ? '✅' : '❌'}\n\n` +
            `## Типы сервисов:\n` +
            `- aiProviderService: ${diagnostics.serviceTypes.aiProviderService}\n` +
            `- AIProviderService: ${diagnostics.serviceTypes.AIProviderService}\n\n` +
            `## Доступные методы:\n` +
            `- generateText: ${diagnostics.methods.generateText}\n` +
            `- sendRequest: ${diagnostics.methods.sendRequest}\n\n` +
            `## Настройки:\n` +
            `- AI включен: ${diagnostics.settings.aiEnabled ? '✅' : '❌'}\n` +
            `- Ключей: ${diagnostics.settings.aiKeys}\n` +
            `- Провайдер: ${diagnostics.settings.aiProvider}\n` +
            `- Модель: ${diagnostics.settings.defaultModel}\n` +
            `- Макс токенов: ${diagnostics.settings.maxTokens}\n` +
            `- Температура: ${diagnostics.settings.temperature}\n\n` +
            `## Рекомендации:\n` +
            `> ${advice}\n\n` +
            `## Возможные решения:\n` +
            `1. **Перезагрузите плагин** - часто решает проблемы инициализации\n` +
            `2. **Проверьте API ключи** - убедитесь, что ключи действительны\n` +
            `3. **Выберите другую модель** - некоторые модели могут быть недоступны\n` +
            `4. **Проверьте интернет** - убедитесь в стабильности соединения\n` +
            `5. **Посмотрите консоль** - там могут быть детальные ошибки`;
        
        const modal = new PromptModal(this.app, Modal, Setting, Notice, 'Диагностика AI сервиса', diagnosticText);
        modal.open();
    }
    
    // Вспомогательный метод для получения рекомендаций по типу сущности
    getRecommendationsForType(contentType) {
        const recommendations = {
            'castle': [
                'История и происхождение',
                'Архитектура и укрепления',
                'Гарнизон и защита',
                'Владельцы и правители',
                'Стратегическое значение',
                'Легенды и предания'
            ],
            'potion': [
                'Ингредиенты и рецепт',
                'Эффекты и применение',
                'Время действия',
                'Побочные эффекты',
                'Способ заваривания',
                'Хранение и срок годности'
            ],
            'artifact': [
                'Происхождение и история',
                'Магические свойства',
                'Владельцы и легенды',
                'Способ активации',
                'Ограничения и риски',
                'Местонахождение'
            ],
            'character': [
                'Внешность и описание',
                'Происхождение и биография',
                'Характер и мотивация',
                'Навыки и способности',
                'Отношения и связи',
                'Цели и планы'
            ],
            'location': [
                'Географическое положение',
                'Климат и природа',
                'Население и культура',
                'Экономика и ресурсы',
                'История и события',
                'Достопримечательности'
            ],
            'city': [
                'География и планировка',
                'Население и демография',
                'Экономика и торговля',
                'Политика и управление',
                'Культура и религия',
                'История и развитие'
            ],
            'village': [
                'Местоположение и окружение',
                'Население и быт',
                'Основные занятия',
                'Традиции и обычаи',
                'Связи с внешним миром',
                'Проблемы и нужды'
            ],
            'province': [
                'Границы и территория',
                'Административное деление',
                'Природные ресурсы',
                'Население и этнический состав',
                'Экономика и промышленность',
                'Культурные особенности'
            ],
            'state': [
                'Территория и границы',
                'Политическая система',
                'Экономика и ресурсы',
                'Население и народы',
                'Внешняя политика',
                'История и традиции'
            ],
            'spell': [
                'Магическая школа',
                'Компоненты и жесты',
                'Эффекты и применение',
                'Уровень сложности',
                'Ограничения и риски',
                'История создания'
            ],
            'alchemy': [
                'Ингредиенты и пропорции',
                'Процесс приготовления',
                'Условия и время',
                'Эффекты и применение',
                'Побочные эффекты',
                'Хранение и стабильность'
            ],
            'mine': [
                'Тип полезных ископаемых',
                'Глубина и протяженность',
                'Оборудование и технологии',
                'Рабочие и условия труда',
                'Производительность',
                'Безопасность и риски'
            ],
            'factory': [
                'Производимая продукция',
                'Технологии и оборудование',
                'Рабочие и специалисты',
                'Сырье и поставки',
                'Производительность',
                'Экология и безопасность'
            ],
            'farm': [
                'Выращиваемые культуры',
                'Площадь и планировка',
                'Технологии и оборудование',
                'Рабочие и специалисты',
                'Урожайность и сезоны',
                'Сбыт и экономика'
            ],
            'port': [
                'Географическое положение',
                'Глубина и гавани',
                'Инфраструктура и оборудование',
                'Торговые маршруты',
                'Население и услуги',
                'Безопасность и защита'
            ],
            'people': [
                'Происхождение и история',
                'Культура и традиции',
                'Язык и письменность',
                'Социальная структура',
                'Религия и верования',
                'Отношения с другими народами'
            ],
            'monster': [
                'Внешний вид и размер',
                'Происхождение и среда обитания',
                'Поведение и повадки',
                'Способности и слабости',
                'Опасность и угроза',
                'Легенды и истории'
            ],
            'task': [
                'Описание и цель',
                'Приоритет и сложность',
                'Требования и ресурсы',
                'Сроки и этапы',
                'Ответственные лица',
                'Критерии выполнения'
            ]
        };
        
        return recommendations[contentType] || [
            'Описание и назначение',
            'История и происхождение',
            'Свойства и характеристики',
            'Применение и использование',
            'Связи и зависимости',
            'Дополнительная информация'
        ];
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
    // Гарантируем, что в модал уходит именно корень проекта
    let root = projectPath || '';
    try {
        const active = plugin.app.workspace.getActiveFile();
        const parentPath = projectPath || (active && active.parent ? active.parent.path : '');
        root = (typeof findProjectRoot === 'function' ? (findProjectRoot(plugin.app, parentPath) || '') : '') || plugin.activeProjectRoot || projectPath || '';
    } catch {}
    const modal = new OrganizationWizardModal(plugin.app, Modal, Setting, Notice, plugin, root, () => {}, options);
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

// === НАЧАЛО: Новый способ хранения настроек ===
const SETTINGS_PATH = '.obsidian/plugins/literary-templates/settings.json';

async function loadSettingsFromFile(app) {
    if (!app || !app.vault || !app.vault.adapter) {
        throw new Error('app.vault не инициализирован');
    }
    
    // Дефолтные настройки
        const defaultSettings = {
            aiKeys: [],
            currentKeyIndex: 0,
            keyUsage: {},
            aiEnabled: true,
        aiProvider: 'openrouter', // openrouter, anthropic, openai
        defaultModel: 'openrouter/mistralai/mistral-7b-instruct', // Бесплатная модель
            maxTokens: 2000,
            temperature: 0.7
        };
    
    try {
        const data = await app.vault.adapter.read(SETTINGS_PATH);
        return JSON.parse(data);
     
    } catch (e) {
        // Если файла нет — просто возвращаем дефолтные настройки
        // Не пытаемся создавать файл при первой загрузке, чтобы избежать ошибок
        console.log('Файл настроек не найден, используем дефолтные настройки');
        return defaultSettings;
    }
}

async function saveSettingsToFile(app, settings) {
    if (!app || !app.vault || !app.vault.adapter) {
        throw new Error('app.vault не инициализирован');
    }
    try {
    const data = JSON.stringify(settings, null, 2);
        
        // Проверяем, существует ли папка плагина
        const pluginDir = '.obsidian/plugins/literary-templates';
        try {
            // Пытаемся создать папку, если её нет
            await app.vault.adapter.mkdir(pluginDir);
        } catch (mkdirError) {
            // Игнорируем ошибку, если папка уже существует
            console.log('Папка плагина уже существует или не может быть создана:', mkdirError.message);
        }
        
    await app.vault.adapter.write(SETTINGS_PATH, data);
    } catch (error) {
        console.warn('Ошибка сохранения настроек плагина:', error);
        // Не выбрасываем ошибку, чтобы не ломать работу плагина
    }
}
// === КОНЕЦ: Новый способ хранения настроек ===

// === Добавить функцию открытия файла настроек ===
async function openSettingsFile(app) {
    const file = app.vault.getAbstractFileByPath(SETTINGS_PATH);
    if (file) {
        await app.workspace.getLeaf(true).openFile(file);
    } else {
        this.logDebug('Файл настроек не найден');
    }
}

// === Класс для управления AI ключами ===
class AIKeysManagerModal extends Modal {
    constructor(app, Modal, Setting, Notice, settings, onSave) {
        super(app);
        this.settings = settings;
        this.onSave = onSave;
        this.Modal = Modal;
        this.Setting = Setting;
        this.Notice = Notice;
    }
    
    onOpen() {
        const { contentEl } = this;
        this.contentEl = contentEl; // Сохраняем ссылку на contentEl
        contentEl.empty();
        contentEl.addClass('ai-keys-manager-modal');
        
        contentEl.createEl('h2', { text: 'Управление AI ключами' });
        
        // Информация о провайдерах
        const infoContainer = contentEl.createEl('div', { cls: 'info-container' });
        infoContainer.createEl('h3', { text: 'Информация о провайдерах:' });
        
        const providerInfo = infoContainer.createEl('div', { cls: 'provider-info' });
        providerInfo.innerHTML = `
            <p><strong>OpenRouter (рекомендуется):</strong></p>
            <ul>
                <li>✅ Бесплатные модели: Mistral 7B, Llama 2</li>
                <li>💰 Платные модели: Claude 3.5, GPT-4</li>
                <li>🔑 Получите ключ на <a href="https://openrouter.ai" target="_blank">openrouter.ai</a></li>
            </ul>
            <p><strong>Anthropic:</strong></p>
            <ul>
                <li>💰 Все модели платные</li>
                <li>🔑 Получите ключ на <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></li>
            </ul>
            <p><strong>OpenAI:</strong></p>
            <ul>
                <li>💰 Все модели платные</li>
                <li>🔑 Получите ключ на <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></li>
            </ul>
        `;
        
        // Список существующих ключей
        const keysContainer = contentEl.createEl('div', { cls: 'keys-container' });
        keysContainer.createEl('h3', { text: 'Текущие ключи:' });
        
        if (this.settings.aiKeys && this.settings.aiKeys.length > 0) {
            this.settings.aiKeys.forEach((key, index) => {
                const keyItem = keysContainer.createEl('div', { cls: 'key-item' });
                keyItem.createEl('span', { text: `Ключ ${index + 1}: ${key.substring(0, 8)}...` });
                
                const deleteBtn = keyItem.createEl('button', { text: 'Удалить', cls: 'delete-btn' });
                deleteBtn.onclick = () => {
                    this.settings.aiKeys.splice(index, 1);
                    this.renderKeys();
                };
            });
        } else {
            keysContainer.createEl('p', { text: 'Ключи не добавлены' });
        }
        
        // Форма добавления нового ключа
        const addForm = contentEl.createEl('div', { cls: 'add-key-form' });
        addForm.createEl('h3', { text: 'Добавить новый ключ:' });
        
        const keyInput = addForm.createEl('input', {
            type: 'password',
            placeholder: 'Введите AI ключ (API Key)',
            cls: 'key-input'
        });
        
        const addBtn = addForm.createEl('button', { text: 'Добавить ключ', cls: 'add-btn' });
        addBtn.onclick = () => {
            const key = keyInput.value.trim();
            if (key) {
                if (!this.settings.aiKeys) this.settings.aiKeys = [];
                this.settings.aiKeys.push(key);
                keyInput.value = '';
                this.renderKeys();
                new this.Notice('Ключ добавлен');
            } else {
                new this.Notice('Введите ключ');
            }
        };
        
        // Настройки AI
        const aiSettings = contentEl.createEl('div', { cls: 'ai-settings' });
        aiSettings.createEl('h3', { text: 'Настройки AI:' });
        
        new this.Setting(aiSettings)
            .setName('AI включен')
            .setDesc('Включить/выключить AI функциональность')
            .addToggle(toggle => toggle
                .setValue(this.settings.aiEnabled || false)
                .onChange(value => {
                    this.settings.aiEnabled = value;
                })
            );
        
        // Выбор провайдера AI
        new this.Setting(aiSettings)
            .setName('Провайдер AI')
            .setDesc('Выберите провайдера AI')
            .addDropdown(dropdown => dropdown
                .addOption('openrouter', 'OpenRouter (рекомендуется)')
                .addOption('anthropic', 'Anthropic Claude')
                .addOption('openai', 'OpenAI GPT')
                .setValue(this.settings.aiProvider || 'openrouter')
                .onChange(value => {
                    this.settings.aiProvider = value;
                    // Обновляем список моделей в зависимости от провайдера
                    this.updateModelList(value);
                })
            );
        
        // Список моделей (зависит от выбранного провайдера)
        const modelSetting = new this.Setting(aiSettings)
            .setName('Модель AI')
            .setDesc('Выберите модель AI для использования');
        
        this.createModelDropdown(modelSetting, this.settings.aiProvider || 'openrouter');
        
        new this.Setting(aiSettings)
            .setName('Максимум токенов')
            .setDesc('Максимальное количество токенов в ответе')
            .addSlider(slider => slider
                .setLimits(100, 4000, 100)
                .setValue(this.settings.maxTokens || 2000)
                .setDynamicTooltip()
                .onChange(value => {
                    this.settings.maxTokens = value;
                })
            );
        
        new this.Setting(aiSettings)
            .setName('Температура')
            .setDesc('Креативность ответов (0.0 - 1.0)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.settings.temperature || 0.7)
                .setDynamicTooltip()
                .onChange(value => {
                    this.settings.temperature = value;
            })
        );
        
        // Кнопки управления
        const buttons = contentEl.createEl('div', { cls: 'modal-buttons' });
        
        const saveBtn = buttons.createEl('button', { text: 'Сохранить', cls: 'save-btn' });
        saveBtn.onclick = () => {
            this.onSave(this.settings);
            this.close();
        };
        
        const cancelBtn = buttons.createEl('button', { text: 'Отмена', cls: 'cancel-btn' });
        cancelBtn.onclick = () => this.close();
        
        // Метод для обновления списка ключей
        this.renderKeys = () => {
            const keysContainer = contentEl.querySelector('.keys-container');
            if (keysContainer) {
                keysContainer.empty();
                keysContainer.createEl('h3', { text: 'Текущие ключи:' });
                
                if (this.settings.aiKeys && this.settings.aiKeys.length > 0) {
                    this.settings.aiKeys.forEach((key, index) => {
                        const keyItem = keysContainer.createEl('div', { cls: 'key-item' });
                        keyItem.createEl('span', { text: `Ключ ${index + 1}: ${key.substring(0, 8)}...` });
                        
                        const deleteBtn = keyItem.createEl('button', { text: 'Удалить', cls: 'delete-btn' });
                        deleteBtn.onclick = () => {
                            this.settings.aiKeys.splice(index, 1);
                            this.renderKeys();
                        };
                    });
                } else {
                    keysContainer.createEl('p', { text: 'Ключи не добавлены' });
                }
            }
        };
    }
    
    // Метод для создания выпадающего списка моделей
    createModelDropdown(setting, provider) {
        const models = this.getModelsForProvider(provider);
        setting.addDropdown(dropdown => {
            models.forEach(model => {
                dropdown.addOption(model.value, model.label);
            });
            dropdown.setValue(this.settings.defaultModel || models[0].value);
            dropdown.onChange(value => {
                this.settings.defaultModel = value;
            });
        });
    }
    
    // Метод для получения списка моделей по провайдеру
    getModelsForProvider(provider) {
        switch (provider) {
            case 'openrouter':
                return [
                    { value: 'openrouter/mistralai/mistral-7b-instruct', label: 'Mistral 7B (бесплатно)' },
                    { value: 'openrouter/meta-llama/llama-2-7b-chat', label: 'Llama 2 7B (бесплатно)' },
                    { value: 'openrouter/meta-llama/llama-2-13b-chat', label: 'Llama 2 13B (бесплатно)' },
                    { value: 'openrouter/anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (платно)' },
                    { value: 'openrouter/openai/gpt-4', label: 'GPT-4 (платно)' },
                    { value: 'openrouter/openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo (платно)' }
                ];
            case 'anthropic':
                return [
                    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (платно)' },
                    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (платно)' },
                    { value: 'anthropic/claude-2.1', label: 'Claude 2.1 (платно)' }
                ];
            case 'openai':
                return [
                    { value: 'openai/gpt-4', label: 'GPT-4 (платно)' },
                    { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo (платно)' },
                    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo (платно)' }
                ];
            default:
                return [
                    { value: 'openrouter/mistralai/mistral-7b-instruct', label: 'Mistral 7B (бесплатно)' }
                ];
        }
    }
    
    // Метод для обновления списка моделей
    updateModelList(provider) {
        const modelSetting = this.contentEl.querySelector('.ai-settings .setting-item:has(.setting-item-name:contains("Модель AI"))');
        if (modelSetting) {
            modelSetting.remove();
        }
        
        const newModelSetting = new this.Setting(this.contentEl.querySelector('.ai-settings'))
            .setName('Модель AI')
            .setDesc('Выберите модель AI для использования');
        
        this.createModelDropdown(newModelSetting, provider);
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Модальное окно выбора промпта: вертикальный список, предпросмотр, копирование
class PromptSelectorModal extends HtmlWizardModal {
    constructor(app, prompts, onSelect) {
        super(app);
        this.prompts = prompts;
        this.onSelect = onSelect;
    }

    onOpen() {
        this.applyBaseStyles();
        this.render();
    }

    render() {
        this.contentEl.empty();
        this.contentEl.addClass('lt-wizard');
        this.contentEl.createEl('h2', { text: 'Выберите промпт', cls: 'lt-modal-title' });
        const list = this.contentEl.createEl('div', { cls: 'lt-prompt-list' });
        // В начало списка добавить специальный пункт
        const importItem = list.createEl('div', {
            cls: 'lt-prompt-item lt-prompt-import',
            text: '🡇 Импортировать факты из буфера',
            title: 'Вставить факты из буфера обмена в базу проекта'
        });
        importItem.onclick = () => {
            try {
                // Важно: вызываем команду сразу в обработчике клика (user gesture)
                this.app.commands.executeCommandById('literary-templates:import-facts-from-clipboard');
            } catch (err) {
                if (this.app && this.app.logDebug) this.app.logDebug('Ошибка вызова команды импорта: ' + err.message);
            } finally {
                // Закрываем модал после запуска команды
                this.close();
            }
        };
        // Визуальный разделитель
        list.createEl('div', { cls: 'lt-prompt-separator' });
        // Далее — обычные промпты
        this.prompts.forEach((prompt, idx) => {
             
            const item = list.createEl('div', {
                cls: 'lt-prompt-item',
                text: prompt.tags.title,
                title: prompt.tags.description || ''
            });
            item.onclick = () => {
                if (this.onSelect) this.onSelect(prompt);
                this.close();
            };
        });
        // ... добавить стили для .lt-prompt-import и .lt-prompt-separator ...
    }
}

// Fallback AI сервис для случаев, когда основной недоступен
class FallbackAIProviderService {
    constructor(pluginContext) {
        this.plugin = pluginContext;
        // console.log('⚠️ FallbackAIProviderService создан');
    }
    
    async generateText(prompt) {
        // console.log('⚠️ FallbackAIProviderService.generateText вызван:', prompt.substring(0, 50) + '...');
        return {
            text: `[FALLBACK] Запрос: ${prompt}\n\nЭто fallback ответ, так как основной AI сервис недоступен.`,
            success: false,
            fallback: true
        };
    }
}

module.exports = LiteraryTemplatesPlugin; 


