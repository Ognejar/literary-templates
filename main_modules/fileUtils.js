/**
 * Утилиты для работы с файлами
 * @module fileUtils
 */

/**
 * Безопасно создаёт файл с автонумерацией имени
 * @param {string} filePath - путь к файлу
 * @param {string} content - содержимое файла
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<TFile|null>} - созданный файл или null если файл уже существует
 */
async function safeCreateFileWithNumbering(filePath, content, app) {
    try {
        // Если файл существует — автонумерация: Имя -> Имя_2, Имя_3, ...
        let finalPath = filePath;
        let existingFile = app.vault.getAbstractFileByPath(finalPath);
        
        if (existingFile) {
            // Разбираем путь на папку, базовое имя и расширение
            const lastSlashIndex = filePath.lastIndexOf('/');
            const lastDotIndex = filePath.lastIndexOf('.');
            
            if (lastSlashIndex === -1 || lastDotIndex === -1 || lastDotIndex < lastSlashIndex) {
                throw new Error(`Некорректный путь файла: ${filePath}`);
            }
            
            const folderPath = filePath.substring(0, lastSlashIndex);
            const baseName = filePath.substring(lastSlashIndex + 1, lastDotIndex);
            const extension = filePath.substring(lastDotIndex);
            
            // Ищем уникальное имя
            let attempt = 1;
            let candidate;
            do {
                attempt += 1;
                candidate = `${folderPath}/${baseName}_${attempt}${extension}`;
                existingFile = app.vault.getAbstractFileByPath(candidate);
            } while (existingFile);
            
            finalPath = candidate;
            console.warn(`[DEBUG] Файл уже существовал, используем имя: ${finalPath}`);
        }
        
        // Создаём файл с уникальным именем
        const newFile = await app.vault.create(finalPath, content);
        console.log(`[DEBUG] Файл успешно создан: ${finalPath}`);
        return newFile;
    } catch (error) {
        console.error(`[DEBUG] Ошибка создания файла ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Генерирует уникальное имя файла с автонумерацией
 * @param {string} baseName - базовое имя файла
 * @param {string} folderPath - путь к папке
 * @param {string} extension - расширение файла (без точки)
 * @param {App} app - экземпляр Obsidian App
 * @returns {string} - уникальное имя файла
 */
function generateUniqueFileName(baseName, folderPath, extension, app) {
    let fileName = baseName;
    let attempt = 1;
    
    while (app.vault.getAbstractFileByPath(`${folderPath}/${fileName}.${extension}`)) {
        attempt += 1;
        fileName = `${baseName}_${attempt}`;
    }
    
    return fileName;
}

/**
 * Проверяет существование файла
 * @param {string} filePath - путь к файлу
 * @param {App} app - экземпляр Obsidian App
 * @returns {boolean} - true если файл существует
 */
function fileExists(filePath, app) {
    return app.vault.getAbstractFileByPath(filePath) !== null;
}

/**
 * Проверяет существование папки
 * @param {string} folderPath - путь к папке
 * @param {App} app - экземпляр Obsidian App
 * @returns {boolean} - true если папка существует
 */
function folderExists(folderPath, app) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    return folder && folder.children !== undefined;
}

/**
 * Создаёт папку если она не существует
 * @param {string} folderPath - путь к папке
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<TFolder|null>} - созданная папка или существующая
 */
async function ensureFolder(folderPath, app) {
    try {
        let folder = app.vault.getAbstractFileByPath(folderPath);
        
        if (!folder) {
            folder = await app.vault.createFolder(folderPath);
            console.log(`[DEBUG] Папка создана: ${folderPath}`);
        }
        
        return folder;
    } catch (error) {
        console.error(`[DEBUG] Ошибка создания папки ${folderPath}:`, error);
        throw error;
    }
}

/**
 * Получает размер файла в байтах
 * @param {string} filePath - путь к файлу
 * @param {App} app - экземпляр Obsidian App
 * @returns {number} - размер файла в байтах или -1 если файл не найден
 */
function getFileSize(filePath, app) {
    try {
        const file = app.vault.getAbstractFileByPath(filePath);
        if (file && file.stat) {
            return file.stat.size;
        }
        return -1;
    } catch (error) {
        console.warn(`Ошибка получения размера файла ${filePath}:`, error);
        return -1;
    }
}

/**
 * Получает дату последнего изменения файла
 * @param {string} filePath - путь к файлу
 * @param {App} app - экземпляр Obsidian App
 * @returns {Date|null} - дата последнего изменения или null если файл не найден
 */
function getFileModifiedDate(filePath, app) {
    try {
        const file = app.vault.getAbstractFileByPath(filePath);
        if (file && file.stat) {
            return new Date(file.stat.mtime);
        }
        return null;
    } catch (error) {
        console.warn(`Ошибка получения даты изменения файла ${filePath}:`, error);
        return null;
    }
}

/**
 * Копирует файл с новым именем
 * @param {string} sourcePath - путь к исходному файлу
 * @param {string} targetPath - путь к целевому файлу
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<TFile|null>} - скопированный файл или null при ошибке
 */
async function copyFile(sourcePath, targetPath, app) {
    try {
        const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
        if (!sourceFile) {
            throw new Error(`Исходный файл не найден: ${sourcePath}`);
        }
        
        const content = await app.vault.read(sourceFile);
        return await safeCreateFile(targetPath, content, app);
    } catch (error) {
        console.error(`Ошибка копирования файла ${sourcePath} в ${targetPath}:`, error);
        return null;
    }
}

/**
 * Перемещает файл
 * @param {string} sourcePath - исходный путь
 * @param {string} targetPath - целевой путь
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<boolean>} - true если перемещение успешно
 */
async function moveFile(sourcePath, targetPath, app) {
    try {
        const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
        if (!sourceFile) {
            throw new Error(`Исходный файл не найден: ${sourcePath}`);
        }
        
        await app.vault.rename(sourceFile, targetPath);
        return true;
    } catch (error) {
        console.error(`Ошибка перемещения файла ${sourcePath} в ${targetPath}:`, error);
        return false;
    }
}

/**
 * Удаляет файл
 * @param {string} filePath - путь к файлу
 * @param {App} app - экземпляр Obsidian App
 * @returns {Promise<boolean>} - true если удаление успешно
 */
async function deleteFile(filePath, app) {
    try {
        const file = app.vault.getAbstractFileByPath(filePath);
        if (!file) {
            console.warn(`Файл для удаления не найден: ${filePath}`);
            return true; // Файл уже не существует
        }
        
        await app.vault.delete(file);
        return true;
    } catch (error) {
        console.error(`Ошибка удаления файла ${filePath}:`, error);
        return false;
    }
}

// Экспортируем функции в глобальную область видимости для совместимости с текущей сборкой
if (typeof window !== 'undefined') {
    window.fileUtils = {
        safeCreateFileWithNumbering,
        generateUniqueFileName,
        fileExists,
        folderExists,
        ensureFolder,
        getFileSize,
        getFileModifiedDate,
        copyFile,
        moveFile,
        deleteFile
    };
}

// Node.js экспорты убраны для совместимости с build.php
