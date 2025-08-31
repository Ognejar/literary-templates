/**
 * @file       TaskWizardModal.js
 * @description Мастер создания задач для Obsidian
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/functional_card_Вставить_задачу.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

var TaskWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        
        // Добавляем CSS стили для textarea
        this.addStyles();
        
        this.data = {
            taskName: '',
            description: '',
            priority: 'Средний',
            status: 'Новая',
            dueDate: '',
            details: '',
            subtasks: '',
            dependencies: '',
            resources: '',
            progress: '',
            result: '',
            characters: '',
            events: '',
            locations: '',
            quests: '',
            features: ''
        };
        
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderDetails.bind(this),
            this.renderConnections.bind(this),
            this.renderPreview.bind(this)
        ];
        
        this.config = {
            priorities: ['Низкий', 'Средний', 'Высокий', 'Критический'],
            statuses: ['Новая', 'В работе', 'На паузе', 'Завершена', 'Отменена']
        };
    }

    addStyles() {
        if (!this.app.workspace.containerEl.ownerDocument.getElementById('lt-task-styles')) {
            const style = this.app.workspace.containerEl.ownerDocument.createElement('style');
            style.id = 'lt-task-styles';
            style.textContent = `
                .lt-textarea {
                    min-height: 120px !important;
                    width: 100% !important;
                    resize: vertical !important;
                    font-family: inherit !important;
                    line-height: 1.4 !important;
                }
                .lt-textarea:focus {
                    border-color: var(--interactive-accent) !important;
                    box-shadow: 0 0 0 2px var(--interactive-accent-hover) !important;
                }
                .lt-priority-high { color: #ff6b6b !important; }
                .lt-priority-critical { color: #ee5a24 !important; }
                .lt-priority-medium { color: #feca57 !important; }
                .lt-priority-low { color: #48dbfb !important; }
            `;
            this.app.workspace.containerEl.ownerDocument.head.appendChild(style);
        }
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        if (this.options.prefillName && !this.data.taskName) this.data.taskName = this.options.prefillName;
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
            .setName('Название задачи')
            .addText(t => t.setValue(this.data.taskName).onChange(v => this.data.taskName = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => {
                t.setValue(this.data.description).onChange(v => this.data.description = v);
                t.inputEl.style.minHeight = '80px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Приоритет')
            .addDropdown(d => {
                this.config.priorities.forEach(priority => d.addOption(priority, priority));
                d.setValue(this.data.priority);
                d.onChange(v => this.data.priority = v);
            });
        
        new Setting(this.contentEl)
            .setName('Статус')
            .addDropdown(d => {
                this.config.statuses.forEach(status => d.addOption(status, status));
                d.setValue(this.data.status);
                d.onChange(v => this.data.status = v);
            });
        
        new Setting(this.contentEl)
            .setName('Дата выполнения')
            .addText(t => t.setValue(this.data.dueDate).onChange(v => this.data.dueDate = v));
    }

    renderDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали задачи' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Подробное описание')
            .addTextArea(t => {
                t.setValue(this.data.details).onChange(v => this.data.details = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Подзадачи (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.subtasks).onChange(v => this.data.subtasks = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Зависимости (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.dependencies).onChange(v => this.data.dependencies = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Ресурсы (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.resources).onChange(v => this.data.resources = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Прогресс (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.progress).onChange(v => this.data.progress = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Ожидаемый результат')
            .addTextArea(t => {
                t.setValue(this.data.result).onChange(v => this.data.result = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderConnections() {
        const h = this.contentEl.createEl('h2', { text: 'Связи с миром' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Связанные персонажи (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.characters).onChange(v => this.data.characters = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Связанные события (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.events).onChange(v => this.data.events = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Связанные локации (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.locations).onChange(v => this.data.locations = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Связанные квесты (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.quests).onChange(v => this.data.quests = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Особенности и примечания')
            .addTextArea(t => {
                t.setValue(this.data.features).onChange(v => this.data.features = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр задачи' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.taskName || ''}` });
        box.createEl('div', { text: `Приоритет: ${this.data.priority || ''}` });
        box.createEl('div', { text: `Статус: ${this.data.status || ''}` });
        box.createEl('div', { text: `Дата: ${this.data.dueDate || ''}` });
        if (this.data.description) {
            box.createEl('div', { text: `Описание: ${this.data.description.substring(0, 100)}...` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.taskName || '').trim()) {
                new this.Notice('Введите название задачи');
                return false;
            }
            if (!String(this.data.description || '').trim()) {
                new this.Notice('Введите описание задачи');
                return false;
            }
        }
        return true;
    }

    async finish() {
        const clean = s => String(s || '').trim();
        const list = s => clean(s).split(',').map(x => x.trim()).filter(Boolean);
        
        const taskName = clean(this.data.taskName);
        const cleanName = taskName.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        
        const data = {
            taskName,
            date,
            description: clean(this.data.description),
            priority: this.data.priority,
            status: this.data.status,
            dueDate: clean(this.data.dueDate),
            detailsContent: clean(this.data.details),
            subtasksContent: list(this.data.subtasks).map(x => `- [ ] ${x}`).join('\n'),
            dependenciesContent: list(this.data.dependencies).map(x => `- [ ] ${x}`).join('\n'),
            resourcesContent: list(this.data.resources).map(x => `- [ ] ${x}`).join('\n'),
            progressContent: list(this.data.progress).map(x => `- [ ] ${x}`).join('\n'),
            resultContent: clean(this.data.result),
            charactersContent: list(this.data.characters).map(x => `[[${x}]]`).join(', '),
            eventsContent: list(this.data.events).map(x => `[[${x}]]`).join(', '),
            locationsContent: list(this.data.locations).map(x => `[[${x}]]`).join(', '),
            questsContent: list(this.data.quests).map(x => `[[${x}]]`).join(', '),
            featuresContent: clean(this.data.features),
        };
        
        const content = await window.generateFromTemplate('Вставить_задачу', data, this.plugin);
        const folder = `${this.projectPath}/Задачи`;
        
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
        
        new this.Notice(`Задача «${taskName}» создана.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
};

module.exports = { TaskWizardModal };
