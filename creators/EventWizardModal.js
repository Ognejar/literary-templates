/**
 * @file       EventWizardModal.js
 * @description Мастер создания событий
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новое_событие.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class EventWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.data = {
            name: '',
            type: '',
            status: '',
            importance: '',
            description: '',
            location: '',
            time: '',
            participants: '',
            causes: '',
            progression: '',
            climax: '',
            resolution: '',
            immediateConsequences: '',
            longTermConsequences: '',
            worldImpact: '',
            relatedCharacters: '',
            relatedLocations: '',
            relatedEvents: '',
            relatedQuests: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderDetails.bind(this),
            this.renderProgression.bind(this),
            this.renderConsequences.bind(this),
            this.renderConnections.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            types: ['Битва', 'Политическое событие', 'Природное явление', 'Магическое событие', 'Социальное изменение', 'Технологический прорыв', 'Другое'],
            statuses: ['Планируется', 'В процессе', 'Завершено', 'Отменено', 'Отложено'],
            importance: ['Критично', 'Высокое', 'Среднее', 'Низкое', 'Фоновое']
        };
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '1000px';
        this.modalEl.style.width = '1000px';
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
        
        this.addTextInput(this.contentEl, 'Название события', this.data.name, v => this.data.name = v);
        
        this.addDropdownInput(this.contentEl, 'Тип события', this.data.type, this.config.types, v => this.data.type = v);
        
        this.addDropdownInput(this.contentEl, 'Статус', this.data.status, this.config.statuses, v => this.data.status = v);
        
        this.addDropdownInput(this.contentEl, 'Важность', this.data.importance, this.config.importance, v => this.data.importance = v);
        
        this.addTextAreaInput(this.contentEl, 'Описание события', this.data.description, v => this.data.description = v);
    }

    renderDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали события' });
        h.classList.add('lt-header');
        
        this.addTextInput(this.contentEl, 'Место события', this.data.location, v => this.data.location = v);
        
        this.addTextInput(this.contentEl, 'Время события', this.data.time, v => this.data.time = v);
        
        this.addTextAreaInput(this.contentEl, 'Участники', this.data.participants, v => this.data.participants = v);
        
        this.addTextAreaInput(this.contentEl, 'Причины события', this.data.causes, v => this.data.causes = v);
    }

    renderProgression() {
        const h = this.contentEl.createEl('h2', { text: 'Развитие события' });
        h.classList.add('lt-header');
        
        this.addTextAreaInput(this.contentEl, 'Ход событий', this.data.progression, v => this.data.progression = v);
        
        this.addTextAreaInput(this.contentEl, 'Кульминация', this.data.climax, v => this.data.climax = v);
        
        this.addTextAreaInput(this.contentEl, 'Развязка', this.data.resolution, v => this.data.resolution = v);
    }

    renderConsequences() {
        const h = this.contentEl.createEl('h2', { text: 'Последствия' });
        h.classList.add('lt-header');
        
        this.addTextAreaInput(this.contentEl, 'Непосредственные последствия', this.data.immediateConsequences, v => this.data.immediateConsequences = v);
        
        this.addTextAreaInput(this.contentEl, 'Долгосрочные последствия', this.data.longTermConsequences, v => this.data.longTermConsequences = v);
        
        this.addTextAreaInput(this.contentEl, 'Влияние на мир', this.data.worldImpact, v => this.data.worldImpact = v);
    }

    renderConnections() {
        const h = this.contentEl.createEl('h2', { text: 'Связи с миром' });
        h.classList.add('lt-header');
        
        this.addTextInput(this.contentEl, 'Связанные персонажи (через запятую)', this.data.relatedCharacters, v => this.data.relatedCharacters = v);
        
        this.addTextInput(this.contentEl, 'Связанные локации (через запятую)', this.data.relatedLocations, v => this.data.relatedLocations = v);
        
        this.addTextInput(this.contentEl, 'Связанные события (через запятую)', this.data.relatedEvents, v => this.data.relatedEvents = v);
        
        this.addTextInput(this.contentEl, 'Связанные квесты (через запятую)', this.data.relatedQuests, v => this.data.relatedQuests = v);
        
        this.addTextInput(this.contentEl, 'Теги (через запятую)', this.data.tags, v => this.data.tags = v);
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр события' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Тип: ${this.data.type || ''}` });
        box.createEl('div', { text: `Статус: ${this.data.status || ''}` });
        box.createEl('div', { text: `Важность: ${this.data.importance || ''}` });
        if (this.data.location) {
            box.createEl('div', { text: `Место: ${this.data.location}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название события');
                return false;
            }
            if (!this.data.type) {
                new this.Notice('Выберите тип события');
                return false;
            }
            if (!this.data.status) {
                new this.Notice('Выберите статус события');
                return false;
            }
            if (!this.data.importance) {
                new this.Notice('Выберите важность события');
                return false;
            }
        }
        if (this.step === 1) {
            if (!String(this.data.description || '').trim()) {
                new this.Notice('Опишите событие');
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
            type: this.data.type,
            status: this.data.status,
            importance: this.data.importance,
            description: clean(this.data.description),
            location: clean(this.data.location),
            time: clean(this.data.time),
            participants: clean(this.data.participants),
            causes: clean(this.data.causes),
            progression: clean(this.data.progression),
            climax: clean(this.data.climax),
            resolution: clean(this.data.resolution),
            immediateConsequences: clean(this.data.immediateConsequences),
            longTermConsequences: clean(this.data.longTermConsequences),
            worldImpact: clean(this.data.worldImpact),
            relatedCharacters: list(this.data.relatedCharacters).map(x => `[[${x}]]`).join(', '),
            relatedLocations: list(this.data.relatedLocations).map(x => `[[${x}]]`).join(', '),
            relatedEvents: list(this.data.relatedEvents).map(x => `[[${x}]]`).join(', '),
            relatedQuests: list(this.data.relatedQuests).map(x => `[[${x}]]`).join(', '),
            tags: list(this.data.tags).join(', ')
        };
        
        try {
            const content = await window.generateFromTemplate('Новое_событие', data, this.plugin);
            const folder = `${this.projectPath}/События`;
            
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
            
            new this.Notice(`Событие «${name}» создано.`);
            this.close();
            if (this.onFinish) this.onFinish();
        } catch (error) {
            new this.Notice(`Ошибка создания события: ${error.message}`);
        }
    }
}

module.exports = { EventWizardModal };
