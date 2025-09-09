/**
 * @file       FileUtils.js
 * @description Утилиты работы с файлами: безопасное создание файла и др.
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (App)
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

// Безопасное создание файла: не перезаписывает существующий, возвращает TFile или null
async function safeCreateFile(filePath, content, app) {
    try {
        const existingFile = app.vault.getAbstractFileByPath(filePath);
        if (existingFile) {
            console.warn(`[DEBUG] Файл уже существует: ${filePath}`);
            return null;
        }
        const newFile = await app.vault.create(filePath, content);
        console.log(`[DEBUG] Файл успешно создан: ${filePath}`);
        return newFile;
    } catch (error) {
        console.error(`[DEBUG] Ошибка создания файла ${filePath}: ${error.message}`);
        throw error;
    }
}

// Экспорт и глобализация
const FileUtils = { safeCreateFile };
if (typeof window !== 'undefined') {
    window.safeCreateFile = safeCreateFile; // для обратной совместимости существующих вызовов
    window.FileUtils = FileUtils;
}

module.exports = { FileUtils, safeCreateFile };


