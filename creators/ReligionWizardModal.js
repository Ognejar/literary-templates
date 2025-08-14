/**
 * @file       ReligionWizardModal.js
 * @description Мастер создания религий
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новая_религия.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class ReligionWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.data = {
            name: '',
            description: '',
            doctrines: '',
            pantheon: '',
            rituals: '',
            structure: '',
            shrines: '',
            taboos: '',
            holidays: '',
            symbols: '',
            connections: '',
            timeline: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderBeliefs.bind(this),
            this.renderStructure.bind(this),
            this.renderPreview.bind(this)
        ];
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        if (this.options.prefillName && !this.data.name) this.data.name = this.options.prefillName;
        this.render();
    }

    render() {
        this.contentEl.empty();
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const fill = progress.createEl('div', { cls: 'lt-progress__fill' });
        fill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        
        this.steps[this.step]();
        
        this.renderNavigation();
    }

    renderBasic() {
        const h = this.contentEl.createEl('h2', { text: 'Основная информация' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Название религии')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new Setting(this.contentEl)
            .setName('Связи с миром (через запятую)')
            .addText(t => t.setValue(this.data.connections).onChange(v => this.data.connections = v));
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderBeliefs() {
        const h = this.contentEl.createEl('h2', { text: 'Верования и практики' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Доктрины (через запятую)')
            .addTextArea(t => t.setValue(this.data.doctrines).onChange(v => this.data.doctrines = v));
        
        new Setting(this.contentEl)
            .setName('Пантеон (через запятую)')
            .addTextArea(t => t.setValue(this.data.pantheon).onChange(v => this.data.pantheon = v));
        
        new Setting(this.contentEl)
            .setName('Ритуалы (через запятую)')
            .addTextArea(t => t.setValue(this.data.rituals).onChange(v => this.data.rituals = v));
        
        new Setting(this.contentEl)
            .setName('Табу (через запятую)')
            .addTextArea(t => t.setValue(this.data.taboos).onChange(v => this.data.taboos = v));
        
        new Setting(this.contentEl)
            .setName('Праздники (через запятую)')
            .addTextArea(t => t.setValue(this.data.holidays).onChange(v => this.data.holidays = v));
        
        new Setting(this.contentEl)
            .setName('Символы (через запятую)')
            .addTextArea(t => t.setValue(this.data.symbols).onChange(v => this.data.symbols = v));
    }

    renderStructure() {
        const h = this.contentEl.createEl('h2', { text: 'Структура и история' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Структура (через запятую)')
            .addTextArea(t => t.setValue(this.data.structure).onChange(v => this.data.structure = v));
        
        new Setting(this.contentEl)
            .setName('Храмы и святилища (через запятую)')
            .addTextArea(t => t.setValue(this.data.shrines).onChange(v => this.data.shrines = v));
        
        new Setting(this.contentEl)
            .setName('История развития (через запятую)')
            .addTextArea(t => t.setValue(this.data.timeline).onChange(v => this.data.timeline = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр религии' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        if (this.data.doctrines) {
            box.createEl('div', { text: `Доктрина: ${this.data.doctrines.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название религии');
                return false;
            }
        }
        return true;
    }

    async finish() {
        const clean = s => String(s || '').trim();
        const list = s => clean(s).split(',').map(x => x.trim()).filter(Boolean);
        
        const name = clean(this.data.name);
        const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        
        const data = {
            name,
            date,
            description: clean(this.data.description),
            doctrinesContent: list(this.data.doctrines).map(x => `- ${x}`).join('\n'),
            pantheonContent: list(this.data.pantheon).map(x => `- ${x}`).join('\n'),
            ritualsContent: list(this.data.rituals).map(x => `- ${x}`).join('\n'),
            structureContent: list(this.data.structure).map(x => `- ${x}`).join('\n'),
            shrinesContent: list(this.data.shrines).map(x => `- ${x}`).join('\n'),
            taboosContent: list(this.data.taboos).map(x => `- ${x}`).join('\n'),
            holidaysContent: list(this.data.holidays).map(x => `- ${x}`).join('\n'),
            symbolsContent: list(this.data.symbols).map(x => `- ${x}`).join('\n'),
            connectionsContent: list(this.data.connections).map(x => `[[${x}]]`).join(', '),
            timelineContent: list(this.data.timeline).map(x => `- ${x}`).join('\n'),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Религия') || '';
            }
        } catch {}
        
        const content = await window.generateFromTemplate('Новая_религия', data, this.plugin);
        const folder = `${this.projectPath}/Религия`;
        
        if (this.options.targetFile instanceof TFile) {
            await this.app.vault.modify(this.options.targetFile, content);
            await this.app.workspace.getLeaf(true).openFile(this.options.targetFile);
        } else {
            await window.ensureEntityInfrastructure(folder, cleanName, this.app);
            const path = `${folder}/${cleanName}.md`;
            await window.safeCreateFile(path, content, this.app);
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
        }
        
        new this.Notice(`Религия «${name}» создана.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = ReligionWizardModal;
