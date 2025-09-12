/**
 * @file       TemplateManager.js
 * @description Менеджер шаблонов для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, Handlebars
 * @created    2025-01-27
 * @updated    2025-01-27
 * @docs       docs/project.md
 */

class TemplateManager {
    constructor(plugin) {
        this.plugin = plugin;
        this.handlebars = window.Handlebars;
    }

    _augmentData(data) {
        const d = { ...(data || {}) };
        // statusLabel
        if (typeof d.status === 'string') {
            const map = {
                'действует': '✅ Действует',
                'заброшено': '🏚️ Заброшено',
                'разрушено': '💥 Разрушено'
            };
            d.statusLabel = map[d.status] || d.status;
        }
        // provinceSection/stateSection
        d.provinceSection = d.province ? `**Провинция:** ${d.province}` : '';
        d.stateSection = d.state ? `**Государство:** ${d.state}` : '';
        // featuresSection
        if (Array.isArray(d.features) && d.features.length > 0) {
            d.featuresSection = d.features.map(f => `- ${f}`).join('\n');
        } else if (typeof d.features === 'string' && d.features.trim()) {
            d.featuresSection = d.features
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean)
                .map(s => `- ${s}`)
                .join('\n');
        } else {
            d.featuresSection = '';
        }
        return d;
    }

    /**
     * Генерирует контент из шаблона
     */
    async generateFromTemplate(templateName, data, plugin) {
        try {
            const templateContent = await this.readTemplateFile(templateName, plugin);
            if (!templateContent) {
                throw new Error(`Шаблон ${templateName} не найден`);
            }

            // 1) Препроцессинг include-директив до компиляции
            const withIncludes = await this._processIncludes(templateContent, plugin);
            // 2) Подготовка вычисляемых секций
            const augmented = this._augmentData(data);

            if (this.handlebars && typeof this.handlebars.compile === 'function') {
                const template = this.handlebars.compile(withIncludes);
                return template(augmented);
            }
            // Фолбэк: простой рендер без Handlebars
            let content = this._processConditionals(withIncludes, augmented);
            content = this._replacePlaceholders(content, augmented);
            return content;
        } catch (error) {
            console.error(`Ошибка генерации шаблона ${templateName}:`, error);
            throw error;
        }
    }

    /**
     * Читает файл шаблона
     */
    async readTemplateFile(templateName, plugin) {
        try {
            const adapter = plugin.app.vault.adapter;
            const pluginTemplatePath = `.obsidian/plugins/literary-templates/templates/${templateName}.md`;
            const exists = await adapter.exists(pluginTemplatePath);
            if (exists) {
                return await adapter.read(pluginTemplatePath);
            }
            console.warn(`Шаблон не найден: ${pluginTemplatePath}`);
            try {
                const vaultName = typeof plugin?.app?.vault?.getName === 'function' ? plugin.app.vault.getName() : 'unknown-vault';
                const folderPath = `.obsidian/plugins/literary-templates/templates`;
                const folderInfo = await adapter.list(folderPath).catch(() => null);
                const filesInFolder = folderInfo && Array.isArray(folderInfo.files)
                    ? folderInfo.files.map(p => p.split('/').pop()).join(', ')
                    : '(папка не найдена или пуста)';
                console.info('[TemplateManager] Диагностика промаха шаблона:', {
                    vaultName,
                    requestedTemplateName: templateName,
                    searchedPath: pluginTemplatePath,
                    folderPath,
                    folderExists: Boolean(folderInfo),
                    filesInFolder
                });
            } catch (diagErr) {
                console.info('[TemplateManager] Не удалось выполнить диагностику отсутствующего шаблона:', diagErr);
            }
            return null;
        } catch (error) {
            console.error(`Ошибка чтения шаблона ${templateName}:`, error);
            return null;
        }
    }

    /**
     * Заполняет шаблон данными
     */
    async fillTemplate(template, data) {
        try {
            const augmented = this._augmentData(data);
            if (this.handlebars && typeof this.handlebars.compile === 'function') {
                const templateFunc = this.handlebars.compile(template);
                return templateFunc(augmented);
            }
            // Фолбэк без Handlebars
            let content = this._processConditionals(template, augmented);
            content = this._replacePlaceholders(content, augmented);
            return content;
        } catch (error) {
            console.error('Ошибка заполнения шаблона:', error);
            return template;
        }
    }

    _processConditionals(content, data) {
        const regex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
        return content.replace(regex, (_m, rawCond, block) => {
            const condition = String(rawCond).trim();
            // Поддержка формата: key == value
            const eqMatch = condition.match(/^(\S+)\s*==\s*(\S+)$/);
            if (eqMatch) {
                const leftKey = eqMatch[1];
                let rightVal = eqMatch[2];
                rightVal = rightVal.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
                const leftVal = Object.prototype.hasOwnProperty.call(data, leftKey) ? String(data[leftKey]) : '';
                return leftVal === rightVal ? block : '';
            }
            // Базовый формат: {{#if key}}
            const key = condition;
            const value = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
            const truthy = value !== undefined && value !== null && value !== '';
            return truthy ? block : '';
        });
    }

    async _processIncludes(content, plugin) {
        try {
            const includeRegex = /{{include:([^}]+)}}/g;
            const adapter = plugin.app.vault.adapter;
            const tasks = [];
            const placeholders = [];
            let match;
            while ((match = includeRegex.exec(content)) !== null) {
                const rawPath = match[1].trim();
                placeholders.push(match[0]);
                tasks.push((async () => {
                    try {
                        let path = rawPath;
                        // Поддержка укороченного пути sections/...
                        if (!path.toLowerCase().endsWith('.md')) path += '.md';
                        if (path.startsWith('sections/')) {
                            path = `.obsidian/plugins/literary-templates/templates/${path}`;
                        } else if (!path.startsWith('.obsidian/')) {
                            // относительный к папке templates
                            path = `.obsidian/plugins/literary-templates/templates/${path}`;
                        }
                        const exists = await adapter.exists(path);
                        if (!exists) {
                            console.warn(`[TemplateManager] include не найден: ${path}`);
                            return `<!-- include not found: ${rawPath} -->`;
                        }
                        return await adapter.read(path);
                    } catch (e) {
                        console.error('[TemplateManager] Ошибка include', rawPath, e);
                        return `<!-- include error: ${rawPath} -->`;
                    }
                })());
            }
            if (tasks.length === 0) return content;
            const parts = await Promise.all(tasks);
            let result = content;
            for (let i = 0; i < placeholders.length; i++) {
                result = result.replace(placeholders[i], parts[i]);
            }
            return result;
        } catch (e) {
            console.error('[TemplateManager] _processIncludes error:', e);
            return content;
        }
    }

    _replacePlaceholders(content, data) {
        let result = content;
        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
            const re = new RegExp('\\{\\{' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\}\\}', 'g');
            result = result.replace(re, String(data[key]));
        }
        return result;
    }

    /**
     * Создает файл из шаблона
     */
    async createFileFromTemplate(templateName, data, filePath, plugin) {
        try {
            const content = await this.generateFromTemplate(templateName, data, plugin);
            await plugin.app.vault.create(filePath, content);
            return true;
        } catch (error) {
            console.error(`Ошибка создания файла из шаблона ${templateName}:`, error);
            return false;
        }
    }

    /**
     * Получает список доступных шаблонов
     */
    async getAvailableTemplates(plugin) {
        try {
            const adapter = plugin.app.vault.adapter;
            const folderPath = '.obsidian/plugins/literary-templates/templates';
            const list = await adapter.list(folderPath);
            if (!list || !Array.isArray(list.files)) {
                return [];
            }
            return list.files
                .filter(p => p.toLowerCase().endsWith('.md'))
                .map(p => p.split('/').pop().replace(/\.md$/i, ''));
        } catch (error) {
            console.error('Ошибка получения списка шаблонов:', error);
            return [];
        }
    }

    /**
     * Проверяет существование шаблона
     */
    async templateExists(templateName, plugin) {
        try {
            const adapter = plugin.app.vault.adapter;
            const templatePath = `.obsidian/plugins/literary-templates/templates/${templateName}.md`;
            return await adapter.exists(templatePath);
        } catch (error) {
            console.error(`Ошибка проверки существования шаблона ${templateName}:`, error);
            return false;
        }
    }

    /**
     * Получает метаданные шаблона
     */
    async getTemplateMetadata(templateName, plugin) {
        try {
            const templateContent = await this.readTemplateFile(templateName, plugin);
            if (!templateContent) {
                return null;
            }

            // Извлекаем метаданные из YAML frontmatter
            const yamlMatch = templateContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
            if (!yamlMatch) {
                return {};
            }

            const yamlContent = yamlMatch[1];
            const metadata = {};
            
            yamlContent.split('\n').forEach(line => {
                const match = line.match(/^([^:]+):\s*(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();
                    
                    // Обрабатываем массивы
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
                    }
                    // Обрабатываем строки в кавычках
                    else if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    metadata[key] = value;
                }
            });

            return metadata;
        } catch (error) {
            console.error(`Ошибка получения метаданных шаблона ${templateName}:`, error);
            return {};
        }
    }

    /**
     * Валидирует данные для шаблона
     */
    validateTemplateData(templateName, data) {
        // Базовая валидация - можно расширить для конкретных шаблонов
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Данные должны быть объектом' };
        }

        // Проверяем обязательные поля
        const requiredFields = this.getRequiredFields(templateName);
        for (const field of requiredFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                return { valid: false, error: `Поле '${field}' обязательно для заполнения` };
            }
        }

        return { valid: true };
    }

    /**
     * Получает список обязательных полей для шаблона
     */
    getRequiredFields(templateName) {
        const requiredFields = {
            'Новый_город': ['name'],
            'Новая_деревня': ['name'],
            'Новое_государство': ['name'],
            'Новая_провинция': ['name'],
            'Новый_замок': ['name'],
            'Новый_порт': ['name'],
            'Новый_порт_scifi': ['name'],
            'Новая_ферма': ['name'],
            'Новая_шахта': ['name'],
            'Новая_шахта_scifi': ['name'],
            'Новый_завод': ['name'],
            'Новый_персонаж': ['name'],
            'Новый_монстр': ['name'],
            'Новый_народ': ['name'],
            'Новая_организация': ['name'],
            'Новая_религия': ['name'],
            'Новый_культ': ['name'],
            'Новая_фракция': ['name'],
            'Новый_квест': ['name'],
            'Новое_событие': ['name'],
            'Новый_конфликт': ['name'],
            'Новая_сцена': ['name'],
            'Новая_глава': ['name'],
            'Новая_задача': ['name'],
            'Новое_заклинание': ['name'],
            'Новое_зелье': ['name'],
            'Новый_артефакт': ['name'],
            'Новый_алхимический_рецепт': ['name'],
            'Новый_торговый_путь': ['name'],
            'Новое_произведение': ['name'],
            'Новая_локация': ['name'],
            'Новая_локация_scifi': ['name'],
            'Новая_мертвая_зона': ['name'],
            'Новый_социальный_объект': ['name']
        };

        return requiredFields[templateName] || ['name'];
    }

    /**
     * Создает превью шаблона
     */
    async createTemplatePreview(templateName, data, plugin) {
        try {
            const content = await this.generateFromTemplate(templateName, data, plugin);
            
            // Обрезаем контент для превью
            const maxLength = 500;
            const preview = content.length > maxLength 
                ? content.substring(0, maxLength) + '...' 
                : content;
            
            return preview;
        } catch (error) {
            console.error(`Ошибка создания превью шаблона ${templateName}:`, error);
            return 'Ошибка создания превью';
        }
    }

    /**
     * Обрабатывает специальные теги в шаблонах
     */
    processSpecialTags(content, data) {
        // Обрабатываем тег {{imageBlock}}
        if (content.includes('{{imageBlock}}')) {
            const imageBlock = this.generateImageBlock(data);
            content = content.replace(/\{\{imageBlock\}\}/g, imageBlock);
        }

        // Обрабатываем тег {{date}}
        if (content.includes('{{date}}')) {
            const date = new Date().toISOString().split('T')[0];
            content = content.replace(/\{\{date\}\}/g, date);
        }

        // Обрабатываем тег {{timestamp}}
        if (content.includes('{{timestamp}}')) {
            const timestamp = new Date().toISOString();
            content = content.replace(/\{\{timestamp\}\}/g, timestamp);
        }

        return content;
    }

    /**
     * Генерирует блок изображения
     */
    generateImageBlock(data) {
        if (!data.project || !data.entityType) {
            return '';
        }

        const imagePath = this.findTagImage(data.project, data.entityType);
        if (!imagePath) {
            return '';
        }

        return `![${data.entityType}](images/${imagePath})`;
    }

    /**
     * Находит изображение по тегу
     */
    findTagImage(project, entityType) {
        // Логика поиска изображения по тегу
        // Можно расширить для поддержки различных типов изображений
        const tagImages = {
            'Город': 'city.png',
            'Деревня': 'village.png',
            'Государство': 'state.png',
            'Провинция': 'province.png',
            'Замок': 'castle.png',
            'Порт': 'port.png',
            'Ферма': 'farm.png',
            'Шахта': 'mine.png',
            'Завод': 'factory.png',
            'Персонаж': 'character.png',
            'Монстр': 'monster.png',
            'Народ': 'people.png',
            'Организация': 'organization.png',
            'Религия': 'religion.png',
            'Культ': 'cult.png',
            'Фракция': 'faction.png',
            'Квест': 'quest.png',
            'Событие': 'event.png',
            'Конфликт': 'conflict.png',
            'Сцена': 'scene.png',
            'Глава': 'chapter.png',
            'Задача': 'task.png',
            'Заклинание': 'spell.png',
            'Зелье': 'potion.png',
            'Артефакт': 'artifact.png',
            'Алхимический рецепт': 'alchemy.png',
            'Торговый путь': 'trade.png',
            'Произведение': 'work.png',
            'Локация': 'location.png',
            'Мёртвая зона': 'deadzone.png',
            'Социальное учреждение': 'institution.png'
        };

        return tagImages[entityType] || 'default.png';
    }
}

// Экспортируем класс
module.exports = { TemplateManager };

// Глобализируем для использования в main.js
if (typeof window !== 'undefined') {
    window.TemplateManager = TemplateManager;
    // Упрощённый глобальный хелпер для генерации из шаблона
    if (typeof window.generateFromTemplate !== 'function') {
        window.generateFromTemplate = async function(templateName, data, plugin) {
            try {
                const manager = new TemplateManager(plugin);
                return await manager.generateFromTemplate(templateName, data, plugin);
            } catch (e) {
                console.error('window.generateFromTemplate error:', e);
                throw e;
            }
        };
    }
}
