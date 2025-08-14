/**
 * @file       EntityWizardBase.js
 * @description Базовый класс мастеров сущностей: стили, безопасные статусы, утилиты для полей
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies HtmlWizardModal
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

class EntityWizardBase extends HtmlWizardModal {
    constructor(app, ModalClass, SettingClass, NoticeClass) {
        super(app, ModalClass, NoticeClass);
        this.Setting = SettingClass;
    }

    applyBaseUI() {
        try { this.applyBaseStyles(); } catch {}
    }

    ensureStatuses(statuses) {
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ];
        }
        return statuses;
    }

    addDropdownOptions(dropdown, options) {
        (options || []).forEach(opt => {
            if (typeof opt === 'string') dropdown.addOption(opt, opt);
            else if (opt && typeof opt === 'object' && opt.value !== undefined) {
                dropdown.addOption(opt.value, opt.label !== undefined ? `${opt.icon ? opt.icon + ' ' : ''}${opt.label}` : String(opt.value));
            }
        });
    }

    addTextInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addText(t => {
                t.setValue(value || '');
                t.onChange(onChange);
            });
    }

    addTextAreaInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addTextArea(t => {
                t.setValue(value || '');
                t.onChange(onChange);
            });
    }

    addDropdownInput(container, name, value, options, onChange) {
        new this.Setting(container)
            .setName(name)
            .addDropdown(d => {
                options.forEach(opt => d.addOption(opt, opt));
                d.setValue(value || '');
                d.onChange(onChange);
            });
    }
}

module.exports = { EntityWizardBase };


