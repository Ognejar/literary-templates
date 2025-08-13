/**
 * @file       CharacterWizardModal.js
 * @description Модальное окно мастера для создания персонажа (character)
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       /docs/project.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');

class CharacterWizardModal extends HtmlWizardModal {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish) {
        super(app, ModalClass, NoticeClass);
        this.Modal = ModalClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.data = {
            name: '',
            status: '',
            race: '',
            gender: '',
            location: '',
            description: '',
            featuresInput: ''
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderDetails.bind(this),
            this.renderDescription.bind(this),
            this.renderFeatures.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            statuses: ['Активен', 'Мёртв', 'Пропал без вести'],
            races: ['Человек', 'Эльф', 'Гном', 'Дроид', 'Орк', 'Хоббит', 'Другое'],
            genders: ['Мужской', 'Женский', 'Другое']
        };
    }

    async onOpen() {
        this.applyBaseStyles();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        this.contentEl.classList.add('lt-wizard');
        this.render();
    }

    render() {
        this.contentEl.empty();
        const header = this.contentEl.createEl('h2', { text: 'Создание персонажа' });
        header.classList.add('lt-header');

        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const progressFill = progress.createEl('div', { cls: 'lt-progress__fill' });
        progressFill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;

        const stepInfo = this.contentEl.createEl('div', { text: `Шаг ${this.step + 1} из ${this.steps.length}` });
        stepInfo.classList.add('lt-subtle');

        this.steps[this.step]();

        const nav = this.contentEl.createEl('div', { cls: 'lt-nav' });
        if (this.step > 0) {
            const back = this.createButton('secondary', '← Назад');
            back.onclick = () => { this.step--; this.render(); };
            nav.appendChild(back);
        }
        const next = this.createButton('primary', this.step === this.steps.length - 1 ? '✓ Готово' : 'Далее →');
        next.onclick = () => {
            if (this.validateCurrentStep()) {
                if (this.step === this.steps.length - 1) {
                    this.createCharacter();
                } else {
                    this.step++;
                    this.render();
                }
            }
        };
        nav.appendChild(next);
    }

    renderMainInfo() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Имя персонажа')
            .setDesc('Введите имя')
            .addText((t) => t
                .setPlaceholder('Например: Арагорн')
                .setValue(this.data.name)
                .onChange((v) => this.data.name = v)
            );

        new Setting(container)
            .setName('Статус')
            .setDesc('Выберите статус')
            .addDropdown((d) => {
                this.config.statuses.forEach((x) => d.addOption(x, x));
                d.setValue(this.data.status);
                d.onChange((v) => this.data.status = v);
            });
    }

    renderDetails() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Раса')
            .setDesc('Выберите расу')
            .addDropdown((d) => {
                this.config.races.forEach((x) => d.addOption(x, x));
                d.setValue(this.data.race);
                d.onChange((v) => this.data.race = v);
            });

        new Setting(container)
            .setName('Пол')
            .setDesc('Выберите пол')
            .addDropdown((d) => {
                this.config.genders.forEach((x) => d.addOption(x, x));
                d.setValue(this.data.gender);
                d.onChange((v) => this.data.gender = v);
            });

        new Setting(container)
            .setName('Место жительства')
            .setDesc('Опционально')
            .addText((t) => t
                .setPlaceholder('Например: Минас Тирит')
                .setValue(this.data.location)
                .onChange((v) => this.data.location = v)
            );
    }

    renderDescription() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Описание')
            .setDesc('Опционально')
            .addTextArea((t) => t
                .setPlaceholder('Краткое описание персонажа...')
                .setValue(this.data.description)
                .onChange((v) => this.data.description = v)
            );
    }

    renderFeatures() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Особенности')
            .setDesc('Через запятую, опционально')
            .addTextArea((t) => t
                .setPlaceholder('пример: Долгожитель, Отличный стрелок')
                .setValue(this.data.featuresInput)
                .onChange((v) => this.data.featuresInput = v)
            );
    }

    renderPreview() {
        const container = this.contentEl.createEl('div', { cls: 'lt-card' });
        const preview = container.createEl('div');
        preview.innerHTML = `
            <p><strong>Имя:</strong> ${this.data.name || '—'}</p>
            <p><strong>Статус:</strong> ${this.data.status || '—'}</p>
            <p><strong>Раса:</strong> ${this.data.race || '—'}</p>
            <p><strong>Пол:</strong> ${this.data.gender || '—'}</p>
            <p><strong>Место жительства:</strong> ${this.data.location || '—'}</p>
        `;
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0:
                if (!this.data.name || !this.data.name.trim()) {
                    new this.Notice('Введите имя персонажа');
                    return false;
                }
                if (!this.data.status) {
                    new this.Notice('Выберите статус');
                    return false;
                }
                break;
        }
        return true;
    }

    async createCharacter() {
        try {
            const app = this.app;
            const name = String(this.data.name || '').trim();
            const status = String(this.data.status || '').trim();
            const race = String(this.data.race || '').trim();
            const gender = String(this.data.gender || '').trim();
            const location = String(this.data.location || '').trim();
            const description = String(this.data.description || '').trim();

            const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');

            // tagImage (опционально)
            let tagImage = '';
            try {
                if (window.litSettingsService) {
                    const keys = ['Персонаж', 'character'];
                    if (race) keys.push(race);
                    for (const k of keys) {
                        tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, k);
                        if (tagImage) break;
                    }
                }
            } catch {}

            // Получаем политические теги
            const politicalTags = await this.getPoliticalTags(location);
            const allTags = ['people', 'character', ...politicalTags];

            // Особенности
            const featuresContent = this.data.featuresInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => `- ${s}`)
                .join('\n');

            // Данные для шаблона
            const templateData = {
                created: (window.moment ? window.moment() : { format: (f)=> new Date().toISOString().slice(0,10) }).format('YYYY-MM-DD'),
                name: name,
                status: status,
                race: race,
                gender: gender,
                location: location ? `[[${location}]]` : 'Не указано',
                description: description,
                featuresContent: featuresContent,
                tags: allTags.join(', '),
                tagImage: tagImage || ''
            };

            // Генерируем контент из шаблона
            const content = await window.generateFromTemplate('Новый_персонаж', templateData, this.plugin);

            const targetFolder = `${this.projectPath}/Персонажи`;
            await window.ensureEntityInfrastructure(targetFolder, cleanName, app);
            const targetPath = `${targetFolder}/${cleanName}.md`;
            await window.safeCreateFile(targetPath, content, app);

            const file = app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await app.workspace.getLeaf().openFile(file);
            }
            new this.Notice(`Создан персонаж: ${name}`);
            this.close();
            if (this.onFinish) this.onFinish();
        } catch (e) {
            console.error('Ошибка при создании персонажа:', e);
            new this.Notice(`Ошибка при создании персонажа: ${e.message}`);
        }
    }

    async getPoliticalTags(location) {
        if (!location) return [];
        
        const politicalTags = [];
        
        try {
            // Проверяем файлы локаций для определения политической принадлежности
            const locationFiles = this.app.vault.getMarkdownFiles().filter(f => 
                f.basename.toLowerCase() === location.toLowerCase() ||
                f.basename.toLowerCase().includes(location.toLowerCase())
            );
            
            if (locationFiles.length > 0) {
                const locationFile = locationFiles[0];
                const locationContent = await this.app.vault.read(locationFile);
                
                // Ищем ссылки на провинции и государства
                const provinceMatch = locationContent.match(/Провинция.*?\[\[([^\]]+)\]\]/);
                const stateMatch = locationContent.match(/Государство.*?\[\[([^\]]+)\]\]/);
                
                if (provinceMatch) {
                    politicalTags.push(`#${provinceMatch[1].replace(/\s+/g, '_')}`);
                }
                if (stateMatch) {
                    politicalTags.push(`#${stateMatch[1].replace(/\s+/g, '_')}`);
                }
            }
        } catch (e) {
            console.error("Ошибка чтения файла локации:", e);
        }
        
        return politicalTags;
    }
}

module.exports = { CharacterWizardModal };
