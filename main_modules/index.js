/**
 * Главный файл для экспорта всех утилит
 * @module main_modules
 */

// Импортируем все модули утилит
// Примечание: в реальной сборке эти импорты будут заменены на содержимое файлов

// Экспортируем все утилиты в глобальную область видимости
if (typeof window !== 'undefined') {
    // Создаём основной объект для всех утилит
    window.utils = {};
    
    // Добавляем все модули утилит
    if (window.yamlUtils) {
        Object.assign(window.utils, window.yamlUtils);
    }
    
    if (window.fileUtils) {
        Object.assign(window.utils, window.fileUtils);
    }
    
    if (window.logUtils) {
        Object.assign(window.utils, window.logUtils);
    }
    
    if (window.errorUtils) {
        Object.assign(window.utils, window.errorUtils);
    }
    
    // Также экспортируем отдельные модули для обратной совместимости
    window.yamlUtils = window.yamlUtils || {};
    window.fileUtils = window.fileUtils || {};
    window.logUtils = window.logUtils || {};
    window.errorUtils = window.errorUtils || {};
    
    console.log('🔧 Утилиты загружены в window.utils');
    console.log('📦 Доступные модули:', Object.keys(window.utils).filter(key => !key.startsWith('_')));
}

// Node.js экспорты убраны для совместимости с build.php
