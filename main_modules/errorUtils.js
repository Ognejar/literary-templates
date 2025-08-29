/**
 * Утилиты для обработки ошибок
 * @module errorUtils
 */

/**
 * Оборачивает асинхронную функцию в обработчик ошибок
 * @param {Function} fn - асинхронная функция для выполнения
 * @param {Function} onError - функция обработки ошибок
 * @param {string} context - контекст выполнения (опционально)
 * @returns {Promise<any>} - результат выполнения функции
 */
async function wrapAsync(fn, onError, context = '') {
    try {
        return await fn();
    } catch (error) {
        if (onError) {
            onError(error, context);
        } else {
            console.error(`❌ Ошибка в ${context || 'функции'}:`, error);
        }
        throw error;
    }
}

/**
 * Оборачивает синхронную функцию в обработчик ошибок
 * @param {Function} fn - синхронная функция для выполнения
 * @param {Function} onError - функция обработки ошибок
 * @param {string} context - контекст выполнения (опционально)
 * @returns {any} - результат выполнения функции
 */
function wrapSync(fn, onError, context = '') {
    try {
        return fn();
    } catch (error) {
        if (onError) {
            onError(error, context);
        } else {
            console.error(`❌ Ошибка в ${context || 'функции'}:`, error);
        }
        throw error;
    }
}

/**
 * Создаёт пользовательскую ошибку с контекстом
 * @param {string} message - сообщение об ошибке
 * @param {string} context - контекст ошибки
 * @param {Error} cause - причина ошибки (опционально)
 * @returns {Error} - объект ошибки
 */
function createContextError(message, context, cause = null) {
    const error = new Error(`${context ? `[${context}] ` : ''}${message}`);
    if (cause) {
        error.cause = cause;
    }
    return error;
}

/**
 * Проверяет, является ли объект ошибкой
 * @param {any} obj - объект для проверки
 * @returns {boolean} - true если объект является ошибкой
 */
function isError(obj) {
    return obj instanceof Error || (obj && typeof obj.message === 'string');
}

/**
 * Получает полное сообщение об ошибке включая причину
 * @param {Error} error - объект ошибки
 * @returns {string} - полное сообщение об ошибке
 */
function getFullErrorMessage(error) {
    if (!isError(error)) {
        return String(error);
    }
    
    let message = error.message;
    
    if (error.cause) {
        const causeMessage = getFullErrorMessage(error.cause);
        message += `\nПричина: ${causeMessage}`;
    }
    
    if (error.stack) {
        message += `\nСтек: ${error.stack}`;
    }
    
    return message;
}

/**
 * Логирует ошибку с подробной информацией
 * @param {Error|string} error - ошибка или сообщение об ошибке
 * @param {string} context - контекст ошибки (опционально)
 * @param {Object} additionalData - дополнительные данные (опционально)
 */
function logError(error, context = '', additionalData = null) {
    const contextStr = context ? ` [${context}]` : '';
    
    if (isError(error)) {
        console.error(`❌ Ошибка${contextStr}:`, error.message);
        if (error.stack) {
            console.error('📍 Стек вызовов:', error.stack);
        }
        if (error.cause) {
            console.error('🔗 Причина:', error.cause);
        }
    } else {
        console.error(`❌ Ошибка${contextStr}:`, error);
    }
    
    if (additionalData) {
        console.error('📊 Дополнительные данные:', additionalData);
    }
}

/**
 * Создаёт обработчик ошибок по умолчанию
 * @param {string} context - контекст обработчика
 * @returns {Function} - функция обработки ошибок
 */
function createDefaultErrorHandler(context) {
    return (error, errorContext = '') => {
        const fullContext = errorContext ? `${context}:${errorContext}` : context;
        logError(error, fullContext);
    };
}

/**
 * Повторяет выполнение функции при ошибке
 * @param {Function} fn - функция для выполнения
 * @param {number} maxRetries - максимальное количество попыток
 * @param {number} delay - задержка между попытками в миллисекундах
 * @param {Function} onRetry - функция вызываемая при повторной попытке (опционально)
 * @returns {Promise<any>} - результат выполнения функции
 */
async function retryOnError(fn, maxRetries = 3, delay = 1000, onRetry = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(error, attempt, maxRetries);
                }
                
                console.warn(`⚠️ Попытка ${attempt}/${maxRetries} не удалась, повторяем через ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Создаёт функцию с автоматическим повторением при ошибке
 * @param {Function} fn - функция для выполнения
 * @param {Object} options - опции повторения
 * @param {number} options.maxRetries - максимальное количество попыток
 * @param {number} options.delay - задержка между попытками
 * @param {Function} options.onRetry - функция вызываемая при повторной попытке
 * @returns {Function} - функция с автоматическим повторением
 */
function createRetryFunction(fn, options = {}) {
    const { maxRetries = 3, delay = 1000, onRetry = null } = options;
    
    return async (...args) => {
        return await retryOnError(
            () => fn(...args),
            maxRetries,
            delay,
            onRetry
        );
    };
}

/**
 * Обрабатывает ошибки в Promise.all с продолжением выполнения
 * @param {Promise[]} promises - массив промисов
 * @param {Function} onError - функция обработки ошибок
 * @returns {Promise<Array>} - массив результатов (ошибки заменены на null)
 */
async function handlePromiseAllErrors(promises, onError) {
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            if (onError) {
                onError(result.reason, index);
            }
            return null;
        }
    });
}

/**
 * Создаёт безопасную версию функции
 * @param {Function} fn - исходная функция
 * @param {any} defaultValue - значение по умолчанию при ошибке
 * @param {Function} onError - функция обработки ошибок (опционально)
 * @returns {Function} - безопасная версия функции
 */
function createSafeFunction(fn, defaultValue = null, onError = null) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (onError) {
                onError(error, args);
            }
            return defaultValue;
        }
    };
}

// Экспортируем функции в глобальную область видимости для совместимости с текущей сборкой
if (typeof window !== 'undefined') {
    window.errorUtils = {
        wrapAsync,
        wrapSync,
        createContextError,
        isError,
        getFullErrorMessage,
        logError,
        createDefaultErrorHandler,
        retryOnError,
        createRetryFunction,
        handlePromiseAllErrors,
        createSafeFunction
    };
}

// Node.js экспорты убраны для совместимости с build.php
