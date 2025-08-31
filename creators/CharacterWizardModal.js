/**
 * @file       CharacterWizardModal.js
 * @description Расширенный мастер создания персонажа для книги
 * @author     AI Assistant
 * @version    2.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Новый_персонаж.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

var CharacterWizardModal = class extends EntityWizardBase {
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
            name: '',
            age: '',
            gender: '',
            race: '',
            profession: '',
            status: '',
            storyRole: '',
            appearance: '',
            personality: '',
            background: '',
            motivation: '',
            relationships: '',
            abilities: '',
            weaknesses: '',
            equipment: '',
            development: '',
            locations: '',
            organizations: '',
            events: '',
            artifacts: '',
            otherCharacters: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderAppearance.bind(this),
            this.renderPersonality.bind(this),
            this.renderBackground.bind(this),
            this.renderAbilities.bind(this),
            this.renderRelations.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            genders: ['Мужской', 'Женский', 'Другой'],
            races: [],
            professions: [],
            statuses: ['Жив', 'Мертв', 'Пропал', 'В изгнании', 'В плену'],
            storyRoles: ['Главный герой', 'Антагонист', 'Второстепенный персонаж', 'Наставник', 'Любовный интерес', 'Компаньон', 'Враг', 'Нейтральный персонаж']
        };
    }

    addStyles() {
        if (!this.app.workspace.containerEl.ownerDocument.getElementById('lt-character-styles')) {
            const style = this.app.workspace.containerEl.ownerDocument.createElement('style');
            style.id = 'lt-character-styles';
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
            `;
            this.app.workspace.containerEl.ownerDocument.head.appendChild(style);
        }
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '1000px';
        this.modalEl.style.width = '1000px';
        if (this.options.prefillName && !this.data.name) this.data.name = this.options.prefillName;
        await this.loadConfig();
        this.render();
    }

    async loadConfig() {
        try {
            if (!this.projectPath) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }

            // Загружаем расы и профессии из настроек мира
            const settingsFile = this.app.vault.getAbstractFileByPath(`${this.projectPath}/Настройки_мира.md`);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    this.config.races = parsedConfig.races || [];
                    this.config.professions = parsedConfig.professions || [];
                }
            }
            
            // Если расы и профессии не найдены, используем значения по умолчанию
            if (!this.config.races || this.config.races.length === 0) {
                this.config.races = ['Люди', 'Эльфы', 'Гномы', 'Орки', 'Хоббиты'];
            }
            if (!this.config.professions || this.config.professions.length === 0) {
                this.config.professions = ['Воин', 'Маг', 'Торговец', 'Крестьянин', 'Ремесленник', 'Священник'];
            }
            
        } catch (error) {
            console.error('Ошибка загрузки конфигурации:', error);
            // Используем значения по умолчанию при ошибке
            this.config.races = ['Люди', 'Эльфы', 'Гномы', 'Орки', 'Хоббиты'];
            this.config.professions = ['Воин', 'Маг', 'Торговец', 'Крестьянин', 'Ремесленник', 'Священник'];
        }
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
            .setName('Имя персонажа')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Возраст')
            .addText(t => t.setValue(this.data.age).onChange(v => this.data.age = v));
        
        new Setting(this.contentEl)
            .setName('Пол')
            .addDropdown(d => {
                this.config.genders.forEach(gender => d.addOption(gender, gender));
                d.setValue(this.data.gender);
                d.onChange(v => this.data.gender = v);
            });
        
        new Setting(this.contentEl)
            .setName('Раса')
            .addDropdown(d => {
                this.config.races.forEach(race => d.addOption(race, race));
                d.setValue(this.data.race);
                d.onChange(v => this.data.race = v);
            });
        
        new Setting(this.contentEl)
            .setName('Профессия')
            .addDropdown(d => {
                this.config.professions.forEach(prof => d.addOption(prof, prof));
                d.setValue(this.data.profession);
                d.onChange(v => this.data.profession = v);
            });
        
        new Setting(this.contentEl)
            .setName('Статус')
            .addDropdown(d => {
                this.config.statuses.forEach(status => d.addOption(status, status));
                d.setValue(this.data.status);
                d.onChange(v => this.data.status = v);
            });
        
        new Setting(this.contentEl)
            .setName('Роль в истории')
            .addDropdown(d => {
                this.config.storyRoles.forEach(role => d.addOption(role, role));
                d.setValue(this.data.storyRole);
                d.onChange(v => this.data.storyRole = v);
            });
    }

    renderAppearance() {
        const h = this.contentEl.createEl('h2', { text: 'Внешность' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Описание внешности (детально)')
            .addTextArea(t => {
                t.setValue(this.data.appearance).onChange(v => this.data.appearance = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderPersonality() {
        const h = this.contentEl.createEl('h2', { text: 'Характер и личность' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Черты характера (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.personality).onChange(v => this.data.personality = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Мотивация и цели')
            .addTextArea(t => {
                t.setValue(this.data.motivation).onChange(v => this.data.motivation = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderBackground() {
        const h = this.contentEl.createEl('h2', { text: 'Происхождение и прошлое' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Происхождение и прошлое')
            .addTextArea(t => {
                t.setValue(this.data.background).onChange(v => this.data.background = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderAbilities() {
        const h = this.contentEl.createEl('h2', { text: 'Способности и снаряжение' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Способности и навыки (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.abilities).onChange(v => this.data.abilities = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Слабости и недостатки (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.weaknesses).onChange(v => this.data.weaknesses = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Снаряжение и имущество (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.equipment).onChange(v => this.data.equipment = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderRelations() {
        const h = this.contentEl.createEl('h2', { text: 'Отношения и связи' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Отношения с другими персонажами')
            .addTextArea(t => {
                t.setValue(this.data.relationships).onChange(v => this.data.relationships = v);
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
            .setName('Связанные организации (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.organizations).onChange(v => this.data.organizations = v);
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
            .setName('Связанные артефакты (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.artifacts).onChange(v => this.data.artifacts = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Другие важные персонажи (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.otherCharacters).onChange(v => this.data.otherCharacters = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addTextArea(t => {
                t.setValue(this.data.tags).onChange(v => this.data.tags = v);
                t.inputEl.style.minHeight = '120px';
                t.inputEl.style.width = '100%';
                t.inputEl.classList.add('lt-textarea');
            });
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр персонажа' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Имя: ${this.data.name || ''}` });
        box.createEl('div', { text: `Раса: ${this.data.race || ''}` });
        box.createEl('div', { text: `Профессия: ${this.data.profession || ''}` });
        box.createEl('div', { text: `Роль: ${this.data.storyRole || ''}` });
        box.createEl('div', { text: `Возраст: ${this.data.age || ''}` });
        if (this.data.personality) {
            box.createEl('div', { text: `Характер: ${this.data.personality.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите имя персонажа');
                return false;
            }
            if (!this.data.race) {
                new this.Notice('Выберите расу');
                return false;
            }
            if (!this.data.profession) {
                new this.Notice('Выберите профессию');
                return false;
            }
            if (!this.data.storyRole) {
                new this.Notice('Выберите роль в истории');
                return false;
            }
        }
        if (this.step === 1) {
            if (!String(this.data.appearance || '').trim()) {
                new this.Notice('Опишите внешность персонажа');
                return false;
            }
        }
        if (this.step === 2) {
            if (!String(this.data.personality || '').trim()) {
                new this.Notice('Опишите характер персонажа');
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
            created: date,
            age: clean(this.data.age),
            gender: this.data.gender,
            race: this.data.race,
            profession: this.data.profession,
            status: this.data.status,
            storyRole: this.data.storyRole,
            appearanceContent: clean(this.data.appearance),
            personalityContent: list(this.data.personality).map(x => `- ${x}`).join('\n'),
            backgroundContent: clean(this.data.background),
            motivationContent: clean(this.data.motivation),
            relationshipsContent: clean(this.data.relationships),
            abilitiesContent: list(this.data.abilities).map(x => `- ${x}`).join('\n'),
            weaknessesContent: list(this.data.weaknesses).map(x => `- ${x}`).join('\n'),
            equipmentContent: list(this.data.equipment).map(x => `- ${x}`).join('\n'),
            developmentContent: clean(this.data.development),
            locationsContent: list(this.data.locations).map(x => `[[${x}]]`).join(', '),
            organizationsContent: list(this.data.organizations).map(x => `[[${x}]]`).join(', '),
            eventsContent: list(this.data.events).map(x => `[[${x}]]`).join(', '),
            artifactsContent: list(this.data.artifacts).map(x => `[[${x}]]`).join(', '),
            otherCharactersContent: list(this.data.otherCharacters).map(x => `[[${x}]]`).join(', '),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Персонаж') || '';
            }
        } catch {}

        // Обработка профессий: если нет в настройках, создаём справочник
        try {
            if (data.profession && data.profession.trim()) {
                const справочникPath = `${this.projectPath}/Справочник`;
                const профессииPath = `${справочникPath}/Профессии.md`;
                
                // Создаём папку Справочник если её нет
                if (!this.app.vault.getAbstractFileByPath(справочникPath)) {
                    await this.app.vault.createFolder(справочникPath);
                }
                
                // Создаём или обновляем файл Профессии
                let профессииContent = '';
                const existingFile = this.app.vault.getAbstractFileByPath(профессииPath);
                if (existingFile instanceof TFile) {
                    профессииContent = await this.app.vault.read(existingFile);
                }
                
                // Добавляем новую профессию если её нет
                const newProfession = data.profession.trim();
                if (!профессииContent.includes(newProfession)) {
                    if (!профессииContent.includes('# Профессии')) {
                        профессииContent = `# Профессии\n\n## Список профессий\n\n`;
                    }
                    if (!профессииContent.includes(`- ${newProfession}`)) {
                        профессииContent += `- ${newProfession}\n`;
                    }
                    
                    // Сохраняем обновлённый файл
                    if (existingFile instanceof TFile) {
                        await this.app.vault.modify(existingFile, профессииContent);
                    } else {
                        await window.safeCreateFile(профессииPath, профессииContent, this.app);
                    }
                }
            }
        } catch (e) {
            console.error('Ошибка обработки профессий:', e);
        }
        
        // Fallback: обеспечиваем наличие стандартного изображения "Персонаж.jpg" в проекте
        try {
            if (!data.tagImage) {
                const tagFolder = `${this.projectPath}/Теговые_картинки`;
                const relImage = 'Теговые_картинки/Персонаж.jpg';
                const fullImage = `${this.projectPath}/Персонаж.jpg`; // not used, keep vault-style path below
                const existingFolder = this.app.vault.getAbstractFileByPath(tagFolder);
                if (!existingFolder) {
                    try { await this.app.vault.createFolder(tagFolder); } catch {}
                }
                const targetPath = `${tagFolder}/Персонаж.jpg`;
                if (!this.app.vault.getAbstractFileByPath(targetPath)) {
                    const pluginImage = '.obsidian/plugins/literary-templates/templates/Теговые_картинки/Персонаж.jpg';
                    try {
                        const bytes = await this.app.vault.adapter.readBinary(pluginImage);
                        await this.app.vault.adapter.writeBinary(targetPath, bytes);
                    } catch {}
                }
                if (this.app.vault.getAbstractFileByPath(targetPath)) {
                    data.tagImage = relImage;
                }
            }
        } catch {}
        
        const content = await window.generateFromTemplate('Новый_персонаж', data, this.plugin);
        const folder = `${this.projectPath}/Персонажи`;
        
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
        
        new this.Notice(`Персонаж «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
};

module.exports = { CharacterWizardModal };
