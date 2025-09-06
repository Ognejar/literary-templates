/**
 * ui/adapters/ObsidianSettingAdapter.js
 * Адаптер для отрисовки UI на базе глобального Obsidian.Setting
 */

class ObsidianSettingAdapter {
  constructor(SettingClass) {
    // SettingClass можно передать, но по умолчанию используем глобальный Setting
    this.Setting = SettingClass || (typeof Setting !== 'undefined' ? Setting : null);
  }

  header(contentEl, text) {
    const h = contentEl.createEl('h2', { text });
    h.classList.add('lt-header');
    return h;
  }

  settingText(contentEl, name, getValue, onChange) {
    const setting = new this.Setting(contentEl).setName(name);
    setting.addText(t => t.setValue(getValue()).onChange(v => onChange(v)));
    return setting;
  }

  settingTextArea(contentEl, name, getValue, onChange) {
    const setting = new this.Setting(contentEl).setName(name);
    setting.addTextArea(t => t.setValue(getValue()).onChange(v => onChange(v)));
    return setting;
  }

  progress(contentEl, step, total) {
    const progress = contentEl.createEl('div', { cls: 'lt-progress' });
    const fill = progress.createEl('div', { cls: 'lt-progress__fill' });
    const width = Math.max(0, Math.min(100, ((step + 1) / Math.max(1, total)) * 100));
    fill.style.width = `${width}%`;
    return progress;
  }
}

module.exports = {
  ObsidianSettingAdapter,
};
