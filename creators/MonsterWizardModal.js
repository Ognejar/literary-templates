/**
 * @file       MonsterWizardModal.js
 * @description Мастер создания монстра для мира
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-09-03
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

var MonsterWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.addStyles && this.addStyles();
        this.data = {
            name: '',
            type: '',
            size: '',
            intelligence: '',
            alignment: '',
            description: '',
            abilities: '',
            weaknesses: '',
            tags: '',
            featuresContent: '',
            faction: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderDescription.bind(this),
            this.renderAbilities.bind(this),
            this.renderFeatures.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            types: ['Дракон', 'Гоблин', 'Орк', 'Тролль', 'Вампир', 'Оборотень', 'Призрак', 'Зомби', 'Демон', 'Элементаль', 'Другое'],
            sizes: ['Крошечный', 'Маленький', 'Средний', 'Большой', 'Огромный', 'Гигантский'],
            intelligences: ['Животное', 'Примитивное', 'Среднее', 'Высокое', 'Гениальное'],
            alignments: ['Добрый', 'Нейтральный', 'Злой', 'Хаотичный', 'Законопослушный']
        };
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
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
            .setName('Имя монстра')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        new this.Setting(this.contentEl)
            .setName('Тип')
            .addDropdown(d => {
                this.config.types.forEach(type => d.addOption(type, type));
                d.setValue(this.data.type);
                d.onChange(v => this.data.type = v);
            });
        new this.Setting(this.contentEl)
            .setName('Размер')
            .addDropdown(d => {
                this.config.sizes.forEach(size => d.addOption(size, size));
                d.setValue(this.data.size);
                d.onChange(v => this.data.size = v);
            });
        new this.Setting(this.contentEl)
            .setName('Интеллект')
            .addDropdown(d => {
                this.config.intelligences.forEach(iq => d.addOption(iq, iq));
                d.setValue(this.data.intelligence);
                d.onChange(v => this.data.intelligence = v);
            });
        new this.Setting(this.contentEl)
            .setName('Мировоззрение')
            .addDropdown(d => {
                this.config.alignments.forEach(al => d.addOption(al, al));
                d.setValue(this.data.alignment);
                d.onChange(v => this.data.alignment = v);
            });
        this.renderFaction(this.contentEl);
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

    renderDescription() {
        const h = this.contentEl.createEl('h2', { text: 'Описание монстра' });
        h.classList.add('lt-header');
        new this.Setting(this.contentEl)
            .setName('Описание (внешность, повадки, особенности)')
            .addTextArea(t => {
                t.setValue(this.data.description).onChange(v => this.data.description = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderAbilities() {
        const h = this.contentEl.createEl('h2', { text: 'Способности и слабости' });
        h.classList.add('lt-header');
        new this.Setting(this.contentEl)
            .setName('Способности (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.abilities).onChange(v => this.data.abilities = v);
                t.inputEl.style.minHeight = '80px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        new this.Setting(this.contentEl)
            .setName('Слабости (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.weaknesses).onChange(v => this.data.weaknesses = v);
                t.inputEl.style.minHeight = '80px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        new this.Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.tags).onChange(v => this.data.tags = v);
                t.inputEl.style.minHeight = '40px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderFeatures() {
        const h = this.contentEl.createEl('h2', { text: 'Особенности монстра' });
        h.classList.add('lt-header');
        new this.Setting(this.contentEl)
            .setName('Особенности (featuresContent)')
            .addTextArea(t => {
                t.setValue(this.data.featuresContent).onChange(v => this.data.featuresContent = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр монстра' });
        h.classList.add('lt-header');
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Имя: ${this.data.name || ''}` });
        box.createEl('div', { text: `Тип: ${this.data.type || ''}` });
        box.createEl('div', { text: `Размер: ${this.data.size || ''}` });
        box.createEl('div', { text: `Интеллект: ${this.data.intelligence || ''}` });
        box.createEl('div', { text: `Мировоззрение: ${this.data.alignment || ''}` });
        if (this.data.faction) box.createEl('div', { text: `Фракция: ${this.data.faction}` });
        if (this.data.abilities) box.createEl('div', { text: `Способности: ${this.data.abilities}` });
        if (this.data.weaknesses) box.createEl('div', { text: `Слабости: ${this.data.weaknesses}` });
        if (this.data.description) box.createEl('div', { text: `Описание: ${this.data.description}` });
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите имя монстра');
                return false;
            }
            if (!this.data.type) {
                new this.Notice('Выберите тип');
                return false;
            }
            if (!this.data.size) {
                new this.Notice('Выберите размер');
                return false;
            }
            if (!this.data.intelligence) {
                new this.Notice('Выберите интеллект');
                return false;
            }
            if (!this.data.alignment) {
                new this.Notice('Выберите мировоззрение');
                return false;
            }
        }
        if (this.step === 1) {
            if (!String(this.data.description || '').trim()) {
                new this.Notice('Опишите монстра');
                return false;
            }
        }
        if (this.step === 3) {
            if (!String(this.data.featuresContent || '').trim()) {
                new this.Notice('Опишите особенности монстра');
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
        // imageBlock: обязательно, определяется автоматически
        let imageBlock = '';
        if (window.litSettingsService && window.litSettingsService.findTagImage) {
            imageBlock = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Монстр') || '';
        }
        if (!imageBlock) {
            new this.Notice('Не удалось найти изображение для монстра (Теговые_картинки/Монстр.jpg).');
            return;
        }
        // Создать подстраницу особенностей
        const folder = `${this.projectPath}/Монстры`;
        await window.ensureEntityInfrastructure(folder, cleanName, this.app);
        const featuresPath = `${folder}/${cleanName}_особенности.md`;
        await window.safeCreateFile(featuresPath, clean(this.data.featuresContent), this.app);
        // В основной файл вставлять ссылку на подстраницу
        const data = {
            name,
            date,
            type: this.data.type,
            size: this.data.size,
            intelligence: this.data.intelligence,
            alignment: this.data.alignment,
            description: clean(this.data.description),
            abilities: list(this.data.abilities).map(x => `- ${x}`).join('\n'),
            weaknesses: list(this.data.weaknesses).map(x => `- ${x}`).join('\n'),
            tags: list(this.data.tags).join(', '),
            imageBlock,
            featuresContent: `![[${cleanName}_особенности.md]]`
        };
        const path = `${folder}/${cleanName}.md`;
        const content = await window.generateFromTemplate('Новый_монстр', data, this.plugin);
        await window.safeCreateFile(path, content, this.app);
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file && file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
        new this.Notice(`Монстр «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
};

module.exports = { MonsterWizardModal };

if (typeof window !== 'undefined') {
    window.MonsterWizardModal = MonsterWizardModal;
}
