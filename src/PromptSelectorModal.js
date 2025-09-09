/**
 * @file       PromptSelectorModal.js
 * @description Модальное окно выбора промпта: список, быстрый импорт фактов, предпросмотр
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies HtmlWizardModal (глобально), obsidian (Modal APIs)
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

class PromptSelectorModal extends HtmlWizardModal {
    constructor(app, prompts, onSelect) {
        super(app);
        this.prompts = Array.isArray(prompts) ? prompts : [];
        this.onSelect = typeof onSelect === 'function' ? onSelect : null;
    }

    onOpen() {
        if (typeof this.applyBaseStyles === 'function') this.applyBaseStyles();
        this.render();
    }

    render() {
        this.contentEl.empty();
        this.contentEl.addClass('lt-wizard');
        this.contentEl.createEl('h2', { text: 'Выберите промпт', cls: 'lt-modal-title' });

        const list = this.contentEl.createEl('div', { cls: 'lt-prompt-list' });

        // Специальный пункт: импорт фактов из буфера
        const importItem = list.createEl('div', {
            cls: 'lt-prompt-item lt-prompt-import',
            text: '🡇 Импортировать факты из буфера',
            title: 'Вставить факты из буфера обмена в базу проекта'
        });
        importItem.onclick = () => {
            try {
                this.app.commands.executeCommandById('literary-templates:import-facts-from-clipboard');
            } catch (err) {
                if (this.app && this.app.logDebug) this.app.logDebug('Ошибка команды импорта: ' + err.message);
            } finally {
                this.close();
            }
        };

        // Разделитель
        list.createEl('div', { cls: 'lt-prompt-separator' });

        // Обычные промпты
        this.prompts.forEach((prompt) => {
            const title = (prompt && prompt.tags && prompt.tags.title) ? prompt.tags.title : 'Без названия';
            const desc = (prompt && prompt.tags && prompt.tags.description) ? prompt.tags.description : '';
            const item = list.createEl('div', { cls: 'lt-prompt-item', text: title, title: desc });
            item.onclick = () => {
                if (this.onSelect) this.onSelect(prompt);
                this.close();
            };
        });
    }
}

if (typeof window !== 'undefined') {
    window.PromptSelectorModal = PromptSelectorModal;
}

module.exports = { PromptSelectorModal };


