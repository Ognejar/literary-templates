/**
 * @file       SettingsManager.js
 * @description Менеджер настроек для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js
 * @created    2025-01-27
 * @updated    2025-01-27
 * @docs       docs/project.md
 */

class SettingsManager {
    constructor(plugin) {
        this.plugin = plugin;
        this.defaultSettings = {
            aiEnabled: false,
            autoSave: true,
            templatePath: 'templates',
            imagePath: 'images',
            defaultAuthor: 'Автор',
            defaultWorld: 'Мир',
            showTooltips: true,
            enableNotifications: true,
            autoComplete: true,
            darkMode: false,
            language: 'ru',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm',
            maxFileSize: 1048576, // 1MB
            backupEnabled: true,
            backupInterval: 24, // hours
            lastBackup: null,
            customTemplates: [],
            favoriteEntities: [],
            recentProjects: [],
            uiSettings: {
                showSidebar: true,
                showStatusBar: true,
                showCommandPalette: true,
                showQuickAccess: true,
                showEntityButtons: true,
                showNavigationButtons: true,
                showProjectOverview: true,
                showTaskTracker: true,
                showChangelog: true
            },
            aiSettings: {
                provider: 'openai',
                apiKey: '',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 1000,
                systemPrompt: 'Ты помощник для создания литературных произведений и мира.',
                enableContext: true,
                contextLength: 5,
                enableMemory: true,
                memoryLength: 10
            },
            templateSettings: {
                autoGenerate: true,
                useHandlebars: true,
                enableValidation: true,
                showPreview: true,
                autoSave: true,
                backupTemplates: true,
                customFields: [],
                requiredFields: ['name'],
                optionalFields: ['description', 'tags', 'type']
            },
            projectSettings: {
                autoCreateFolders: true,
                autoCreateIndexFiles: true,
                useProjectTemplates: true,
                enableProjectBackup: true,
                projectBackupInterval: 7, // days
                maxProjectSize: 104857600, // 100MB
                enableProjectValidation: true,
                showProjectStats: true,
                enableProjectSharing: false
            }
        };
    }

    /**
     * Загружает настройки плагина
     */
    async loadSettings() {
        try {
            const data = await this.plugin.loadData();
            this.plugin.settings = { ...this.defaultSettings, ...data };
            return this.plugin.settings;
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            this.plugin.settings = { ...this.defaultSettings };
            return this.plugin.settings;
        }
    }

    /**
     * Сохраняет настройки плагина
     */
    async saveSettings(settings = null) {
        try {
            const settingsToSave = settings || this.plugin.settings;
            await this.plugin.saveData(settingsToSave);
            this.plugin.settings = settingsToSave;
            return true;
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
    }

    /**
     * Получает значение настройки
     */
    getSetting(key, defaultValue = null) {
        try {
            const keys = key.split('.');
            let value = this.plugin.settings;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return defaultValue;
                }
            }
            
            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.error(`Ошибка получения настройки ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Устанавливает значение настройки
     */
    async setSetting(key, value) {
        try {
            const keys = key.split('.');
            let target = this.plugin.settings;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!target[k] || typeof target[k] !== 'object') {
                    target[k] = {};
                }
                target = target[k];
            }
            
            target[keys[keys.length - 1]] = value;
            await this.saveSettings();
            return true;
        } catch (error) {
            console.error(`Ошибка установки настройки ${key}:`, error);
            return false;
        }
    }

    /**
     * Сбрасывает настройки к значениям по умолчанию
     */
    async resetSettings() {
        try {
            this.plugin.settings = { ...this.defaultSettings };
            await this.saveSettings();
            return true;
        } catch (error) {
            console.error('Ошибка сброса настроек:', error);
            return false;
        }
    }

    /**
     * Экспортирует настройки
     */
    async exportSettings() {
        try {
            const settings = { ...this.plugin.settings };
            // Удаляем чувствительные данные
            delete settings.aiSettings.apiKey;
            delete settings.lastBackup;
            
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `literary-templates-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return true;
        } catch (error) {
            console.error('Ошибка экспорта настроек:', error);
            return false;
        }
    }

    /**
     * Импортирует настройки
     */
    async importSettings(file) {
        try {
            const text = await file.text();
            const importedSettings = JSON.parse(text);
            
            // Валидируем импортированные настройки
            const validatedSettings = this.validateSettings(importedSettings);
            
            this.plugin.settings = { ...this.defaultSettings, ...validatedSettings };
            await this.saveSettings();
            
            new Notice('Настройки успешно импортированы!');
            return true;
        } catch (error) {
            console.error('Ошибка импорта настроек:', error);
            new Notice(`Ошибка импорта настроек: ${error.message}`);
            return false;
        }
    }

    /**
     * Валидирует настройки
     */
    validateSettings(settings) {
        const validated = {};
        
        for (const [key, value] of Object.entries(settings)) {
            if (key in this.defaultSettings) {
                if (typeof value === typeof this.defaultSettings[key]) {
                    validated[key] = value;
                } else {
                    console.warn(`Неверный тип для настройки ${key}: ожидается ${typeof this.defaultSettings[key]}, получен ${typeof value}`);
                    validated[key] = this.defaultSettings[key];
                }
            } else {
                console.warn(`Неизвестная настройка: ${key}`);
            }
        }
        
        return validated;
    }

    /**
     * Получает настройки AI
     */
    getAISettings() {
        return this.getSetting('aiSettings', this.defaultSettings.aiSettings);
    }

    /**
     * Устанавливает настройки AI
     */
    async setAISettings(aiSettings) {
        return await this.setSetting('aiSettings', aiSettings);
    }

    /**
     * Получает настройки шаблонов
     */
    getTemplateSettings() {
        return this.getSetting('templateSettings', this.defaultSettings.templateSettings);
    }

    /**
     * Устанавливает настройки шаблонов
     */
    async setTemplateSettings(templateSettings) {
        return await this.setSetting('templateSettings', templateSettings);
    }

    /**
     * Получает настройки проекта
     */
    getProjectSettings() {
        return this.getSetting('projectSettings', this.defaultSettings.projectSettings);
    }

    /**
     * Устанавливает настройки проекта
     */
    async setProjectSettings(projectSettings) {
        return await this.setSetting('projectSettings', projectSettings);
    }

    /**
     * Получает настройки UI
     */
    getUISettings() {
        return this.getSetting('uiSettings', this.defaultSettings.uiSettings);
    }

    /**
     * Устанавливает настройки UI
     */
    async setUISettings(uiSettings) {
        return await this.setSetting('uiSettings', uiSettings);
    }

    /**
     * Проверяет, включена ли AI
     */
    isAIEnabled() {
        return this.getSetting('aiEnabled', false);
    }

    /**
     * Включает/выключает AI
     */
    async setAIEnabled(enabled) {
        return await this.setSetting('aiEnabled', enabled);
    }

    /**
     * Получает список избранных сущностей
     */
    getFavoriteEntities() {
        return this.getSetting('favoriteEntities', []);
    }

    /**
     * Добавляет сущность в избранное
     */
    async addFavoriteEntity(entityType) {
        const favorites = this.getFavoriteEntities();
        if (!favorites.includes(entityType)) {
            favorites.push(entityType);
            return await this.setSetting('favoriteEntities', favorites);
        }
        return true;
    }

    /**
     * Удаляет сущность из избранного
     */
    async removeFavoriteEntity(entityType) {
        const favorites = this.getFavoriteEntities();
        const index = favorites.indexOf(entityType);
        if (index > -1) {
            favorites.splice(index, 1);
            return await this.setSetting('favoriteEntities', favorites);
        }
        return true;
    }

    /**
     * Получает список недавних проектов
     */
    getRecentProjects() {
        return this.getSetting('recentProjects', []);
    }

    /**
     * Добавляет проект в недавние
     */
    async addRecentProject(projectPath) {
        const recent = this.getRecentProjects();
        const index = recent.indexOf(projectPath);
        if (index > -1) {
            recent.splice(index, 1);
        }
        recent.unshift(projectPath);
        
        // Ограничиваем количество недавних проектов
        if (recent.length > 10) {
            recent.splice(10);
        }
        
        return await this.setSetting('recentProjects', recent);
    }

    /**
     * Очищает список недавних проектов
     */
    async clearRecentProjects() {
        return await this.setSetting('recentProjects', []);
    }

    /**
     * Получает настройки уведомлений
     */
    getNotificationSettings() {
        return {
            enabled: this.getSetting('enableNotifications', true),
            showSuccess: true,
            showError: true,
            showWarning: true,
            showInfo: true
        };
    }

    /**
     * Устанавливает настройки уведомлений
     */
    async setNotificationSettings(settings) {
        return await this.setSetting('enableNotifications', settings.enabled);
    }

    /**
     * Получает настройки резервного копирования
     */
    getBackupSettings() {
        return {
            enabled: this.getSetting('backupEnabled', true),
            interval: this.getSetting('backupInterval', 24),
            lastBackup: this.getSetting('lastBackup', null)
        };
    }

    /**
     * Устанавливает настройки резервного копирования
     */
    async setBackupSettings(settings) {
        await this.setSetting('backupEnabled', settings.enabled);
        await this.setSetting('backupInterval', settings.interval);
        if (settings.lastBackup) {
            await this.setSetting('lastBackup', settings.lastBackup);
        }
        return true;
    }

    /**
     * Проверяет, нужно ли создать резервную копию
     */
    shouldCreateBackup() {
        const backupSettings = this.getBackupSettings();
        if (!backupSettings.enabled) {
            return false;
        }
        
        const lastBackup = backupSettings.lastBackup;
        if (!lastBackup) {
            return true;
        }
        
        const lastBackupTime = new Date(lastBackup);
        const now = new Date();
        const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);
        
        return hoursSinceLastBackup >= backupSettings.interval;
    }

    /**
     * Обновляет время последней резервной копии
     */
    async updateLastBackupTime() {
        return await this.setSetting('lastBackup', new Date().toISOString());
    }
}

// Экспортируем класс
module.exports = { SettingsManager };

// Глобализируем для использования в main.js
if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
}
