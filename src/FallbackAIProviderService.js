/**
 * @file       FallbackAIProviderService.js
 * @description Резервный (fallback) AI-провайдер на случай недоступности основного сервиса
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies none
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

class FallbackAIProviderService {
    constructor(pluginContext) {
        this.plugin = pluginContext;
    }

    async generateText(prompt) {
        const head = String(prompt || '').substring(0, 200);
        return {
            text: `[FALLBACK] Запрос: ${head}\n\nЭто резервный ответ, так как основной AI сервис недоступен.`,
            success: false,
            fallback: true
        };
    }
}

if (typeof window !== 'undefined') {
    window.FallbackAIProviderService = FallbackAIProviderService;
}

module.exports = { FallbackAIProviderService };


