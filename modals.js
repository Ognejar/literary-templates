/**
 * @file       modals.js
 * @description Вспомогательные модальные окна для плагина
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (передается через конструктор)
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

class PromptModal extends Modal {
    constructor(app, Modal, Setting, Notice, text, def = '') {
        super(app);
        this.Modal = Modal;
        this.Setting = Setting;
        this.Notice = Notice;
        this.text = text;
        this.defaultValue = def;
        this.result = null;
        this.resolve = null;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.text });
        const input = contentEl.createEl('input', { type: 'text', value: this.defaultValue });
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.result = input.value;
                this.close();
            }
        });
        const button = contentEl.createEl('button', { text: 'OK' });
        button.addEventListener('click', () => {
            this.result = input.value;
            this.close();
        });
    }
    onClose() {
        if (this.resolve) {
            this.resolve(this.result);
        }
    }
    openAndGetValue() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.open();
        });
    }
}

class SuggesterModal extends Modal {
    constructor(app, Modal, Setting, Notice, items, display, title = 'Выберите') {
        super(app);
        this.Modal = Modal;
        this.Setting = Setting;
        this.Notice = Notice;
        this.items = items;
        this.display = display;
        this.title = title;
        this.selectedValue = null;
        this.resolve = null;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.title });
        const container = contentEl.createDiv();
        this.display.forEach((item, index) => {
            const button = container.createEl('button', { text: item });
            button.addEventListener('click', () => {
                this.selectedValue = this.items[index];
                this.close();
            });
        });
    }
    onClose() {
        if (this.resolve) {
            this.resolve(this.selectedValue);
        }
    }
    openAndGetValue() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.open();
        });
    }
}

module.exports = { PromptModal, SuggesterModal };
