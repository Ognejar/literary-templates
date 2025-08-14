/**
 * @file       CultWizardModal.js
 * @description Мастер создания культов
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новый_культ.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class CultWizardModal extends EntityWizardBase {
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
            parentReligion: '',
            description: '',
            distinguishingFeatures: '',
            dogmas: '',
            practices: '',
            leaders: '',
            goals: '',
            taboos: '',
            connections: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderBeliefs.bind(this),
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
            .setName('Название культа')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Родительская религия')
            .addText(t => t.setValue(this.data.parentReligion).onChange(v => this.data.parentReligion = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new Setting(this.contentEl)
            .setName('Отличительные черты (через запятую)')
            .addTextArea(t => t.setValue(this.data.distinguishingFeatures).onChange(v => this.data.distinguishingFeatures = v));
    }

    renderBeliefs() {
        const h = this.contentEl.createEl('h2', { text: 'Верования и практики' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Догмы и интерпретации (через запятую)')
            .addTextArea(t => t.setValue(this.data.dogmas).onChange(v => this.data.dogmas = v));
        
        new Setting(this.contentEl)
            .setName('Практики (через запятую)')
            .addTextArea(t => t.setValue(this.data.practices).onChange(v => this.data.practices = v));
        
        new Setting(this.contentEl)
            .setName('Лидеры и структура (через запятую)')
            .addTextArea(t => t.setValue(this.data.leaders).onChange(v => this.data.leaders = v));
        
        new Setting(this.contentEl)
            .setName('Цели (через запятую)')
            .addTextArea(t => t.setValue(this.data.goals).onChange(v => this.data.goals = v));
        
        new Setting(this.contentEl)
            .setName('Табу (через запятую)')
            .addTextArea(t => t.setValue(this.data.taboos).onChange(v => this.data.taboos = v));
        
        new Setting(this.contentEl)
            .setName('Связи с миром (через запятую)')
            .addText(t => t.setValue(this.data.connections).onChange(v => this.data.connections = v));
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр культа' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Родительская религия: ${this.data.parentReligion || ''}` });
        if (this.data.distinguishingFeatures) {
            box.createEl('div', { text: `Особенность: ${this.data.distinguishingFeatures.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название культа');
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
            parentReligion: clean(this.data.parentReligion),
            description: clean(this.data.description),
            distinguishingFeaturesContent: list(this.data.distinguishingFeatures).map(x => `- ${x}`).join('\n'),
            dogmasContent: list(this.data.dogmas).map(x => `- ${x}`).join('\n'),
            practicesContent: list(this.data.practices).map(x => `- ${x}`).join('\n'),
            leadersContent: list(this.data.leaders).map(x => `- ${x}`).join('\n'),
            goalsContent: list(this.data.goals).map(x => `- ${x}`).join('\n'),
            taboosContent: list(this.data.taboos).map(x => `- ${x}`).join('\n'),
            connectionsContent: list(this.data.connections).map(x => `[[${x}]]`).join(', '),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Культ') || '';
            }
        } catch {}
        
        const content = await window.generateFromTemplate('Новый_культ', data, this.plugin);
        const folder = `${this.projectPath}/Религия/Культы`;
        
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
        
        new this.Notice(`Культ «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = CultWizardModal;
