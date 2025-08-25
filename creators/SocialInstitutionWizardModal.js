/**
 * @file       SocialInstitutionWizardModal.js
 * @description Мастер создания социальных объектов (Храм, Институт, Университет, Больница, Библиотека, Музей, Театр, Школа, Стадион)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies HtmlWizardModal, Obsidian API (Modal, Setting, Notice)
 * @created    2025-08-21
 * @updated    2025-08-21
 * @docs       docs/project.md
 */

/* global HtmlWizardModal */

var SocialInstitutionWizardModal = class SocialInstitutionWizardModal extends HtmlWizardModal {
    /**
     * @param {App} app
     * @param {any} Modal
     * @param {any} Setting
     * @param {any} Notice
     * @param {string} projectRoot
     * @param {(data: object)=>Promise<void>} onSubmit
     */
    constructor(app, Modal, Setting, Notice, projectRoot, onSubmit) {
        super(app);
        this.Modal = Modal;
        this.Setting = Setting;
        this.Notice = Notice;
        this.projectRoot = projectRoot;
        this.onSubmit = onSubmit;
        this.data = {
            subtype: 'Храм',
            name: '',
            country: '',
            province: '',
            city: '',
            address: '',
            founded: '',
            capacity: '',
            owner: '',
            affiliation: '',
            status: 'действует',
            description: ''
        };
        this.subtypes = ['Храм','Институт','Университет','Больница','Библиотека','Музей','Театр','Школа','Стадион'];
    }

    async onOpen() {
        this.applyBaseStyles();
        await this.render();
    }

    async render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('lt-wizard');
        contentEl.createEl('h2', { text: 'Создание социального объекта', cls: 'lt-modal-title' });

        // Подтип
        new this.Setting(contentEl)
            .setName('Подтип')
            .setDesc('Выберите тип объекта')
            .addDropdown(d => {
                this.subtypes.forEach(t => d.addOption(t, t));
                d.setValue(this.data.subtype);
                d.onChange(v => this.data.subtype = v);
            });

        // Название
        new this.Setting(contentEl)
            .setName('Название')
            .setDesc('Имя объекта')
            .addText(t => {
                t.setValue(this.data.name).onChange(v => this.data.name = v);
            });

        // География
        // Государство: не обязательно, но если выбрано — далее из списков
        const states = await this.loadStates();
        new this.Setting(contentEl)
            .setName('Государство (необязательно)')
            .setDesc(states.length ? 'Выберите государство или оставьте пустым' : 'Список государств не найден, можно оставить пустым')
            .addDropdown(d => {
                d.addOption('', '— не указано —');
                states.forEach(s => d.addOption(s, s));
                d.setValue(this.data.country || '');
                d.onChange(async v => { this.data.country = v; await this.render(); });
            });

        if (this.data.country) {
            // Если указано государство — провинции из списка
            const provinces = await this.loadProvincesByState(this.data.country);
            new this.Setting(contentEl)
                .setName('Провинция')
                .setDesc(provinces.length ? 'Выберите провинцию' : 'Для выбранного государства провинции не найдены')
                .addDropdown(d => {
                    d.addOption('', '— не указано —');
                    provinces.forEach(p => d.addOption(p, p));
                    d.setValue(this.data.province || '');
                    d.onChange(async v => { this.data.province = v; await this.render(); });
                });
            // Города — по провинции, если выбрана; иначе по государству
            const cities = await this.loadCities(this.data.country, this.data.province);
            new this.Setting(contentEl)
                .setName('Город')
                .setDesc(cities.length ? 'Выберите город' : 'Города не найдены для выбранного фильтра')
                .addDropdown(d => {
                    d.addOption('', '— не указано —');
                    cities.forEach(c => d.addOption(c, c));
                    d.setValue(this.data.city || '');
                    d.onChange(v => { this.data.city = v; });
                });
        } else {
            // Без государства — свободный ввод
            new this.Setting(contentEl).setName('Провинция (вручную)').addText(t => t.setValue(this.data.province).onChange(v => this.data.province = v));
            new this.Setting(contentEl).setName('Город (вручную)').addText(t => t.setValue(this.data.city).onChange(v => this.data.city = v));
        }
        new this.Setting(contentEl).setName('Адрес/координаты').addText(t => t.setValue(this.data.address).onChange(v => this.data.address = v));

        // Свойства
        new this.Setting(contentEl).setName('Дата основания').addText(t => t.setPlaceholder('YYYY-MM-DD').setValue(this.data.founded).onChange(v => this.data.founded = v));
        new this.Setting(contentEl).setName('Вместимость/штат').addText(t => t.setValue(this.data.capacity).onChange(v => this.data.capacity = v));
        new this.Setting(contentEl).setName('Владелец/покровитель').addText(t => t.setValue(this.data.owner).onChange(v => this.data.owner = v));
        new this.Setting(contentEl).setName('Аффилиации (через запятую)').addText(t => t.setValue(this.data.affiliation).onChange(v => this.data.affiliation = v));
        new this.Setting(contentEl)
            .setName('Статус')
            .addDropdown(d => {
                ['действует','заброшено','разрушено','строится'].forEach(s => d.addOption(s, s));
                d.setValue(this.data.status);
                d.onChange(v => this.data.status = v);
            });
        new this.Setting(contentEl).setName('Краткое описание').addTextArea(t => {
            t.setValue(this.data.description).onChange(v => this.data.description = v);
            t.inputEl.rows = 4;
        });

        // Кнопки
        const btns = contentEl.createEl('div', { cls: 'lt-actions' });
        const submit = btns.createEl('button', { text: 'Создать' });
        submit.onclick = async () => {
            if (!this.data.name) { new this.Notice('Укажите название объекта'); return; }
            try { await this.onSubmit(this.data); } catch {} finally { this.close(); }
        };
        const cancel = btns.createEl('button', { text: 'Отмена' });
        cancel.onclick = () => this.close();
    }

    async loadStates() {
        try {
            const folder = `${this.projectRoot}/Государства`;
            const files = this.app.vault.getMarkdownFiles().filter(f => f.parent && f.parent.path === folder);
            return files.map(f => f.basename).sort((a,b)=>a.localeCompare(b));
        } catch { return []; }
    }

    async loadProvincesByState(stateName) {
        try {
            const folder = `${this.projectRoot}/Провинции`;
            const files = this.app.vault.getMarkdownFiles().filter(f => f.parent && f.parent.path === folder);
            const out = [];
            for (const f of files) {
                try {
                    const txt = await this.app.vault.read(f);
                    if (new RegExp(`state:\s*"?${stateName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"?`).test(txt)) {
                        out.push(f.basename);
                    }
                } catch {}
            }
            return out.sort((a,b)=>a.localeCompare(b));
        } catch { return []; }
    }

    async loadCities(stateName, provinceName) {
        try {
            const folder = `${this.projectRoot}/Локации/Города`;
            const files = this.app.vault.getMarkdownFiles().filter(f => f.parent && f.parent.path === folder);
            const out = [];
            const stateRe = stateName ? new RegExp(`country:\s*"?${stateName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"?`) : null;
            const provRe = provinceName ? new RegExp(`province:\s*"?${provinceName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"?`) : null;
            for (const f of files) {
                try {
                    const txt = await this.app.vault.read(f);
                    if (provRe && provRe.test(txt)) { out.push(f.basename); continue; }
                    if (!provRe && stateRe && stateRe.test(txt)) { out.push(f.basename); continue; }
                } catch {}
            }
            return out.sort((a,b)=>a.localeCompare(b));
        } catch { return []; }
    }
};

// Глобализация для сборки без модулей
if (typeof window !== 'undefined') {
    window.SocialInstitutionWizardModal = SocialInstitutionWizardModal;
}

module.exports = { SocialInstitutionWizardModal };


