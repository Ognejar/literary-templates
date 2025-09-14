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
const { WizardUI } = require('../ui/WizardUI.js');

class ReligionWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.ui = new WizardUI({ SettingClass: SettingClass });
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
        // Унифицированный прогресс через UI-слой
        this.ui.progress(this.contentEl, this.step, this.steps.length);
        
        this.steps[this.step]();
        
        this.renderNavigation();
    }

    renderBasic() {
        this.ui.header(this.contentEl, 'Основная информация');
        
        this.ui.settingText(this.contentEl, 'Название религии', () => this.data.name, v => this.data.name = v);
        this.ui.settingTextArea(this.contentEl, 'Описание', () => this.data.description, v => this.data.description = v);
        this.ui.settingText(this.contentEl, 'Связи с миром (через запятую)', () => this.data.connections, v => this.data.connections = v);
        this.ui.settingText(this.contentEl, 'Теги (через запятую)', () => this.data.tags, v => this.data.tags = v);
    }

    renderBeliefs() {
        this.ui.header(this.contentEl, 'Верования и практики');
        
        this.ui.settingTextArea(this.contentEl, 'Доктрины (через запятую)', () => this.data.doctrines, v => this.data.doctrines = v);
        this.ui.settingTextArea(this.contentEl, 'Пантеон (через запятую)', () => this.data.pantheon, v => this.data.pantheon = v);
        this.ui.settingTextArea(this.contentEl, 'Ритуалы (через запятую)', () => this.data.rituals, v => this.data.rituals = v);
        this.ui.settingTextArea(this.contentEl, 'Табу (через запятую)', () => this.data.taboos, v => this.data.taboos = v);
        this.ui.settingTextArea(this.contentEl, 'Праздники (через запятую)', () => this.data.holidays, v => this.data.holidays = v);
        this.ui.settingTextArea(this.contentEl, 'Символы (через запятую)', () => this.data.symbols, v => this.data.symbols = v);
    }

    renderStructure() {
        this.ui.header(this.contentEl, 'Структура и история');
        
        this.ui.settingTextArea(this.contentEl, 'Структура (через запятую)', () => this.data.structure, v => this.data.structure = v);
        this.ui.settingTextArea(this.contentEl, 'Храмы и святилища (через запятую)', () => this.data.shrines, v => this.data.shrines = v);
        this.ui.settingTextArea(this.contentEl, 'История развития (через запятую)', () => this.data.timeline, v => this.data.timeline = v);
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
        const list = s => clean(s).split(',').map(x => x.trim().replace(/\s+/g, '_')).filter(Boolean);
        
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
        } catch (e) {}
        
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
