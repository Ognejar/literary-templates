/**
 * @file       AIKeysManagerModal.js
 * @description Модальное окно для управления AI-ключами и базовыми настройками AI
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (Modal, Setting, Notice)
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

class AIKeysManagerModal extends Modal {
    constructor(app, ModalCtor, SettingCtor, NoticeCtor, settings, onSave) {
        super(app);
        this.Modal = ModalCtor || Modal; // совместимость, если передали классы
        this.Setting = SettingCtor || Setting;
        this.Notice = NoticeCtor || Notice;
        this.settings = settings || {};
        this.onSave = typeof onSave === 'function' ? onSave : (() => {});
    }

    onOpen() {
        const { contentEl } = this;
        this.contentEl = contentEl;
        contentEl.empty();
        contentEl.addClass('ai-keys-manager-modal');

        contentEl.createEl('h2', { text: 'Управление AI ключами' });

        // Список ключей
        this.keysContainer = contentEl.createEl('div', { cls: 'keys-container' });
        this.renderKeys();

        // Форма добавления ключа
        const addForm = contentEl.createEl('div', { cls: 'add-key-form' });
        addForm.createEl('h3', { text: 'Добавить новый ключ:' });
        const keyInput = addForm.createEl('input', { type: 'password', placeholder: 'Введите AI ключ (API Key)', cls: 'key-input' });
        const addBtn = addForm.createEl('button', { text: 'Добавить ключ', cls: 'add-btn' });
        addBtn.onclick = () => {
            const key = String(keyInput.value || '').trim();
            if (!key) { new this.Notice('Введите ключ'); return; }
            if (!Array.isArray(this.settings.aiKeys)) this.settings.aiKeys = [];
            this.settings.aiKeys.push(key);
            keyInput.value = '';
            this.renderKeys();
            new this.Notice('Ключ добавлен');
        };

        // Блок настроек
        const settingsBlock = contentEl.createEl('div', { cls: 'ai-settings' });
        settingsBlock.createEl('h3', { text: 'Настройки AI:' });

        new this.Setting(settingsBlock)
            .setName('AI включен')
            .setDesc('Включить/выключить AI функциональность')
            .addToggle(toggle => toggle
                .setValue(Boolean(this.settings.aiEnabled))
                .onChange(v => { this.settings.aiEnabled = v; })
            );

        new this.Setting(settingsBlock)
            .setName('AI провайдер')
            .setDesc('Выберите провайдера для AI запросов')
            .addDropdown(dd => dd
                .addOption('openrouter', 'OpenRouter')
                .addOption('anthropic', 'Anthropic')
                .addOption('openai', 'OpenAI')
                .setValue(this.settings.aiProvider || 'openrouter')
                .onChange(v => { this.settings.aiProvider = v; })
            );

        new this.Setting(settingsBlock)
            .setName('AI модель')
            .setDesc('Идентификатор модели (например, openrouter/mistralai/mistral-7b-instruct)')
            .addText(t => t
                .setPlaceholder('openrouter/mistralai/mistral-7b-instruct')
                .setValue(this.settings.defaultModel || 'openrouter/mistralai/mistral-7b-instruct')
                .onChange(v => { this.settings.defaultModel = v; })
            );

        new this.Setting(settingsBlock)
            .setName('Максимум токенов')
            .setDesc('Максимальное количество токенов в ответе')
            .addText(t => t
                .setPlaceholder('2000')
                .setValue(String(this.settings.maxTokens || 2000))
                .onChange(v => { const n = parseInt(v); if (!isNaN(n) && n > 0) this.settings.maxTokens = n; })
            );

        new this.Setting(settingsBlock)
            .setName('Температура')
            .setDesc('Креативность ответов (0.0 - 1.0)')
            .addSlider(s => s
                .setLimits(0, 1, 0.1)
                .setValue(typeof this.settings.temperature === 'number' ? this.settings.temperature : 0.7)
                .onChange(v => { this.settings.temperature = v; })
            );

        // Кнопки управления
        const buttons = contentEl.createEl('div', { cls: 'buttons-container' });
        const saveBtn = buttons.createEl('button', { text: 'Сохранить', cls: 'save-btn' });
        saveBtn.onclick = () => { this.onSave(this.settings); this.close(); };
        const cancelBtn = buttons.createEl('button', { text: 'Отмена', cls: 'cancel-btn' });
        cancelBtn.onclick = () => { this.close(); };
    }

    renderKeys() {
        const container = this.keysContainer;
        container.empty();
        container.createEl('h3', { text: 'Текущие ключи:' });
        const keys = Array.isArray(this.settings.aiKeys) ? this.settings.aiKeys : [];
        if (keys.length === 0) {
            container.createEl('p', { text: 'Ключи не добавлены' });
            return;
        }
        keys.forEach((key, index) => {
            const row = container.createEl('div', { cls: 'key-item' });
            row.createEl('span', { text: `Ключ ${index + 1}: ${String(key).substring(0, 8)}...` });
            const del = row.createEl('button', { text: 'Удалить', cls: 'delete-btn' });
            del.onclick = () => {
                this.settings.aiKeys.splice(index, 1);
                this.renderKeys();
            };
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

if (typeof window !== 'undefined') {
    window.AIKeysManagerModal = AIKeysManagerModal;
}

module.exports = { AIKeysManagerModal };


