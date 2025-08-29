/**
 * Утилиты для логирования
 * @module logUtils
 */

// Уровни логирования
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Текущий уровень логирования (по умолчанию DEBUG)
let currentLogLevel = LOG_LEVELS.DEBUG;

// Префиксы для разных уровней
const LOG_PREFIXES = {
    [LOG_LEVELS.DEBUG]: '🔍',
    [LOG_LEVELS.INFO]: 'ℹ️',
    [LOG_LEVELS.WARN]: '⚠️',
    [LOG_LEVELS.ERROR]: '❌'
};

/**
 * Устанавливает уровень логирования
 * @param {string|number} level - уровень логирования ('debug', 'info', 'warn', 'error' или число)
 */
function setLogLevel(level) {
    if (typeof level === 'string') {
        const upperLevel = level.toUpperCase();
        if (LOG_LEVELS.hasOwnProperty(upperLevel)) {
            currentLogLevel = LOG_LEVELS[upperLevel];
        }
    } else if (typeof level === 'number' && level >= 0 && level <= 3) {
        currentLogLevel = level;
    }
}

/**
 * Получает текущий уровень логирования
 * @returns {number} - текущий уровень логирования
 */
function getLogLevel() {
    return currentLogLevel;
}

/**
 * Проверяет, нужно ли логировать сообщение данного уровня
 * @param {number} level - уровень сообщения
 * @returns {boolean} - true если нужно логировать
 */
function shouldLog(level) {
    return level >= currentLogLevel;
}

/**
 * Форматирует сообщение для логирования
 * @param {string} message - сообщение
 * @param {string} context - контекст (опционально)
 * @param {number} level - уровень логирования
 * @returns {string} - отформатированное сообщение
 */
function formatMessage(message, context = '', level = LOG_LEVELS.INFO) {
    const prefix = LOG_PREFIXES[level] || '';
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    
    return `${prefix} ${timestamp}${contextStr}: ${message}`;
}

/**
 * Логирует debug сообщение
 * @param {string} message - сообщение
 * @param {string} context - контекст (опционально)
 * @param {Object} data - дополнительные данные (опционально)
 */
function debug(message, context = '', data = null) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    
    const formattedMessage = formatMessage(message, context, LOG_LEVELS.DEBUG);
    console.log(formattedMessage);
    
    if (data !== null) {
        console.log('📊 Данные:', data);
    }
}

/**
 * Логирует info сообщение
 * @param {string} message - сообщение
 * @param {string} context - контекст (опционально)
 * @param {Object} data - дополнительные данные (опционально)
 */
function info(message, context = '', data = null) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const formattedMessage = formatMessage(message, context, LOG_LEVELS.INFO);
    console.log(formattedMessage);
    
    if (data !== null) {
        console.log('📊 Данные:', data);
    }
}

/**
 * Логирует warning сообщение
 * @param {string} message - сообщение
 * @param {string} context - контекст (опционально)
 * @param {Object} data - дополнительные данные (опционально)
 */
function warn(message, context = '', data = null) {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    
    const formattedMessage = formatMessage(message, context, LOG_LEVELS.WARN);
    console.warn(formattedMessage);
    
    if (data !== null) {
        console.warn('📊 Данные:', data);
    }
}

/**
 * Логирует error сообщение
 * @param {string} message - сообщение
 * @param {string} context - контекст (опционально)
 * @param {Error|Object} error - объект ошибки или дополнительные данные (опционально)
 */
function error(message, context = '', error = null) {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    
    const formattedMessage = formatMessage(message, context, LOG_LEVELS.ERROR);
    console.error(formattedMessage);
    
    if (error instanceof Error) {
        console.error('🚨 Ошибка:', error.message);
        console.error('📍 Стек:', error.stack);
    } else if (error !== null) {
        console.error('📊 Данные:', error);
    }
}

/**
 * Логирует группу связанных сообщений
 * @param {string} groupName - название группы
 * @param {Function} callback - функция с логированием
 */
function group(groupName, callback) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    console.group(`📁 ${groupName}`);
    try {
        callback();
    } finally {
        console.groupEnd();
    }
}

/**
 * Логирует группу связанных сообщений (сворачиваемая)
 * @param {string} groupName - название группы
 * @param {Function} callback - функция с логированием
 */
function groupCollapsed(groupName, callback) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    console.groupCollapsed(`📁 ${groupName}`);
    try {
        callback();
    } finally {
        console.groupEnd();
    }
}

/**
 * Логирует таблицу данных
 * @param {Array|Object} data - данные для таблицы
 * @param {string} context - контекст (опционально)
 */
function table(data, context = '') {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    
    const contextStr = context ? ` [${context}]` : '';
    console.log(`📊 Таблица${contextStr}:`);
    console.table(data);
}

/**
 * Логирует время выполнения функции
 * @param {string} label - метка для времени
 * @param {Function} fn - функция для измерения
 * @param {string} context - контекст (опционально)
 * @returns {Promise<any>} - результат выполнения функции
 */
async function time(label, fn, context = '') {
    if (!shouldLog(LOG_LEVELS.DEBUG)) {
        return await fn();
    }
    
    const contextStr = context ? ` [${context}]` : '';
    const fullLabel = `⏱️ ${label}${contextStr}`;
    
    console.time(fullLabel);
    try {
        const result = await fn();
        return result;
    } finally {
        console.timeEnd(fullLabel);
    }
}

/**
 * Логирует время выполнения синхронной функции
 * @param {string} label - метка для времени
 * @param {Function} fn - функция для измерения
 * @param {string} context - контекст (опционально)
 * @returns {any} - результат выполнения функции
 */
function timeSync(label, fn, context = '') {
    if (!shouldLog(LOG_LEVELS.DEBUG)) {
        return fn();
    }
    
    const contextStr = context ? ` [${context}]` : '';
    const fullLabel = `⏱️ ${label}${contextStr}`;
    
    console.time(fullLabel);
    try {
        const result = fn();
        return result;
    } finally {
        console.timeEnd(fullLabel);
    }
}

/**
 * Создаёт логгер для конкретного контекста
 * @param {string} context - контекст логгера
 * @returns {Object} - объект с методами логирования для данного контекста
 */
function createLogger(context) {
    return {
        debug: (message, data = null) => debug(message, context, data),
        info: (message, data = null) => info(message, context, data),
        warn: (message, data = null) => warn(message, context, data),
        error: (message, error = null) => error(message, context, error),
        group: (groupName, callback) => group(groupName, callback),
        groupCollapsed: (groupName, callback) => groupCollapsed(groupName, callback),
        table: (data) => table(data, context),
        time: (label, fn) => time(label, fn, context),
        timeSync: (label, fn) => timeSync(label, fn, context)
    };
}

// Экспортируем функции в глобальную область видимости для совместимости с текущей сборкой
if (typeof window !== 'undefined') {
    window.logUtils = {
        setLogLevel,
        getLogLevel,
        debug,
        info,
        warn,
        error,
        group,
        groupCollapsed,
        table,
        time,
        timeSync,
        createLogger,
        LOG_LEVELS
    };
}

// Node.js экспорты убраны для совместимости с build.php
