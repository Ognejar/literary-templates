/**
 * ui/WizardUI.js
 * Тонкий фасад для унификации UI визардов
 */

const { ObsidianSettingAdapter } = require('./adapters/ObsidianSettingAdapter.js');

class WizardUI {
  constructor(options = {}) {
    // options: { adapter, SettingClass }
    this.adapter = options.adapter || new ObsidianSettingAdapter(options.SettingClass);
  }

  header(contentEl, text) {
    return this.adapter.header(contentEl, text);
  }

  settingText(contentEl, name, getValue, onChange) {
    return this.adapter.settingText(contentEl, name, getValue, onChange);
  }

  settingTextArea(contentEl, name, getValue, onChange) {
    return this.adapter.settingTextArea(contentEl, name, getValue, onChange);
  }

  progress(contentEl, step, total) {
    return this.adapter.progress(contentEl, step, total);
  }
}

module.exports = {
  WizardUI,
};
