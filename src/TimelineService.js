/**
 * @file       TimelineService.js
 * @description Сервис для управления временной шкалой и эпохами
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class TimelineService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    /**
     * Получить список существующих эпох
     * @returns {Promise<Array>} Массив объектов с информацией об эпохах
     */
    async getEpochs(projectRoot) {
        const { timelinePath } = this.getTimelinePaths(projectRoot);
        try {
            console.log('=== ДИАГНОСТИКА ПОИСКА ФАЙЛА *TIMELINE* ===');
            console.log('Project root:', projectRoot);
            console.log('Timeline path:', timelinePath);
            console.log('Full timeline path:', timelinePath);
            
            let file = this.plugin.app.vault.getAbstractFileByPath(timelinePath);
            
            console.log('File found by path:', file);
            console.log('File type:', file ? file.constructor.name : 'null');
            
            // Если файл не найден по пути, попробуем найти по имени
            if (!file) {
                console.log('File not found by path, trying to find by name...');
                const allFiles = this.plugin.app.vault.getFiles();
                console.log('Total files in vault:', allFiles.length);
                
                const timelineFiles = allFiles.filter(f => f.name === 'timeline.json');
                console.log('Found timeline files by name:', timelineFiles.length);
                
                // Показать все найденные файлы timeline.json
                timelineFiles.forEach((f, index) => {
                    console.log(`Timeline file ${index + 1}:`, f.path);
                });
                
                // Поиск всех файлов в папке .lore
                const loreFiles = allFiles.filter(f => f.path.includes('/_lore/') || f.path.includes('\\_lore\\'));
                console.log('Files in .lore folder:', loreFiles.length);
                loreFiles.forEach((f, index) => {
                    console.log(`Lore file ${index + 1}:`, f.path);
                });
                
                if (timelineFiles.length > 0) {
                    // Найдём файл в правильной папке
                    const correctFile = timelineFiles.find(f => {
                        const filePath = f.path;
                        const expectedPath = timelinePath;
                        console.log('Checking file:', filePath, 'against expected:', expectedPath);
                        console.log('File ends with _lore/timeline.json:', filePath.endsWith('/_lore/timeline.json'));
                        console.log('File ends with .lore\\timeline.json:', filePath.endsWith('\\.lore\\timeline.json'));
                        return filePath === expectedPath || filePath.endsWith('/_lore/timeline.json') || filePath.endsWith('\\.lore\\timeline.json');
                    });
                    
                    if (correctFile) {
                        file = correctFile;
                        console.log('Found correct timeline file:', file.path);
                    } else {
                        console.log('No correct timeline file found in .lore folder');
                    }
                }
                
                // Если всё ещё не найден, ищем по normalizedPath.endsWith('/_lore/timeline.json')
                if (!file) {
                    console.log('Trying to find by normalized path ending...');
                    const normalizedTarget = '/_lore/timeline.json';
                    const foundFile = allFiles.find(f => {
                        const normalizedPath = f.path.replace(/\\/g, '/').toLowerCase();
                        return normalizedPath.endsWith(normalizedTarget);
                    });
                    if (foundFile) {
                        file = foundFile;
                        console.log('Found timeline file by normalized path:', file.path);
                    } else {
                        console.log('Timeline file not found by normalized path');
                    }
                }
                
                // Если всё ещё не найден, попробуем найти по относительному пути
                if (!file) {
                    console.log('Trying to find by relative path _lore/timeline.json...');
                    const relativePath = '_lore/timeline.json';
                    file = this.plugin.app.vault.getAbstractFileByPath(relativePath);
                    if (file) {
                        console.log('Found file by relative path:', file.path);
                    } else {
                        console.log('File not found by relative path either');
                    }
                }
            }
            
            if (!file) {
                console.log('File not found, returning empty array:', timelinePath);
                console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
                return [];
            }

            try {
                const content = await this.plugin.app.vault.read(file);
                console.log('File content length:', content.length);
                const epochs = JSON.parse(content);
                console.log('Loaded epochs:', epochs.length);
                console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
                return Array.isArray(epochs) ? epochs : [];
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
                return [];
            }
        } catch (error) {
            console.error('Ошибка при получении эпох:', error);
            console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
            return [];
        }
    }

    /**
     * Сохранить список эпох
     * @param {Array} epochs Массив эпох для сохранения
     * @returns {Promise<Object>} Результат сохранения
     */
    async saveEpochs(epochs, projectRoot) {
        const { timelinePath } = this.getTimelinePaths(projectRoot);
        try {
            console.log('Saving epochs to:', timelinePath);
            
            // Ensure folder exists
            const { folder } = this.getTimelinePaths(projectRoot);
            if (!this.plugin.app.vault.getAbstractFileByPath(folder)) {
                await this.ensureTimelineFolder(projectRoot);
            }

            // Create or update file using proper Obsidian API
            const content = JSON.stringify(epochs, null, 2);
            
            try {
                // Try to create new file first
                await this.plugin.app.vault.create(timelinePath, content);
                console.log('Epochs saved successfully (created new file)');
                return { success: true };
            } catch (createError) {
                // If file already exists, try to modify it
                if (createError.message.includes('File already exists') || createError.message.includes('already exists')) {
                    console.log('File already exists, trying to update it...');
                    
                    // Wait a bit for file system to sync
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const existingFile = this.plugin.app.vault.getAbstractFileByPath(timelinePath);
                    if (existingFile) {
                        await this.plugin.app.vault.modify(existingFile, content);
                        console.log('Epochs saved successfully (updated existing file)');
                        return { success: true };
                    } else {
                        // File exists but we can't find it, try to create with different name
                        const timestamp = Date.now();
                        const newPath = `${timelinePath.replace('.json', '')}_${timestamp}.json`;
                        await this.plugin.app.vault.create(newPath, content);
                        console.log('Epochs saved successfully (new file with timestamp):', newPath);
                        return { success: true };
                    }
                } else {
                    throw createError;
                }
            }
            
        } catch (error) {
            console.error('Error saving epochs:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Сохранить отдельную эпоху
     * @param {Object} epochData Данные эпохи для сохранения
     * @returns {Promise<Object>} Результат сохранения
     */
    async saveEpoch(epochData, projectRoot) {
        try {
            const existingEpochs = await this.getEpochs(projectRoot);
            
            // Найти существующую эпоху или добавить новую
            const index = existingEpochs.findIndex(e => e.id === epochData.id);
            if (index !== -1) {
                existingEpochs[index] = { ...existingEpochs[index], ...epochData, updated: new Date().toISOString() };
            } else {
                existingEpochs.push({ ...epochData, updated: new Date().toISOString() });
            }
            
            return await this.saveEpochs(existingEpochs, projectRoot);
        } catch (error) {
            console.error('Error saving epoch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Обновить эпоху
     * @param {string} epochId - ID эпохи для обновления
     * @param {Object} epochData - Новые данные эпохи
     * @returns {Promise<Object>} Результат обновления
     */
    async updateEpoch(epochId, epochData, projectRoot) {
        try {
            const epochs = await this.getEpochs(projectRoot);
            const index = epochs.findIndex(e => e.id === epochId);
            
            if (index === -1) {
                return { success: false, error: 'Epoch not found' };
            }
            
            // Обновляем данные эпохи
            epochs[index] = { 
                ...epochs[index], 
                ...epochData, 
                updated: new Date().toISOString() 
            };
            
            console.log('Epoch updated:', epochs[index]);
            return await this.saveEpochs(epochs, projectRoot);
            
        } catch (error) {
            console.error('Error updating epoch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Создать новую эпоху
     * @param {Object} epochData Данные новой эпохи
     * @returns {Promise<Object>} Результат создания эпохи
     */
    async createEpoch(epochData, projectRoot) {
        const { timelinePath } = this.getTimelinePaths(projectRoot);
        console.log('Creating epoch in:', timelinePath);
        
        try {
            const existingEpochs = await this.getEpochs(projectRoot);
            
            // Создаем правильную структуру эпохи
            const newEpoch = {
                id: `epoch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: epochData.name,
                startYear: parseInt(epochData.startDate) || 0,
                endYear: parseInt(epochData.endDate) || 1000,
                description: epochData.description || '',
                active: false, // По умолчанию неактивная
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            
            const newEpochs = [...existingEpochs, newEpoch];
            
            // Ensure folder exists
            const { folder } = this.getTimelinePaths(projectRoot);
            if (!this.plugin.app.vault.getAbstractFileByPath(folder)) {
                await this.ensureTimelineFolder(projectRoot);
            }

            // Create or update file using proper Obsidian API
            const content = JSON.stringify(newEpochs, null, 2);
            
            // Check if file exists
            const existingFile = this.plugin.app.vault.getAbstractFileByPath(timelinePath);
            if (existingFile) {
                // Update existing file
                await this.plugin.app.vault.modify(existingFile, content);
            } else {
                // Create new file
                await this.plugin.app.vault.create(timelinePath, content);
            }

            console.log('Epoch created successfully:', newEpoch);
            return { success: true, epoch: newEpoch };
            
        } catch (error) {
            console.error('Error creating epoch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Получить активную эпоху
     * @returns {Promise<Object|null>} Активная эпоха или null
     */
    async getActiveEpoch(projectRoot) {
        const epochs = await this.getEpochs(projectRoot);
        return epochs.find(epoch => epoch.active) || null;
    }

    /**
     * Установить активную эпоху
     * @param {string} epochId - ID эпохи для активации
     * @returns {Promise<Object>} Результат операции
     */
    async setActiveEpoch(epochId, projectRoot) {
        try {
            const epochs = await this.getEpochs(projectRoot);
            
            // Сбрасываем активность у всех эпох
            epochs.forEach(epoch => {
                epoch.active = false;
                epoch.updated = new Date().toISOString();
            });
            
            // Устанавливаем активную эпоху
            const targetEpoch = epochs.find(epoch => epoch.id === epochId);
            if (targetEpoch) {
                targetEpoch.active = true;
                targetEpoch.updated = new Date().toISOString();
                console.log('Active epoch set to:', targetEpoch.name);
            } else {
                console.error('Epoch not found:', epochId);
                return { success: false, error: 'Epoch not found' };
            }
            
            // Сохраняем изменения
            return await this.saveEpochs(epochs, projectRoot);
            
        } catch (error) {
            console.error('Error setting active epoch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Сохранить временные контексты
     * @param {Array} contexts Массив временных контекстов
     * @returns {Promise<Object>} Результат сохранения
     */
    async saveTemporalContexts(contexts, projectRoot) {
        const contextPath = `${projectRoot}/_lore/temporal_contexts.json`;
        
        try {
            console.log('Saving temporal contexts to:', contextPath);
            
            // Ensure folder exists
            const { folder } = this.getTimelinePaths(projectRoot);
            if (!this.plugin.app.vault.getAbstractFileByPath(folder)) {
                await this.ensureTimelineFolder(projectRoot);
            }

            const content = JSON.stringify(contexts, null, 2);
            const existing = this.plugin.app.vault.getAbstractFileByPath(contextPath);
            if (existing) {
                await this.plugin.app.vault.modify(existing, content);
            } else {
                await this.plugin.app.vault.create(contextPath, content);
            }

            console.log('Temporal contexts saved successfully');
            return { success: true };
        } catch (error) {
            console.error('Error saving temporal contexts:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Получить временные контексты
     * @returns {Promise<Array>} Массив временных контекстов
     */
    async getTemporalContexts(projectRoot) {
        const contextPath = `${projectRoot}/_lore/temporal_contexts.json`;
        
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(contextPath);
            
            if (!file) {
                return [];
            }

            try {
                const content = await this.plugin.app.vault.read(file);
                return JSON.parse(content || '[]');
            } catch (parseError) {
                console.error('Failed to parse temporal contexts JSON:', parseError);
                return [];
            }
        } catch (error) {
            console.error('Error getting temporal contexts:', error);
            return [];
        }
    }

    /**
     * Получить путь к файлу временной шкалы для проекта
     * @param {string} projectRoot - Корневая директория проекта
     * @returns {Object} Объект с путями к файлам временной шкалы
     */
    getTimelinePaths(projectRoot) {
        const loreFolder = '_lore';
        const folder = `${projectRoot}/${loreFolder}`;
        const timelinePath = `${folder}/timeline.json`;
        return { folder, timelinePath };
    }

    /**
     * Убедиться, что папка временной шкалы существует
     * @param {string} projectRoot - Корневая директория проекта
     */
    async ensureTimelineFolder(projectRoot) {
        const { folder } = this.getTimelinePaths(projectRoot);
        const vault = this.plugin.app.vault;
        try {
            const existing = vault.getAbstractFileByPath(folder);
            if (!existing) {
                await vault.createFolder(folder);
            }
        } catch (error) {
            // Игнорируем все ошибки
            console.log('Папка уже существует или ошибка создания:', error.message);
        }
    }
}

module.exports = { TimelineService };
