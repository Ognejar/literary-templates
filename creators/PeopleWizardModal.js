/**
 * @file       PeopleWizardModal.js
 * @description Модальное окно мастера для создания народа (people/nation)
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       /docs/project.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');

class PeopleWizardModal extends HtmlWizardModal {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.data = {
            name: '',
            type: '',
            homeland: '',
            population: '',
            language: '',
            religion: '',
            description: '',
            traditionsInput: '',
            craftsInput: '',
            featuresInput: ''
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderDetails.bind(this),
            this.renderCulture.bind(this),
            this.renderLists.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = {
            types: ['Человек', 'Гном', 'Эльф', 'Орк', 'Дварф', 'Хоббит', 'Другое']
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
        const header = this.contentEl.createEl('h2', { text: 'Создание народа' });
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
                    this.createPeople();
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
            .setName('Название народа')
            .setDesc('Введите название')
            .addText((t) => t
                .setPlaceholder('Например: Велюградцы')
                .setValue(this.data.name)
                .onChange((v) => this.data.name = v)
            );

        new Setting(container)
            .setName('Тип народа')
            .setDesc('Выберите вид')
            .addDropdown((d) => {
                this.config.types.forEach((x) => d.addOption(x, x));
                d.setValue(this.data.type);
                d.onChange((v) => this.data.type = v);
            });
    }

    renderDetails() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Родина / территория')
            .setDesc('Опционально')
            .addText((t) => t
                .setPlaceholder('Например: Велюградия')
                .setValue(this.data.homeland)
                .onChange((v) => this.data.homeland = v)
            );

        new Setting(container)
            .setName('Численность')
            .setDesc('Опционально')
            .addText((t) => t
                .setPlaceholder('Например: 120 000')
                .setValue(this.data.population)
                .onChange((v) => this.data.population = v)
            );
    }

    renderCulture() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Язык')
            .setDesc('Опционально')
            .addText((t) => t
                .setPlaceholder('Например: гарданский')
                .setValue(this.data.language)
                .onChange((v) => this.data.language = v)
            );

        new Setting(container)
            .setName('Религия')
            .setDesc('Опционально')
            .addText((t) => t
                .setPlaceholder('Например: Культ Света')
                .setValue(this.data.religion)
                .onChange((v) => this.data.religion = v)
            );

        new Setting(container)
            .setName('Краткое описание')
            .setDesc('Опционально')
            .addTextArea((t) => t
                .setPlaceholder('Пара предложений об этносе...')
                .setValue(this.data.description)
                .onChange((v) => this.data.description = v)
            );
    }

    renderLists() {
        const container = this.contentEl.createEl('div');
        new Setting(container)
            .setName('Традиции')
            .setDesc('Через запятую, опционально')
            .addTextArea((t) => t
                .setPlaceholder('пример: Праздник жатвы, Ночь огней')
                .setValue(this.data.traditionsInput)
                .onChange((v) => this.data.traditionsInput = v)
            );

        new Setting(container)
            .setName('Ремёсла')
            .setDesc('Через запятую, опционально')
            .addTextArea((t) => t
                .setPlaceholder('пример: Гончарное дело, Кузнечное дело')
                .setValue(this.data.craftsInput)
                .onChange((v) => this.data.craftsInput = v)
            );

        new Setting(container)
            .setName('Особенности')
            .setDesc('Через запятую, опционально')
            .addTextArea((t) => t
                .setPlaceholder('пример: Выносливость, Любовь к морю')
                .setValue(this.data.featuresInput)
                .onChange((v) => this.data.featuresInput = v)
            );
    }

    renderPreview() {
        const container = this.contentEl.createEl('div', { cls: 'lt-card' });
        const preview = container.createEl('div');
        preview.innerHTML = `
            <p><strong>Название:</strong> ${this.data.name || '—'}</p>
            <p><strong>Тип:</strong> ${this.data.type || '—'}</p>
            <p><strong>Родина:</strong> ${this.data.homeland || '—'}</p>
            <p><strong>Численность:</strong> ${this.data.population || '—'}</p>
        `;
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0:
                if (!this.data.name || !this.data.name.trim()) {
                    new this.Notice('Введите название народа');
                    return false;
                }
                if (!this.data.type) {
                    new this.Notice('Выберите тип народа');
                    return false;
                }
                break;
        }
        return true;
    }

    async createPeople() {
        try {
            const app = this.app;
            const name = String(this.data.name || '').trim();
            const type = String(this.data.type || '').trim();
            const homeland = String(this.data.homeland || '').trim();
            const population = String(this.data.population || '').trim();
            const language = String(this.data.language || '').trim();
            const religion = String(this.data.religion || '').trim();
            const description = String(this.data.description || '').trim();

            const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');

            // tagImage (опционально)
            let tagImage = '';
            try {
                if (window.litSettingsService) {
                    tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Народ');
                }
            } catch {}

            // Формируем фронтматтер
            const fm = [
                '---',
                `created: "${(window.moment ? window.moment() : { format: (f)=> new Date().toISOString().slice(0,10) }).format('YYYY-MM-DD')}"`,
                `name: "${name}"`,
                `aliases: ["${name}"]`,
                `type: "${type}"`,
                `homeland: "${homeland}"`,
                `population: "${population}"`,
                `language: "${language}"`,
                `religion: "${religion}"`,
                `tags: [people, nation${type ? `, ${type.toLowerCase()}` : ''}]`,
                `image: "${tagImage || ''}"`,
                '---',
                ''
            ].join('\n');

            // Списки
            const toList = (raw) => (String(raw || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => `- ${s}`)
                .join('\n'));

            const traditionsContent = toList(this.data.traditionsInput);
            const craftsContent = toList(this.data.craftsInput);
            const featuresContent = toList(this.data.featuresInput);

            const imgBlock = tagImage ? `![[${tagImage}]]\n\n` : '';
            const body = [
                `# ${name}`,
                '',
                imgBlock,
                `**Тип:** ${type || ''}  `,
                `**Родина:** ${homeland ? `[[${homeland}]]` : ''}  `,
                `**Численность:** ${population || ''}  `,
                `**Язык:** ${language || ''}  `,
                `**Религия:** ${religion ? `[[${religion}]]` : ''}  `,
                '',
                '## Описание',
                description || '',
                '',
                '## История',
                '[История происхождения и развития народа]',
                '',
                '## Культура',
                '### Традиции',
                traditionsContent,
                '',
                '### Ремёсла',
                craftsContent,
                '',
                '### Искусство',
                '- **Музыка:**',
                '- **Литература:**',
                '- **Архитектура:**',
                '- **Одежда:**',
                '',
                '## Общество',
                '- **Социальная структура:**',
                '- **Семейные отношения:**',
                '- **Воспитание детей:**',
                '- **Статус женщин:**',
                '- **Статус мужчин:**',
                '',
                '## Экономика',
                '- **Основные занятия:**',
                '- **Торговля:**',
                '- **Сельское хозяйство:**',
                '- **Ремёсла:**',
                '',
                '## Религия и верования',
                `- **Основная религия:** ${religion ? `[[${religion}]]` : ''}`,
                '- **Дополнительные верования:**',
                '- **Ритуалы:**',
                '- **Святые места:**',
                '',
                '## Отношения с другими народами',
                '- **Союзники:**',
                '- **Противники:**',
                '- **Нейтральные отношения:**',
                '- **Торговые партнёры:**',
                '',
                '## Современное положение',
                '- **Территории проживания:**',
                '- **Политический статус:**',
                '- **Проблемы:**',
                '- **Перспективы:**',
                '',
                '## Автоматические связи',
                '### Представители народа',
                '```dataview',
                'LIST FROM #people OR #character',
                'WHERE (',
                `    contains(file.outlinks, [[${name}]]) OR`,
                `    contains(file.tags, "${name}") OR`,
                `    regexmatch(file.text, "#${name}") OR`,
                `    regexmatch(file.text, "\\[\\[${name}(\\||\\]\\])")`,
                ') AND file.name != this.file.name',
                '```',
                '',
                '### Территории проживания',
                '```dataview',
                'LIST FROM #place',
                'WHERE (',
                `    contains(file.outlinks, [[${name}]]) OR`,
                `    contains(file.tags, "${name}") OR`,
                `    regexmatch(file.text, "#${name}") OR`,
                `    regexmatch(file.text, "\\[\\[${name}(\\||\\]\\])")`,
                ') AND file.name != this.file.name',
                '```',
                '',
                '### Организации народа',
                '```dataview',
                'LIST FROM #organization',
                'WHERE (',
                `    contains(file.outlinks, [[${name}]]) OR`,
                `    contains(file.tags, "${name}") OR`,
                `    regexmatch(file.text, "#${name}") OR`,
                `    regexmatch(file.text, "\\[\\[${name}(\\||\\]\\])")`,
                ') AND file.name != this.file.name',
                '```',
                '',
                '### Связанные события',
                '```dataview',
                'LIST FROM #event',
                'WHERE (',
                `    contains(file.outlinks, [[${name}]]) OR`,
                `    contains(file.tags, "${name}") OR`,
                `    regexmatch(file.text, "#${name}") OR`,
                `    regexmatch(file.text, "\\[\\[${name}(\\||\\]\\])")`,
                ') AND file.name != this.file.name',
                '```',
                '',
                '## Особенности',
                featuresContent,
            ].join('\n');

            const content = fm + body;
            const targetFolder = `${this.projectPath}/Народы`;
            await window.ensureEntityInfrastructure(targetFolder, cleanName, app);
            const targetPath = `${targetFolder}/${cleanName}.md`;
            await window.safeCreateFile(targetPath, content, app);

            const file = app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await app.workspace.getLeaf().openFile(file);
            }
            new this.Notice(`Создан народ: ${name}`);
            this.close();
            if (this.onFinish) this.onFinish();
        } catch (e) {
            console.error('Ошибка при создании народа:', e);
            new this.Notice(`Ошибка при создании народа: ${e.message}`);
        }
    }
}

module.exports = { PeopleWizardModal };


