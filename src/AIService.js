/**
 * @file       AIService.js
 * @description Централизованный сервис для инициализации и утилит AI (инициализация, retry, менеджер ключей, селектор промптов, тест подключения)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies KeyRotationService, AIProviderService, FallbackAIProviderService, LoreAnalyzerService, AIKeysManagerModal, PromptSelectorModal
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

class AIService {
    constructor(plugin) {
        this.plugin = plugin;
        this.debugEnabled = !!plugin?.debugEnabled;
    }

    createSafePluginContext() {
        const p = this.plugin;
        return {
            app: p.app,
            manifest: p.manifest,
            settings: p.settings,
            debugEnabled: p.debugEnabled,
            logDebug: (...args) => p.logDebug?.(...args)
        };
    }

    async init() {
        try {
            const ctx = this.createSafePluginContext();
            // Key rotation
            try {
                if (typeof window.KeyRotationService === 'function') {
                    window.keyRotationService = new window.KeyRotationService(ctx);
                } else {
                    window.keyRotationService = null;
                }
            } catch (e) {
                console.error('AI: KeyRotationService error:', e.message);
                window.keyRotationService = null;
            }
            // AI provider
            try {
                if (typeof window.AIProviderService === 'function') {
                    window.aiProviderService = new window.AIProviderService(ctx);
                } else if (typeof window.FallbackAIProviderService === 'function') {
                    window.aiProviderService = new window.FallbackAIProviderService(ctx);
                    window.AIProviderService = window.FallbackAIProviderService;
                } else {
                    window.aiProviderService = null;
                }
            } catch (e) {
                console.error('AI: AIProviderService error:', e.message);
                window.aiProviderService = null;
            }
            // Lore analyzer
            try {
                if (typeof window.LoreAnalyzerService === 'function') {
                    window.loreAnalyzerService = new window.LoreAnalyzerService(ctx);
                } else {
                    window.loreAnalyzerService = null;
                }
            } catch (e) {
                console.error('AI: LoreAnalyzerService error:', e.message);
                window.loreAnalyzerService = null;
            }
        } catch (e) {
            console.error('AI: critical init error:', e);
        }
    }

    retryInitialization(delayMs = 2000) {
        window.setTimeout(() => this.init(), delayMs);
    }

    async openKeysManager() {
        try {
            const ModalCtor = window.AIKeysManagerModal;
            if (typeof ModalCtor !== 'function') {
                new Notice('Окно управления AI-ключами недоступно');
                return;
            }
            const modal = new ModalCtor(this.plugin.app, Modal, Setting, Notice, this.plugin.settings, async (newSettings) => {
                this.plugin.settings = { ...this.plugin.settings, ...newSettings };
                await this.plugin.saveSettings?.();
            });
            modal.open();
        } catch (e) {
            console.error('AI: openKeysManager error:', e);
        }
    }

    async showPromptSelector() {
        try {
            if (typeof window.PromptSelectorModal !== 'function') {
                new Notice('Селектор промптов недоступен');
                return;
            }
            const prompts = await this.getPromptFiles();
            const modal = new window.PromptSelectorModal(this.plugin.app, prompts, (p) => {
                // Ничего не делаем — селектор закрывается сам
            });
            modal.open();
        } catch (e) {
            console.error('AI: showPromptSelector error:', e);
        }
    }

    async testConnection() {
        try {
            this.plugin.logDebug?.('=== Тест AI подключения ===');
            if (!window.aiProviderService) {
                new Notice('AI провайдер недоступен');
                return false;
            }
            const res = await window.aiProviderService.generateText('ping');
            new Notice('AI ответ: ' + (res?.text ? 'OK' : 'нет текста'));
            return !!res?.text;
        } catch (e) {
            console.error('AI: testConnection error:', e);
            new Notice('Ошибка теста AI: ' + e.message);
            return false;
        }
    }

    async showDiagnostics(title, diagnostics, advice) {
        try {
            const md = [
                `# ${title}`,
                '',
                '## Диагностика',
                '```json',
                JSON.stringify(diagnostics || {}, null, 2),
                '```',
                '',
                advice ? `> ${advice}` : ''
            ].join('\n');
            const modal = new PromptModal(this.plugin.app, Modal, Setting, Notice, 'Диагностика AI', md);
            modal.open();
        } catch (e) {
            console.error('AI: showDiagnostics error:', e);
        }
    }

    async analyzeAndExtendNote() {
        const app = this.plugin.app;
        const file = app.workspace.getActiveFile();
        if (!file) { this.plugin.logDebug?.('Нет активного файла для AI анализа'); return; }
        const content = await app.vault.read(file);
        let contentType = '';
        try {
            const cache = app.metadataCache.getFileCache(file) || {};
            if (cache.frontmatter && cache.frontmatter.type) contentType = String(cache.frontmatter.type).toLowerCase();
        } catch {}
        if (!contentType) contentType = file.basename ? file.basename.toLowerCase() : '';
        if (!contentType) { this.plugin.logDebug?.('Не удалось определить тип сущности для AI анализа'); return; }
        if (!window.loreAnalyzerService) {
            const resultText = `# Анализ сущности: ${contentType}\n\n## Файл: ${file.basename}\n## Тип: ${contentType}\n## Путь: ${file.path}\n`;
            const modal = new PromptModal(app, Modal, Setting, Notice, 'Анализ сущности', resultText);
            modal.open();
            return;
        }
        const projectRoot = window.findProjectRoot ? (window.findProjectRoot(app, file.parent.path) || '') : '';
        const analysis = await window.loreAnalyzerService.analyzeContent(content, contentType, projectRoot);
        let resultText = `# AI анализ (${contentType})\n`;
        if (analysis) {
            if (analysis.completeness != null) resultText += `## Полнота: ${analysis.completeness}%\n`;
            if (Array.isArray(analysis.missing) && analysis.missing.length) resultText += `### Недостающие разделы:\n- ${analysis.missing.join('\n- ')}\n`;
            if (Array.isArray(analysis.recommendations) && analysis.recommendations.length) resultText += `### Рекомендации:\n- ${analysis.recommendations.join('\n- ')}\n`;
        }
        const modal = new PromptModal(app, Modal, Setting, Notice, 'AI анализ и дополнение', resultText);
        modal.open();
    }

    async buildLoreContext() {
        const app = this.plugin.app;
        const file = app.workspace.getActiveFile();
        if (!file) { this.plugin.logDebug?.('Нет активного файла для AI сбора лора'); return; }
        const cache = app.metadataCache.getFileCache(file) || {};
        let contentType = '';
        if (cache.frontmatter && cache.frontmatter.type) contentType = String(cache.frontmatter.type).toLowerCase();
        if (!contentType) contentType = file.basename ? file.basename.toLowerCase() : '';
        if (!window.loreAnalyzerService) {
            const md = `# Лор-контекст для ${contentType}\n\n## Файл: ${file.basename}\n## Тип: ${contentType}\n## Путь: ${file.path}`;
            new PromptModal(app, Modal, Setting, Notice, 'Лор-контекст', md).open();
            return;
        }
        const projectRoot = window.findProjectRoot ? (window.findProjectRoot(app, file.parent.path) || '') : '';
        const context = await window.loreAnalyzerService.gatherLoreContext(projectRoot, contentType);
        const md = `# Лор-контекст для ${contentType}\n\n\`\`\`json\n${JSON.stringify(context || {}, null, 2)}\n\`\`\``;
        new PromptModal(app, Modal, Setting, Notice, 'AI сбор лор-контекста', md).open();
    }

    async gatherProjectLore() {
        const app = this.plugin.app;
        const activeFile = app.workspace.getActiveFile();
        const parentPath = activeFile && activeFile.parent ? activeFile.parent.path : '';
        const projectRoot = window.findProjectRoot ? (window.findProjectRoot(app, parentPath) || this.plugin.activeProjectRoot || '') : '';
        if (!projectRoot) { this.plugin.logDebug?.('Проект не найден'); return; }
        const loreDir = `${projectRoot}/Лор-контекст`;
        const loreFilePath = `${loreDir}/Лор_проекта.md`;
        let context = null;
        try {
            if (window.loreAnalyzerService && typeof window.loreAnalyzerService.gatherLoreContext === 'function') {
                context = await window.loreAnalyzerService.gatherLoreContext(projectRoot, 'all');
            }
        } catch (e) { this.plugin.logDebug?.('gatherLoreContext error: ' + e.message); }
        const parts = [];
        parts.push('# Лор проекта', '');
        parts.push('## Сводка');
        parts.push(String((context && context.summary) || '—'));
        parts.push('', '## Контекст для ИИ', '```json');
        parts.push(JSON.stringify(context || {}, null, 2));
        parts.push('```', '');
        const finalMd = parts.join('\n');
        try { if (!app.vault.getAbstractFileByPath(loreDir)) await app.vault.createFolder(loreDir); } catch {}
        const existing = app.vault.getAbstractFileByPath(loreFilePath);
        if (existing instanceof TFile) await app.vault.modify(existing, finalMd); else await app.vault.create(loreFilePath, finalMd);
        this.plugin.logDebug?.('Лор-проект обновлён: ' + loreFilePath);
    }
    // Вспомогательное: собрать список промптов из шаблонов
    async getPromptFiles() {
        const adapter = this.plugin?.app?.vault?.adapter;
        const templatesDir = 'templates/prompts';
        try {
            const exists = await adapter.exists(templatesDir);
            if (!exists) return [];
            const listing = await adapter.list(templatesDir);
            const files = (listing?.files || []).filter(p => /\.md$/i.test(p));
            const vault = this.plugin.app.vault;
            const out = [];
            for (const path of files) {
                const f = vault.getAbstractFileByPath(path);
                if (f) {
                    const content = await vault.read(f);
                    // Простейший парс тегов из YAML
                    const m = content.match(/^---[\s\S]*?---/);
                    const tags = { title: path.split('/').pop().replace(/\.md$/i, ''), description: '' };
                    if (m) {
                        const titleMatch = m[0].match(/title:\s*["']?([^"'\n]+)["']?/i);
                        const descMatch = m[0].match(/description:\s*["']?([^"'\n]+)["']?/i);
                        if (titleMatch) tags.title = titleMatch[1].trim();
                        if (descMatch) tags.description = descMatch[1].trim();
                    }
                    out.push({ path, tags, content });
                }
            }
            return out;
        } catch (e) {
            console.error('AI: getPromptFiles error:', e);
            return [];
        }
    }
}

if (typeof window !== 'undefined') {
    window.AIService = AIService;
}

module.exports = { AIService };


