/**
 * @file       PromptSelectorModal.js
 * @description Модальное окно выбора промпта: вертикальный список, предпросмотр, копирование. Включает парсер YAML-тегов.
 * @author     Cursor
 * @version    1.0.1
 * @license    MIT
 * @dependencies HtmlWizardModal, obsidian
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       /docs/project.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');

/**
 * Парсит YAML-теги из начала промпта (--- ... ---) и возвращает {tags, content}
 * Поддерживает только простейший YAML (ключ: значение)
 * @param {string} raw
 * @returns {{tags: Object, content: string}}
 */
function parsePromptYaml(raw) {
    const yamlMatch = raw.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
    if (!yamlMatch) return { tags: {}, content: raw };
    const yaml = yamlMatch[1];
    const content = yamlMatch[2].trim();
    const tags = {};
    yaml.split(/\r?\n/).forEach(line => {
        const m = line.match(/^([\w-]+):\s*(.*)$/);
        if (m) tags[m[1].trim()] = m[2].trim();
    });
    return { tags, content };
}

class PromptSelectorModal extends HtmlWizardModal {
    /**
     * @param {App} app
     * @param {Array<Object>} prompts - [{content, tags, ...}]
     * @param {Function} onSelect - callback(promptContent)
     */
    constructor(app, prompts, onSelect) {
        super(app);
        this.prompts = prompts;
        this.onSelect = onSelect;
        this.selectedIdx = 0;
    }

    onOpen() {
        this.applyBaseStyles();
        this.render();
    }

    render() {
        this.contentEl.empty();
        this.contentEl.addClass('lt-wizard');
        const list = this.contentEl.createEl('div', { cls: 'lt-prompt-list' });
        this.prompts.forEach((prompt, idx) => {
            const item = list.createEl('div', { cls: 'lt-prompt-item' });
            if (idx === this.selectedIdx) item.addClass('is-selected');
            item.createEl('div', { text: prompt.tags.title || `Промпт ${idx+1}`, cls: 'lt-prompt-title' });
            if (prompt.tags) {
                const tags = item.createEl('div', { cls: 'lt-prompt-tags' });
                Object.entries(prompt.tags).forEach(([k,v]) => {
                    if (['output','source','description'].includes(k))
                        tags.createEl('span', { text: `${k}: ${v}`, cls: 'lt-prompt-tag' });
                });
            }
            item.onclick = () => {
                this.selectedIdx = idx;
                this.render();
            };
        });
        // Предпросмотр
        const preview = this.contentEl.createEl('div', { cls: 'lt-prompt-preview' });
        preview.createEl('pre', { text: this.prompts[this.selectedIdx].content });
        // Кнопка копирования
        const copyBtn = this.createButton('primary', 'Скопировать');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(this.prompts[this.selectedIdx].content);
            if (this.onSelect) this.onSelect(this.prompts[this.selectedIdx].content);
            this.close();
        };
        this.contentEl.appendChild(copyBtn);
    }
}

module.exports = { PromptSelectorModal, parsePromptYaml };
