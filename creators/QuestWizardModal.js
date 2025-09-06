/**
 * @file       QuestWizardModal.js
 * @description Мастер создания квестов
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новый_квест.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class QuestWizardModal extends EntityWizardBase {
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
            priority: '',
            status: '',
            questGiver: '',
            description: '',
            objectives: '',
            requirements: '',
            rewards: '',
            timeLimit: '',
            stages: '',
            characters: '',
            locations: '',
            events: '',
            consequences: '',
            history: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderDetails.bind(this),
            this.renderObjectives.bind(this),
            this.renderRewards.bind(this),
            this.renderConnections.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            types: ['Основной сюжет', 'Побочный квест', 'Повторяющийся', 'Скрытый', 'Цепочка квестов'],
            priorities: ['Критично', 'Высокий', 'Средний', 'Низкий'],
            statuses: ['Доступен', 'В процессе', 'Завершен', 'Провален', 'Отменен']
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
        
        new this.Setting(this.contentEl)
            .setName('Название квеста')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new this.Setting(this.contentEl)
            .setName('Тип квеста')
            .addDropdown(d => {
                this.config.types.forEach(type => d.addOption(type, type));
                d.setValue(this.data.type);
                d.onChange(v => this.data.type = v);
            });
        
        new this.Setting(this.contentEl)
            .setName('Приоритет')
            .addDropdown(d => {
                this.config.priorities.forEach(priority => d.addOption(priority, priority));
                d.setValue(this.data.priority);
                d.onChange(v => this.data.priority = v);
            });
        
        new this.Setting(this.contentEl)
            .setName('Статус')
            .addDropdown(d => {
                this.config.statuses.forEach(status => d.addOption(status, status));
                d.setValue(this.data.status);
                d.onChange(v => this.data.status = v);
            });
        
        new this.Setting(this.contentEl)
            .setName('Дающий квест')
            .addText(t => t.setValue(this.data.questGiver).onChange(v => this.data.questGiver = v));
    }

    renderDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали квеста' });
        h.classList.add('lt-header');
        
        new this.Setting(this.contentEl)
            .setName('Описание квеста')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new this.Setting(this.contentEl)
            .setName('История квеста')
            .addTextArea(t => t.setValue(this.data.history).onChange(v => this.data.history = v));
    }

    renderObjectives() {
        const h = this.contentEl.createEl('h2', { text: 'Цели и выполнение' });
        h.classList.add('lt-header');
        
        new this.Setting(this.contentEl)
            .setName('Цели квеста (через запятую)')
            .addTextArea(t => t.setValue(this.data.objectives).onChange(v => this.data.objectives = v));
        
        new this.Setting(this.contentEl)
            .setName('Условия выполнения (через запятую)')
            .addTextArea(t => t.setValue(this.data.requirements).onChange(v => this.data.requirements = v));
        
        new this.Setting(this.contentEl)
            .setName('Этапы выполнения (через запятую)')
            .addTextArea(t => t.setValue(this.data.stages).onChange(v => this.data.stages = v));
        
        new this.Setting(this.contentEl)
            .setName('Временные ограничения')
            .addText(t => t.setValue(this.data.timeLimit).onChange(v => this.data.timeLimit = v));
    }

    renderRewards() {
        const h = this.contentEl.createEl('h2', { text: 'Награды и последствия' });
        h.classList.add('lt-header');
        
        new this.Setting(this.contentEl)
            .setName('Награды (через запятую)')
            .addTextArea(t => t.setValue(this.data.rewards).onChange(v => this.data.rewards = v));
        
        new this.Setting(this.contentEl)
            .setName('Последствия и влияние')
            .addTextArea(t => t.setValue(this.data.consequences).onChange(v => this.data.consequences = v));
    }

    renderConnections() {
        const h = this.contentEl.createEl('h2', { text: 'Связи с миром' });
        h.classList.add('lt-header');
        
        new this.Setting(this.contentEl)
            .setName('Связанные персонажи (через запятую)')
            .addText(t => t.setValue(this.data.characters).onChange(v => this.data.characters = v));
        
        new this.Setting(this.contentEl)
            .setName('Связанные локации (через запятую)')
            .addText(t => t.setValue(this.data.locations).onChange(v => this.data.locations = v));
        
        new this.Setting(this.contentEl)
            .setName('Связанные события (через запятую)')
            .addText(t => t.setValue(this.data.events).onChange(v => this.data.events = v));
        
        new this.Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр квеста' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Тип: ${this.data.type || ''}` });
        box.createEl('div', { text: `Приоритет: ${this.data.priority || ''}` });
        box.createEl('div', { text: `Дающий: ${this.data.questGiver || ''}` });
        if (this.data.objectives) {
            box.createEl('div', { text: `Цель: ${this.data.objectives.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название квеста');
                return false;
            }
            if (!this.data.type) {
                new this.Notice('Выберите тип квеста');
                return false;
            }
            if (!this.data.priority) {
                new this.Notice('Выберите приоритет');
                return false;
            }
        }
        if (this.step === 1) {
            if (!String(this.data.description || '').trim()) {
                new this.Notice('Опишите квест');
                return false;
            }
        }
        if (this.step === 2) {
            if (!String(this.data.objectives || '').trim()) {
                new this.Notice('Укажите цели квеста');
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
            priority: this.data.priority,
            status: this.data.status,
            questGiver: clean(this.data.questGiver),
            description: clean(this.data.description),
            objectivesContent: list(this.data.objectives).map(x => `- ${x}`).join('\n'),
            requirementsContent: list(this.data.requirements).map(x => `- ${x}`).join('\n'),
            rewardsContent: list(this.data.rewards).map(x => `- ${x}`).join('\n'),
            timeLimitContent: clean(this.data.timeLimit),
            stagesContent: list(this.data.stages).map(x => `- ${x}`).join('\n'),
            charactersContent: list(this.data.characters).map(x => `[[${x}]]`).join(', '),
            locationsContent: list(this.data.locations).map(x => `[[${x}]]`).join(', '),
            eventsContent: list(this.data.events).map(x => `[[${x}]]`).join(', '),
            consequencesContent: clean(this.data.consequences),
            historyContent: clean(this.data.history),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Квест') || '';
            }
        } catch (e) {}
        
        const content = await window.generateFromTemplate('Новый_квест', data, this.plugin);
        const folder = `${this.projectPath}/Квесты`;
        
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
        
        new this.Notice(`Квест «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = QuestWizardModal;
