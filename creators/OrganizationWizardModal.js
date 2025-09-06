/**
 * @file       OrganizationWizardModal.js
 * @description Мастер создания организаций
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новая_организация.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class OrganizationWizardModal extends EntityWizardBase {
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
            type: '',
            description: '',
            leaders: '',
            members: '',
            goals: '',
            headquarters: '',
            features: '',
            tags: '',
            faction: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderDetails.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            types: ['Гильдия', 'Орден', 'Братство', 'Корпорация', 'Секта', 'Партия', 'Академия', 'Другое']
        };
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
            .setName('Название организации')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Тип организации')
            .addDropdown(d => {
                this.config.types.forEach(type => d.addOption(type, type));
                d.setValue(this.data.type);
                d.onChange(v => this.data.type = v);
            });
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
    }

    renderFaction(contentEl) {
        new this.Setting(contentEl)
            .setName('Фракция (опционально)')
            .addText(text => {
                text.setPlaceholder('Введите название фракции')
                    .setValue(this.data.faction || '')
                    .onChange(value => this.data.faction = value);
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали организации' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Лидеры (через запятую)')
            .addText(t => t.setValue(this.data.leaders).onChange(v => this.data.leaders = v));
        
        new Setting(this.contentEl)
            .setName('Члены (через запятую)')
            .addText(t => t.setValue(this.data.members).onChange(v => this.data.members = v));
        
        new Setting(this.contentEl)
            .setName('Цели (через запятую)')
            .addTextArea(t => t.setValue(this.data.goals).onChange(v => this.data.goals = v));
        
        new Setting(this.contentEl)
            .setName('Штаб-квартира')
            .addText(t => t.setValue(this.data.headquarters).onChange(v => this.data.headquarters = v));
        
        new Setting(this.contentEl)
            .setName('Особенности (через запятую)')
            .addTextArea(t => t.setValue(this.data.features).onChange(v => this.data.features = v));
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр организации' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Тип: ${this.data.type || ''}` });
        if (this.data.leaders) {
            box.createEl('div', { text: `Лидер: ${this.data.leaders.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название организации');
                return false;
            }
            if (!this.data.type) {
                new this.Notice('Выберите тип организации');
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
            type: this.data.type,
            description: clean(this.data.description),
            leadersContent: list(this.data.leaders).map(x => `[[${x}]]`).join(', '),
            membersContent: list(this.data.members).map(x => `[[${x}]]`).join(', '),
            goalsContent: list(this.data.goals).map(x => `- ${x}`).join('\n'),
            headquartersContent: clean(this.data.headquarters),
            featuresContent: list(this.data.features).map(x => `- ${x}`).join('\n'),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Организация') || '';
            }
        } catch (e) {}
        
        const content = await window.generateFromTemplate('Новая_организация', data, this.plugin);
        const folder = `${this.projectPath}/Организации`;
        
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
        
        new this.Notice(`Организация «${name}» создана.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = OrganizationWizardModal;
