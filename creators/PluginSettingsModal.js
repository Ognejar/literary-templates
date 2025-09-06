/**
 * @file       PluginSettingsModal.js
 * @description Модальное окно для редактирования основных настроек плагина Literary Templates (включая поле 'Автор')
 * @author     Captain Ognejar
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (Modal, Setting, Notice)
 * @created    2025-09-06
 * @updated    2025-09-06
 * @docs       docs/Карточка функционала.md
 */

class PluginSettingsModal extends Modal {
    constructor(app, ModalRef, SettingRef, NoticeRef, plugin) {
        super(app);
        this.Modal = ModalRef;
        this.Setting = SettingRef;
        this.Notice = NoticeRef;
        this.plugin = plugin;
        this.data = {
            author: plugin.settings.author || ''
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Настройки Literary Templates' });

        // Секция "Автор"
        new this.Setting(contentEl)
            .setName('Автор по умолчанию')
            .setDesc('Это имя будет подставляться при создании мира, страны и других сущностей. Можно изменить вручную в мастерах.')
            .addText(text => {
                text.setPlaceholder('Имя автора')
                    .setValue(this.data.author)
                    .onChange((val) => { this.data.author = val; });
            });

        // Кнопки действий
        const buttonContainer = contentEl.createDiv('plugin-settings-actions');
        buttonContainer.createEl('button', {
            text: 'Сохранить',
            cls: 'mod-cta'
        }).onclick = async () => {
            this.plugin.settings.author = this.data.author;
            await this.plugin.saveSettings();
            new this.Notice('Настройки плагина сохранены');
            this.close();
        };
        buttonContainer.createEl('button', {
            text: 'Закрыть',
            cls: 'mod-warning'
        }).onclick = () => {
            this.close();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

if (typeof window !== 'undefined') window.PluginSettingsModal = PluginSettingsModal;

module.exports = { PluginSettingsModal };
