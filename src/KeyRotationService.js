/**
 * @file       KeyRotationService.js
 * @description Сервис для ротации ключей API с поддержкой OpenRouter и мониторингом использования
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-15
 * @updated    2025-08-15
 * @docs       docs/Карточка функционала.md
 */

// В сборке requestUrl импортируется глобально
// const { requestUrl } = require('obsidian');

var KeyRotationService = class KeyRotationService {
    constructor(plugin) {
        this.plugin = plugin;
        this.keys = [];
        this.currentKeyIndex = 0;
        this.keyUsage = {};
        this.loadKeys();
    }

    /**
     * Загружает ключи из настроек плагина
     */
    loadKeys() {
        try {
            this.keys = this.plugin.settings.aiKeys || [];
            this.currentKeyIndex = this.plugin.settings.currentKeyIndex || 0;
            this.keyUsage = this.plugin.settings.keyUsage || {};
            
            // Инициализируем использование для новых ключей
            this.keys.forEach((key, index) => {
                if (!this.keyUsage[`key${index}`]) {
                    this.keyUsage[`key${index}`] = { used: 0, limit: 10000, lastUsed: null };
                }
            });
        } catch (e) {
            console.error('Ошибка загрузки ключей:', e);
            this.keys = [];
        }
    }

    /**
     * Сохраняет состояние ключей в настройки
     */
    async saveKeys() {
        try {
            this.plugin.settings.aiKeys = this.keys;
            this.plugin.settings.currentKeyIndex = this.currentKeyIndex;
            this.plugin.settings.keyUsage = this.keyUsage;
            await this.plugin.saveSettings();
        } catch (e) {
            console.error('Ошибка сохранения ключей:', e);
        }
    }

    /**
     * Получает текущий активный ключ
     */
    getCurrentKey() {
        if (this.keys.length === 0) {
            throw new Error('Нет доступных ключей API');
        }
        return this.keys[this.currentKeyIndex];
    }

    /**
     * Переключает на следующий доступный ключ
     */
    rotateKey() {
        if (this.keys.length <= 1) {
            throw new Error('Нет альтернативных ключей для ротации');
        }

        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        this.plugin.logDebug(`Переключен на ключ ${this.currentKeyIndex + 1}`);
        return this.getCurrentKey();
    }

    /**
     * Проверяет, не исчерпан ли текущий ключ
     */
    isKeyExhausted(keyIndex = this.currentKeyIndex) {
        const keyUsage = this.keyUsage[`key${keyIndex}`];
        if (!keyUsage) return false;
        
        // Проверяем лимит использования
        return keyUsage.used >= keyUsage.limit;
    }

    /**
     * Обновляет статистику использования ключа
     */
    updateKeyUsage(tokensUsed = 0) {
        const keyId = `key${this.currentKeyIndex}`;
        if (!this.keyUsage[keyId]) {
            this.keyUsage[keyId] = { used: 0, limit: 10000, lastUsed: null };
        }
        
        this.keyUsage[keyId].used += tokensUsed;
        this.keyUsage[keyId].lastUsed = new Date().toISOString();
        
        this.saveKeys();
    }

    /**
     * Получает статистику использования всех ключей
     */
    getKeyStats() {
        return this.keys.map((key, index) => {
            const usage = this.keyUsage[`key${index}`] || { used: 0, limit: 10000 };
            const percentage = Math.round((usage.used / usage.limit) * 100);
            const isActive = index === this.currentKeyIndex;
            
            return {
                index,
                key: key.substring(0, 10) + '...',
                used: usage.used,
                limit: usage.limit,
                percentage,
                isActive,
                isExhausted: usage.used >= usage.limit
            };
        });
    }

    /**
     * Добавляет новый ключ
     */
    async addKey(key) {
        if (!key || key.trim() === '') {
            throw new Error('Ключ не может быть пустым');
        }
        
        this.keys.push(key.trim());
        const keyIndex = this.keys.length - 1;
        this.keyUsage[`key${keyIndex}`] = { used: 0, limit: 10000, lastUsed: null };
        
        await this.saveKeys();
        this.plugin.logDebug(`Добавлен новый ключ API (всего: ${this.keys.length})`);
    }

    /**
     * Удаляет ключ по индексу
     */
    async removeKey(index) {
        if (index < 0 || index >= this.keys.length) {
            throw new Error('Неверный индекс ключа');
        }
        
        this.keys.splice(index, 1);
        delete this.keyUsage[`key${index}`];
        
        // Переиндексируем оставшиеся ключи
        const newKeyUsage = {};
        Object.keys(this.keyUsage).forEach(keyId => {
            const oldIndex = parseInt(keyId.replace('key', ''));
            if (oldIndex > index) {
                newKeyUsage[`key${oldIndex - 1}`] = this.keyUsage[keyId];
            } else if (oldIndex < index) {
                newKeyUsage[keyId] = this.keyUsage[keyId];
            }
        });
        this.keyUsage = newKeyUsage;
        
        // Корректируем текущий индекс
        if (this.currentKeyIndex >= this.keys.length) {
            this.currentKeyIndex = Math.max(0, this.keys.length - 1);
        }
        
        await this.saveKeys();
        this.plugin.logDebug(`Удален ключ API ${index + 1} (осталось: ${this.keys.length})`);
    }

    /**
     * Получает предупреждения о состоянии ключей
     */
    getWarnings() {
        const warnings = [];
        const stats = this.getKeyStats();
        
        // Проверяем исчерпано ключи
        const exhaustedKeys = stats.filter(s => s.isExhausted);
        if (exhaustedKeys.length > 0) {
            warnings.push(`Исчерпано ключей: ${exhaustedKeys.length}`);
        }
        
        // Проверяем ключи с высоким использованием
        const highUsageKeys = stats.filter(s => s.percentage >= 80 && !s.isExhausted);
        if (highUsageKeys.length > 0) {
            warnings.push(`Высокое использование: ${highUsageKeys.length} ключей`);
        }
        
        // Проверяем общее количество ключей
        if (this.keys.length === 0) {
            warnings.push('Нет настроенных ключей API');
        } else if (this.keys.length === 1) {
            warnings.push('Только один ключ API - нет резерва');
        }
        
        return warnings;
    }

    /**
     * Проверяет доступность API
     */
    async testConnection() {
        try {
            const key = this.getCurrentKey();
            const response = await requestUrl({
                url: 'https://openrouter.ai/api/v1/models',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status >= 200 && response.status < 300) {
                return { success: true, message: 'API доступен' };
            } else {
                return { success: false, message: `Ошибка API: ${response.status}` };
            }
        } catch (e) {
            return { success: false, message: `Ошибка соединения: ${e.message}` };
        }
    }
};

module.exports = { KeyRotationService };