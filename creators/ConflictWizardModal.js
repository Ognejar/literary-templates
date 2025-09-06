/**
 * @file       ConflictWizardModal.js
 * @description Мастер создания конфликта (Конфликт)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies HtmlWizardModal
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новый_конфликт.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');

var ConflictWizardModal = class extends HtmlWizardModal {
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
            stakes: '',
            causes: '',
            sides: '',
            goals: '',
            resources: '',
            tactics: '',
            triggers: '',
            stage: '',
            risks: '',
            outcomes: '',
            timeline: '',
            // связи
            locations: '',
            characters: '',
            events: '',
            // теги
            tags: '',
        };
        this.step = 0;
        this.steps = [
            this.renderMain.bind(this),
            this.renderSides.bind(this),
            this.renderDynamics.bind(this),
            this.renderRisksOutcomes.bind(this),
            this.renderLinksTags.bind(this),
            this.renderPreview.bind(this),
        ];
    }

    async onOpen() {
        this.applyBaseStyles();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        if (this.options && typeof this.options.prefillName === 'string' && this.options.prefillName.trim()) {
            if (!this.data.name) this.data.name = this.options.prefillName.trim();
        }
        this.render();
    }

    render() {
        this.contentEl.empty();
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const progressFill = progress.createEl('div', { cls: 'lt-progress__fill' });
        progressFill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        this.steps[this.step]();
        this.renderNav();
    }

    renderMain() {
        const h = this.contentEl.createEl('h2', { text: 'Основная информация' });
        h.classList.add('lt-header');
        new Setting(this.contentEl).setName('Название').addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        new Setting(this.contentEl).setName('Краткое описание').addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        new Setting(this.contentEl).setName('Ставки').addTextArea(t => t.setValue(this.data.stakes).onChange(v => this.data.stakes = v));
        new Setting(this.contentEl).setName('Причины/истоки').addTextArea(t => t.setValue(this.data.causes).onChange(v => this.data.causes = v));
    }

    renderSides() {
        const h = this.contentEl.createEl('h2', { text: 'Стороны и цели' });
        h.classList.add('lt-header');
        new Setting(this.contentEl).setName('Стороны и участники').addTextArea(t => t.setValue(this.data.sides).onChange(v => this.data.sides = v));
        new Setting(this.contentEl).setName('Цели/мотивации').addTextArea(t => t.setValue(this.data.goals).onChange(v => this.data.goals = v));
        new Setting(this.contentEl).setName('Ресурсы').addTextArea(t => t.setValue(this.data.resources).onChange(v => this.data.resources = v));
    }

    renderDynamics() {
        const h = this.contentEl.createEl('h2', { text: 'Динамика конфликта' });
        h.classList.add('lt-header');
        new Setting(this.contentEl).setName('Тактики/стратегии').addTextArea(t => t.setValue(this.data.tactics).onChange(v => this.data.tactics = v));
        new Setting(this.contentEl).setName('Триггеры/эскалация').addTextArea(t => t.setValue(this.data.triggers).onChange(v => this.data.triggers = v));
        new Setting(this.contentEl).setName('Текущая стадия').addText(t => t.setValue(this.data.stage).onChange(v => this.data.stage = v));
        new Setting(this.contentEl).setName('Таймлайн').addTextArea(t => t.setValue(this.data.timeline).onChange(v => this.data.timeline = v));
    }

    renderRisksOutcomes() {
        const h = this.contentEl.createEl('h2', { text: 'Риски и последствия' });
        h.classList.add('lt-header');
        new Setting(this.contentEl).setName('Риски').addTextArea(t => t.setValue(this.data.risks).onChange(v => this.data.risks = v));
        new Setting(this.contentEl).setName('Последствия/исходы').addTextArea(t => t.setValue(this.data.outcomes).onChange(v => this.data.outcomes = v));
    }

    renderLinksTags() {
        const h = this.contentEl.createEl('h2', { text: 'Связи и теги' });
        h.classList.add('lt-header');
        new Setting(this.contentEl).setName('Локации (через запятую)').addText(t => t.setValue(this.data.locations).onChange(v => this.data.locations = v));
        new Setting(this.contentEl).setName('Персонажи (через запятую)').addText(t => t.setValue(this.data.characters).onChange(v => this.data.characters = v));
        new Setting(this.contentEl).setName('События (через запятую)').addText(t => t.setValue(this.data.events).onChange(v => this.data.events = v));
        new Setting(this.contentEl).setName('Теги (через запятую)').addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр' });
        h.classList.add('lt-header');
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Описание: ${this.data.description || ''}` });
        box.createEl('div', { text: `Стороны: ${this.data.sides || ''}` });
        box.createEl('div', { text: `Стадия: ${this.data.stage || ''}` });
    }

    renderNav() {
        const nav = this.contentEl.createEl('div', { cls: 'lt-nav' });
        if (this.step > 0) {
            const back = this.createButton('secondary', '← Назад');
            back.onclick = () => { this.step--; this.render(); };
            nav.appendChild(back);
        }
        const next = this.createButton('primary', this.step === this.steps.length - 1 ? '✓ Создать' : 'Далее →');
        next.onclick = () => {
            if (!this.validateStep()) return;
            if (this.step === this.steps.length - 1) {
                this.finish();
            } else {
                this.step++;
                this.render();
            }
        };
        nav.appendChild(next);
    }

    validateStep() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) { new this.Notice('Введите название конфликта'); return false; }
            if (!String(this.data.description || '').trim()) { new this.Notice('Добавьте краткое описание'); return false; }
        }
        return true;
    }

    async finish() {
        const name = String(this.data.name || '').trim();
        const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0,10));
        // Списки
        const normalizeList = (s) => (String(s || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean));
        const data = {
            name,
            date,
            description: String(this.data.description || '').trim(),
            stakesContent: String(this.data.stakes || '').trim(),
            causesContent: String(this.data.causes || '').trim(),
            sidesContent: String(this.data.sides || '').trim(),
            goalsContent: String(this.data.goals || '').trim(),
            resourcesContent: String(this.data.resources || '').trim(),
            tacticsContent: String(this.data.tactics || '').trim(),
            triggersContent: String(this.data.triggers || '').trim(),
            stage: String(this.data.stage || '').trim(),
            risksContent: String(this.data.risks || '').trim(),
            outcomesContent: String(this.data.outcomes || '').trim(),
            timelineContent: String(this.data.timeline || '').trim(),
            locationsContent: normalizeList(this.data.locations).map(x => `[[${x}]]`).join(', '),
            charactersContent: normalizeList(this.data.characters).map(x => `[[${x}]]`).join(', '),
            eventsContent: normalizeList(this.data.events).map(x => `[[${x}]]`).join(', '),
            tagsContent: normalizeList(this.data.tags).join(', '),
            tagImage: '',
        };
        try {
            if (window.litSettingsService) {
                const firstTag = normalizeList(this.data.tags)[0] || 'Конфликт';
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, firstTag) || '';
            }
        } catch (e) {}

        const content = await window.generateFromTemplate('Новый_конфликт', data, this.plugin);
        const targetFolder = `${this.projectPath}/Конфликты`;
        if (this.options && this.options.targetFile instanceof TFile) {
            await this.app.vault.modify(this.options.targetFile, content);
            await this.app.workspace.getLeaf(true).openFile(this.options.targetFile);
        } else {
            await window.ensureEntityInfrastructure(targetFolder, cleanName, this.app);
            const targetPath = `${targetFolder}/${cleanName}.md`;
            await window.safeCreateFile(targetPath, content, this.app);
            const file = this.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf(true).openFile(file);
            }
        }
        new this.Notice(`Конфликт «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
};

module.exports = { ConflictWizardModal };


