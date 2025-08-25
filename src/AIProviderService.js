/**
 * @file       AIProviderService.js
 * @description Универсальный сервис для работы с AI-провайдерами (OpenRouter, локальные модели)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies KeyRotationService
 * @created    2025-08-15
 * @updated    2025-08-15
 * @docs       docs/Карточка функционала.md
 */

// В сборке requestUrl импортируется глобально
// const { requestUrl } = require('obsidian');
// const { KeyRotationService } = require('./KeyRotationService');

var AIProviderService = class AIProviderService {
    constructor(plugin) {
        this.plugin = plugin;
        this.keyService = new KeyRotationService(plugin);
        
        // Используем стрелочные функции для сохранения контекста this
        this.providers = {
            openrouter: async (prompt, options) => await this.openRouterProvider(prompt, options),
            local: async (prompt, options) => await this.localProvider(prompt, options)
        };
    }

    /**
     * Основной метод для отправки запросов к AI
     */
    async sendRequest(prompt, options = {}) {
        const {
            provider = 'openrouter',
            model = 'anthropic/claude-3.5-sonnet',
            maxTokens = 2000,
            temperature = 0.7,
            retries = 3
        } = options;

        let lastError = null;
        
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                this.plugin.logDebug(`AI запрос (попытка ${attempt + 1}/${retries}): ${provider}`);
                
                const providerFunction = this.providers[provider];
                if (!providerFunction) {
                    throw new Error(`Неизвестный провайдер: ${provider}`);
                }

                const result = await providerFunction(prompt, {
                    model,
                    maxTokens,
                    temperature
                });

                // Обновляем статистику использования
                if (result.tokensUsed) {
                    this.keyService.updateKeyUsage(result.tokensUsed);
                }

                return result;
            } catch (error) {
                lastError = error;
                this.plugin.logDebug(`Ошибка AI запроса (попытка ${attempt + 1}): ${error.message}`);
                
                // Если ошибка связана с ключом, пробуем ротировать
                if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('401')) {
                    try {
                        this.keyService.rotateKey();
                        this.plugin.logDebug('Переключен на следующий ключ API');
                    } catch (rotateError) {
                        this.plugin.logDebug(`Не удалось переключить ключ: ${rotateError.message}`);
                    }
                }
                
                // Небольшая задержка перед повторной попыткой
                if (attempt < retries - 1) {
                    // Используем Promise для создания задержки
                    await new Promise(resolve => {
                        const timeoutId = window.setTimeout(resolve, 1000 * (attempt + 1));
                        // Обработка таймаута в Node.js окружении
                        if (typeof window === 'undefined' && typeof timeoutId.unref === 'function') {
                            timeoutId.unref();
                        }
                    });
                }
            }
        }
        
        throw new Error(`Все попытки AI запроса не удались: ${lastError.message}`);
    }

    /**
     * Провайдер для OpenRouter
     */
    async openRouterProvider(prompt, options) {
        const key = this.keyService.getCurrentKey();
        const { model, maxTokens, temperature } = options;

        const response = await requestUrl({
            url: 'https://openrouter.ai/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://obsidian.md',
                'X-Title': 'Literary Templates Plugin'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Ты помощник для создания литературного контента. Отвечай на русском языке.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: temperature,
                stream: false
            })
        });

        if (response.status < 200 || response.status >= 300) {
            const errorText = response.text || 'Неизвестная ошибка';
            throw new Error(`OpenRouter API ошибка: ${response.status} - ${errorText}`);
        }

        const data = response.json;
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Неверный формат ответа от OpenRouter');
        }

        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage ? data.usage.total_tokens : 0,
            provider: 'openrouter',
            model: model
        };
    }

    /**
     * Провайдер для локальных моделей (заглушка для будущей интеграции)
     */
    async localProvider() {
        // TODO: Интеграция с локальными моделями (Ollama, LM Studio и т.д.)
        throw new Error('Локальные провайдеры пока не поддерживаются');
    }

    /**
     * Получает список доступных моделей
     */
    async getAvailableModels() {
        try {
            const key = this.keyService.getCurrentKey();
            const response = await requestUrl({
                url: 'https://openrouter.ai/api/v1/models',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Ошибка получения моделей: ${response.status}`);
            }

            const data = response.json;
            return data.data || [];
        } catch (error) {
            this.plugin.logDebug(`Ошибка получения моделей: ${error.message}`);
            return [];
        }
    }

    /**
     * Проверяет доступность провайдера
     */
    async testProvider(provider = 'openrouter') {
        try {
            const testPrompt = 'Привет! Это тестовый запрос.';
            const result = await this.sendRequest(testPrompt, {
                provider,
                maxTokens: 50,
                retries: 1
            });
            
            return {
                success: true,
                message: `Провайдер ${provider} доступен`,
                response: result.content
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка провайдера ${provider}: ${error.message}`
            };
        }
    }

    /**
     * Получает статистику использования
     */
    getUsageStats() {
        return {
            keyStats: this.keyService.getKeyStats(),
            warnings: this.keyService.getWarnings()
        };
    }

    /**
     * Добавляет новый ключ API
     */
    async addKey(key) {
        return await this.keyService.addKey(key);
    }

    /**
     * Удаляет ключ API
     */
    async removeKey(index) {
        return await this.keyService.removeKey(index);
    }

    /**
     * Тестирует соединение с API
     */
    async testConnection() {
        return await this.keyService.testConnection();
    }
};

module.exports = { AIProviderService };
