/**
 * @file       WorldSettingsModal.js
 * @description Модальное окно редактирования настроек мира (JSON источник)
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (Modal, Setting, Notice)
 * @created    2025-08-09
 * @updated    2025-08-09
 * @docs       /docs/project.md
 */

class WorldSettingsModal extends Modal {
  constructor(app, ModalRef, SettingRef, NoticeRef, initialData, onSubmit) {
    super(app);
    this.Modal = ModalRef;
    this.Setting = SettingRef;
    this.Notice = NoticeRef;
    this.initial = initialData || {};
    this.onSubmit = onSubmit;
    this.data = {
      projectName: this.initial.projectName || '',
      date: this.initial.date || '',
      genre: this.initial.genre || '',
      setting: this.initial.setting || '',
      era: this.initial.era || '',
      races: this.initial.races || '',
      genders: this.initial.genders || '',
      statuses: this.initial.statuses || '',
      locationTypes: this.initial.locationTypes || '',
      climates: this.initial.climates || '',
      peopleFeatures: this.initial.peopleFeatures || '',
      description: this.initial.description || ''
    };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Width styling
    this.modalEl.style.cssText = `
      max-width: 900px !important;
      width: 900px !important;
    `;
    contentEl.style.cssText = `
      padding: 20px;
      max-width: 900px !important;
      max-height: 80vh;
      overflow-y: auto;
    `;

    contentEl.createEl('h2', { text: 'Настройки мира' });

    const makeText = (name, label, placeholder = '') => {
      new this.Setting(contentEl)
        .setName(label)
        .addText((text) => {
          text.setPlaceholder(placeholder)
            .setValue(this.data[name])
            .onChange((val) => { this.data[name] = val; });
          text.inputEl.style.width = '100%';
          text.inputEl.style.fontSize = '16px';
          text.inputEl.style.padding = '8px';
        });
    };

    const makeArea = (name, label, placeholder = '') => {
      new this.Setting(contentEl)
        .setName(label)
        .addTextArea((ta) => {
          ta.setPlaceholder(placeholder)
            .setValue(this.data[name])
            .onChange((val) => { this.data[name] = val; });
          ta.inputEl.style.width = '100%';
          ta.inputEl.style.fontSize = '14px';
          ta.inputEl.style.padding = '8px';
          ta.inputEl.style.minHeight = '80px';
        });
    };

    makeText('projectName', 'Название проекта');
    makeText('genre', 'Жанр');
    makeText('setting', 'Сеттинг');
    makeText('era', 'Эпоха');
    makeArea('races', 'Расы (через запятую)');
    makeArea('genders', 'Полы (через запятую)');
    makeArea('statuses', 'Статусы (через запятую)');
    makeArea('locationTypes', 'Типы локаций (через запятую)');
    makeArea('climates', 'Климаты (через запятую)');
    makeArea('peopleFeatures', 'Особенности народов');
    makeArea('description', 'Описание мира');

    const btnRow = contentEl.createDiv({ cls: 'world-settings-buttons' });
    btnRow.style.cssText = 'display:flex; gap:10px; margin-top: 16px;';

    const saveBtn = btnRow.createEl('button', { text: 'Сохранить' });
    saveBtn.style.cssText = 'padding:8px 14px; font-size:14px;';
    saveBtn.addEventListener('click', () => {
      if (!this.data.projectName || this.data.projectName.trim() === '') {
        new this.Notice('Введите название проекта');
        return;
      }
      if (typeof this.onSubmit === 'function') {
        this.onSubmit({ ...this.data });
      }
      this.close();
    });

    const cancelBtn = btnRow.createEl('button', { text: 'Отмена' });
    cancelBtn.style.cssText = 'padding:8px 14px; font-size:14px;';
    cancelBtn.addEventListener('click', () => this.close());
  }
}

module.exports = WorldSettingsModal;


