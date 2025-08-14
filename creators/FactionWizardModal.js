/**
 * @file       FactionWizardModal.js
 * @description Мастер создания фракций
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новая_фракция.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class FactionWizardModal extends EntityWizardBase {
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
            ideology: '',
            leaders: '',
            members: '',
            resources: '',
            territories: '',
            relations: '',
            history: '',
            locations: '',
            events: '',
            organizations: '',
            artifacts: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderIdeology.bind(this),
            this.renderStructure.bind(this),
            this.renderGeneralDetails.bind(this),
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
            .setName('Название фракции')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new Setting(this.contentEl)
            .setName('Идеология')
            .addTextArea(t => t.setValue(this.data.ideology).onChange(v => this.data.ideology = v));
    }

    renderIdeology() {
        const h = this.contentEl.createEl('h2', { text: 'Идеология и цели' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Лидеры (через запятую)')
            .addText(t => t.setValue(this.data.leaders).onChange(v => this.data.leaders = v));
        
        new Setting(this.contentEl)
            .setName('Члены (через запятую)')
            .addText(t => t.setValue(this.data.members).onChange(v => this.data.members = v));
        
        new Setting(this.contentEl)
            .setName('Ресурсы (через запятую)')
            .addTextArea(t => t.setValue(this.data.resources).onChange(v => this.data.resources = v));
    }

    renderStructure() {
        const h = this.contentEl.createEl('h2', { text: 'Структура и территория' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Территории (через запятую)')
            .addTextArea(t => t.setValue(this.data.territories).onChange(v => this.data.territories = v));
        
        new Setting(this.contentEl)
            .setName('Отношения с другими фракциями (через запятую)')
            .addTextArea(t => t.setValue(this.data.relations).onChange(v => this.data.relations = v));
        
        new Setting(this.contentEl)
            .setName('История развития (через запятую)')
            .addTextArea(t => t.setValue(this.data.history).onChange(v => this.data.history = v));
    }

    renderGeneralDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Связи с миром' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Связанные локации (через запятую)')
            .addText(t => t.setValue(this.data.locations).onChange(v => this.data.locations = v));
        
        new Setting(this.contentEl)
            .setName('Связанные события (через запятую)')
            .addText(t => t.setValue(this.data.events).onChange(v => this.data.events = v));
        
        new Setting(this.contentEl)
            .setName('Связанные организации (через запятую)')
            .addText(t => t.setValue(this.data.organizations).onChange(v => this.data.organizations = v));
        
        new Setting(this.contentEl)
            .setName('Связанные артефакты (через запятую)')
            .addText(t => t.setValue(this.data.artifacts).onChange(v => this.data.artifacts = v));
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр фракции' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        if (this.data.ideology) {
            box.createEl('div', { text: `Идеология: ${this.data.ideology.substring(0, 50)}...` });
        }
        if (this.data.leaders) {
            box.createEl('div', { text: `Лидер: ${this.data.leaders.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название фракции');
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
            ideology: clean(this.data.ideology),
            leadersContent: list(this.data.leaders).map(x => `[[${x}]]`).join(', '),
            membersContent: list(this.data.members).map(x => `[[${x}]]`).join(', '),
            resourcesContent: list(this.data.resources).map(x => `- ${x}`).join('\n'),
            territoriesContent: list(this.data.territories).map(x => `- ${x}`).join('\n'),
            relationsContent: list(this.data.relations).map(x => `- ${x}`).join('\n'),
            historyContent: list(this.data.history).map(x => `- ${x}`).join('\n'),
            locationsContent: list(this.data.locations).map(x => `[[${x}]]`).join(', '),
            eventsContent: list(this.data.events).map(x => `[[${x}]]`).join(', '),
            organizationsContent: list(this.data.organizations).map(x => `[[${x}]]`).join(', '),
            artifactsContent: list(this.data.artifacts).map(x => `[[${x}]]`).join(', '),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Фракция') || '';
            }
        } catch {}
        
        const content = await window.generateFromTemplate('Новая_фракция', data, this.plugin);
        const folder = `${this.projectPath}/Фракции`;
        
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
        
        new this.Notice(`Фракция «${name}» создана.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = FactionWizardModal;
