/**
 * Утилиты для работы с YAML и frontmatter
 * @module yamlUtils
 */

/**
 * Парсит YAML frontmatter из Markdown файла
 * @param {string} content - содержимое файла
 * @returns {{yaml: string, content: string, parsed: Object}} - объект с YAML, контентом и распарсенными данными
 */
function parseYamlFrontmatter(content) {
    const yamlMatch = content.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
    if (!yamlMatch) {
        return {
            yaml: '',
            content: content.trim(),
            parsed: {}
        };
    }
    
    const yaml = yamlMatch[1];
    const contentWithoutYaml = yamlMatch[2].trim();
    const parsed = parseSimpleYaml(yaml);
    
    return {
        yaml: yaml,
        content: contentWithoutYaml,
        parsed: parsed
    };
}

/**
 * Парсит простой YAML (только key: value)
 * @param {string} yaml - YAML строка
 * @returns {Object} - объект с ключами и значениями
 */
function parseSimpleYaml(yaml) {
    const result = {};
    const lines = yaml.split(/\r?\n/);
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Убираем кавычки если есть
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith('\'') && value.endsWith('\''))) {
                value = value.slice(1, -1);
            }
            
            result[key] = value;
        }
    }
    
    return result;
}

/**
 * Извлекает значение поля из frontmatter
 * @param {string} content - содержимое файла
 * @param {string} fieldName - название поля
 * @param {string} defaultValue - значение по умолчанию
 * @returns {string} - значение поля или defaultValue
 */
function extractFrontmatterField(content, fieldName, defaultValue = '') {
    try {
        const { parsed } = parseYamlFrontmatter(content);
        return parsed[fieldName] || defaultValue;
    } catch (error) {
        console.warn(`Ошибка извлечения поля ${fieldName}:`, error);
        return defaultValue;
    }
}

/**
 * Извлекает несколько полей из frontmatter
 * @param {string} content - содержимое файла
 * @param {string[]} fieldNames - массив названий полей
 * @returns {Object} - объект с полями и их значениями
 */
function extractFrontmatterFields(content, fieldNames) {
    try {
        const { parsed } = parseYamlFrontmatter(content);
        const result = {};
        
        for (const fieldName of fieldNames) {
            result[fieldName] = parsed[fieldName] || '';
        }
        
        return result;
    } catch (error) {
        console.warn('Ошибка извлечения полей frontmatter:', error);
        return fieldNames.reduce((acc, field) => {
            acc[field] = '';
            return acc;
        }, {});
    }
}

/**
 * Генерирует YAML frontmatter из объекта
 * @param {Object} data - объект с данными
 * @param {number} indent - отступ (по умолчанию 2)
 * @returns {string} - YAML строка
 */
function generateYamlFrontmatter(data, indent = 2) {
    if (!data || typeof data !== 'object') return '';
    
    const lines = [];
    const indentStr = ' '.repeat(indent);
    
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        
        if (typeof value === 'string') {
            // Если строка содержит спецсимволы, заключаем в кавычки
            if (value.includes(':') || value.includes('"') || value.includes('\'') || value.includes('\n')) {
                lines.push(`${indentStr}${key}: "${value.replace(/"/g, '\\"')}"`);
            } else {
                lines.push(`${indentStr}${key}: ${value}`);
            }
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                lines.push(`${indentStr}${key}: []`);
            } else {
                lines.push(`${indentStr}${key}:`);
                for (const item of value) {
                    lines.push(`${indentStr}  - ${item}`);
                }
            }
        } else if (typeof value === 'object') {
            lines.push(`${indentStr}${key}:`);
            const subYaml = generateYamlFrontmatter(value, indent + 2);
            if (subYaml) {
                lines.push(subYaml);
            }
        } else {
            lines.push(`${indentStr}${key}: ${value}`);
        }
    }
    
    return lines.join('\n');
}

/**
 * Проверяет, содержит ли файл frontmatter
 * @param {string} content - содержимое файла
 * @returns {boolean} - true если есть frontmatter
 */
function hasFrontmatter(content) {
    return /^---\s*[\s\S]*?---/.test(content);
}

/**
 * Добавляет или обновляет поле в frontmatter
 * @param {string} content - содержимое файла
 * @param {string} fieldName - название поля
 * @param {string} fieldValue - значение поля
 * @returns {string} - обновлённое содержимое
 */
function updateFrontmatterField(content, fieldName, fieldValue) {
    try {
        const { yaml, content: contentWithoutYaml, parsed } = parseYamlFrontmatter(content);
        
        if (yaml) {
            // Обновляем существующий frontmatter
            parsed[fieldName] = fieldValue;
            const newYaml = generateYamlFrontmatter(parsed);
            return `---\n${newYaml}\n---\n\n${contentWithoutYaml}`;
        } else {
            // Создаём новый frontmatter
            const newYaml = generateYamlFrontmatter({ [fieldName]: fieldValue });
            return `---\n${newYaml}\n---\n\n${content}`;
        }
    } catch (error) {
        console.warn(`Ошибка обновления поля ${fieldName}:`, error);
        return content;
    }
}

// Экспортируем функции в глобальную область видимости для совместимости с текущей сборкой
if (typeof window !== 'undefined') {
    window.yamlUtils = {
        parseYamlFrontmatter,
        parseSimpleYaml,
        extractFrontmatterField,
        extractFrontmatterFields,
        generateYamlFrontmatter,
        hasFrontmatter,
        updateFrontmatterField
    };
}

// Node.js экспорты убраны для совместимости с build.php
