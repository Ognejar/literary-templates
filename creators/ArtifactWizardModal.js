/**
 * @file       ArtifactWizardModal.js
 * @description Модальное окно мастера для создания нового артефакта.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');
const { EntityWizardBase } = require('./EntityWizardBase.js');

var ArtifactWizardModal = class extends EntityWizardBase {
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
            description: '',
            owner: '',
            location: '',
            history: '',
            features: '',
            magicalProperties: '',
            limitations: '',
            risks: '',
            creationMethod: '',
            powerLevel: '',
            rarity: '',
            activationMethod: '',
            maintenance: '',
            // Теги и связи
            tag1: '', tag1Manual: '', tag2: '', tag2Manual: '', tag3: '', tag3Manual: '',
            relatedArtifact1: '', relatedArtifact1Manual: '',
            relatedArtifact2: '', relatedArtifact2Manual: '',
            // События и персонажи
            event1: '', event1Manual: '',
            character1: '', character1Manual: '',
            character2: '', character2Manual: '',
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderDescription.bind(this),
            this.renderOwnership.bind(this),
            this.renderProperties.bind(this),
            this.renderFeatures.bind(this),
            this.renderHistory.bind(this),
            this.renderConnections.bind(this),
            this.renderPreview.bind(this),
        ];
        this.config = {
            artifactTypes: ['Оружие', 'Доспех', 'Украшение', 'Инструмент', 'Архитектурный элемент', 'Транспорт', 'Коммуникация', 'Защита', 'Атака', 'Исцеление', 'Трансформация', 'Другое'],
            powerLevels: ['Слабый', 'Обычный', 'Мощный', 'Легендарный', 'Божественный'],
            rarityLevels: ['Обычный', 'Необычный', 'Редкий', 'Эпический', 'Легендарный'],
            activationMethods: ['Прикосновение', 'Слово', 'Мысль', 'Кровь', 'Энергия', 'Время', 'Условие', 'Комбинация'],
        };
    }

    async onOpen() {
        this.applyBaseStyles();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        this.contentEl.classList.add('lt-wizard');
        // Предзаполнение имени
        if (this.options && typeof this.options.prefillName === 'string' && this.options.prefillName.trim()) {
            if (!this.data.name) this.data.name = this.options.prefillName.trim();
        }
        this.render();
    }

    render() {
        this.contentEl.empty();
        
        // Заголовок
        const header = this.contentEl.createEl('h2', { text: 'Создание артефакта' });
        header.classList.add('lt-header');
        
        // Прогресс
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const progressFill = progress.createEl('div', { cls: 'lt-progress__fill' });
        progressFill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        
        // Шаг
        const stepInfo = this.contentEl.createEl('div', { text: `Шаг ${this.step + 1} из ${this.steps.length}` });
        stepInfo.classList.add('lt-subtle');
        
        // Контент шага
        this.steps[this.step]();
        
        // Кнопки навигации
        this.renderNavigation();
    }

    renderMainInfo() {
        const container = this.contentEl.createEl('div');
        
        // Название
        new Setting(container)
            .setName('Название артефакта')
            .setDesc('Введите название артефакта')
            .addText(text => text
                .setPlaceholder('Например: Меч Света')
                .setValue(this.data.name)
                .onChange(value => this.data.name = value)
            );
        
        // Тип артефакта
        new Setting(container)
            .setName('Тип артефакта')
            .setDesc('Выберите тип артефакта')
            .addDropdown(dropdown => {
                this.config.artifactTypes.forEach(type => {
                    dropdown.addOption(type, type);
                });
                dropdown.setValue(this.data.type);
                dropdown.onChange(value => this.data.type = value);
            });
        
        // Уровень силы
        new Setting(container)
            .setName('Уровень силы')
            .setDesc('Выберите уровень силы артефакта')
            .addDropdown(dropdown => {
                this.config.powerLevels.forEach(level => {
                    dropdown.addOption(level, level);
                });
                dropdown.setValue(this.data.powerLevel);
                dropdown.onChange(value => this.data.powerLevel = value);
            });
        
        // Редкость
        new Setting(container)
            .setName('Редкость')
            .setDesc('Выберите уровень редкости артефакта')
            .addDropdown(dropdown => {
                this.config.rarityLevels.forEach(rarity => {
                    dropdown.addOption(rarity, rarity);
                });
                dropdown.setValue(this.data.rarity);
                dropdown.onChange(value => this.data.rarity = value);
            });
    }

    renderDescription() {
        const container = this.contentEl.createEl('div');
        
        // Описание
        new Setting(container)
            .setName('Описание')
            .setDesc('Подробное описание артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите внешний вид, назначение и основные характеристики артефакта...')
                .setValue(this.data.description)
                .onChange(value => this.data.description = value)
            );
        
        // Способ активации
        new Setting(container)
            .setName('Способ активации')
            .setDesc('Как активируется артефакт')
            .addDropdown(dropdown => {
                this.config.activationMethods.forEach(method => {
                    dropdown.addOption(method, method);
                });
                dropdown.setValue(this.data.activationMethod);
                dropdown.onChange(value => this.data.activationMethod = value);
            });
        
        // Обслуживание
        new Setting(container)
            .setName('Обслуживание')
            .setDesc('Требования к обслуживанию артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите, как поддерживать артефакт в рабочем состоянии...')
                .setValue(this.data.maintenance)
                .onChange(value => this.data.maintenance = value)
            );
    }

    renderOwnership() {
        const container = this.contentEl.createEl('div');
        
        // Владелец
        new Setting(container)
            .setName('Владелец')
            .setDesc('Текущий владелец артефакта')
            .addText(text => text
                .setPlaceholder('Например: Король Артур')
                .setValue(this.data.owner)
                .onChange(value => this.data.owner = value)
            );
        
        // Местонахождение
        new Setting(container)
            .setName('Местонахождение')
            .setDesc('Где находится артефакт')
            .addText(text => text
                .setPlaceholder('Например: Сокровищница замка')
                .setValue(this.data.location)
                .onChange(value => this.data.location = value)
            );
    }

    renderProperties() {
        const container = this.contentEl.createEl('div');
        
        // Магические свойства
        new Setting(container)
            .setName('Магические свойства')
            .setDesc('Описание магических эффектов артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите магические эффекты, которые производит артефакт...')
                .setValue(this.data.magicalProperties)
                .onChange(value => this.data.magicalProperties = value)
            );
        
        // Ограничения
        new Setting(container)
            .setName('Ограничения')
            .setDesc('Ограничения использования артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите ограничения и условия использования...')
                .setValue(this.data.limitations)
                .onChange(value => this.data.limitations = value)
            );
        
        // Риски
        new Setting(container)
            .setName('Риски')
            .setDesc('Опасности, связанные с использованием артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите возможные риски и побочные эффекты...')
                .setValue(this.data.risks)
                .onChange(value => this.data.risks = value)
            );
    }

    renderFeatures() {
        const container = this.contentEl.createEl('div');
        
        // Особенности
        new Setting(container)
            .setName('Особенности')
            .setDesc('Уникальные особенности артефакта')
            .addTextArea(text => text
                .setPlaceholder('Опишите уникальные особенности, которые отличают этот артефакт...')
                .setValue(this.data.features)
                .onChange(value => this.data.features = value)
            );
        
        // Способ создания
        new Setting(container)
            .setName('Способ создания')
            .setDesc('Как был создан артефакт')
            .addTextArea(text => text
                .setPlaceholder('Опишите процесс создания артефакта...')
                .setValue(this.data.creationMethod)
                .onChange(value => this.data.creationMethod = value)
            );
    }

    renderHistory() {
        const container = this.contentEl.createEl('div');
        
        // История
        new Setting(container)
            .setName('История')
            .setDesc('История артефакта и его владельцев')
            .addTextArea(text => text
                .setPlaceholder('Опишите историю артефакта, его создателя и предыдущих владельцев...')
                .setValue(this.data.history)
                .onChange(value => this.data.history = value)
            );
    }

    renderConnections() {
        const container = this.contentEl.createEl('div');
        
        // Связанные артефакты
        new Setting(container)
            .setName('Связанные артефакты')
            .setDesc('Артефакты, связанные с данным')
            .addText(text => text
                .setPlaceholder('Например: Щит Тьмы')
                .setValue(this.data.relatedArtifact1)
                .onChange(value => this.data.relatedArtifact1 = value)
            );
        
        new Setting(container)
            .setName('Дополнительный артефакт')
            .setDesc('Второй связанный артефакт')
            .addText(text => text
                .setPlaceholder('Например: Кольцо Власти')
                .setValue(this.data.relatedArtifact2)
                .onChange(value => this.data.relatedArtifact2 = value)
            );
        
        // Связанные события
        new Setting(container)
            .setName('Связанные события')
            .setDesc('События, связанные с артефактом')
            .addText(text => text
                .setPlaceholder('Например: Великая Война')
                .setValue(this.data.event1)
                .onChange(value => this.data.event1 = value)
            );
        
        // Связанные персонажи
        new Setting(container)
            .setName('Связанные персонажи')
            .setDesc('Персонажи, связанные с артефактом')
            .addText(text => text
                .setPlaceholder('Например: Мерлин')
                .setValue(this.data.character1)
                .onChange(value => this.data.character1 = value)
            );
        
        new Setting(container)
            .setName('Дополнительный персонаж')
            .setDesc('Второй связанный персонаж')
            .addText(text => text
                .setPlaceholder('Например: Моргана')
                .setValue(this.data.character2)
                .onChange(value => this.data.character2 = value)
            );
    }

    renderPreview() {
        const container = this.contentEl.createEl('div');
        
        // Предварительный просмотр
        const preview = container.createEl('div', { cls: 'preview-section' });
        preview.style.cssText = `
            background: #var(--background-secondary);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        `;
        
        const previewTitle = preview.createEl('h3', { text: 'Предварительный просмотр' });
        previewTitle.style.cssText = 'margin-bottom: 15px; color: #var(--text-accent);';
        
        const previewContent = preview.createEl('div');
        previewContent.innerHTML = `
            <p><strong>Название:</strong> ${this.data.name || 'Не указано'}</p>
            <p><strong>Тип:</strong> ${this.data.type || 'Не указан'}</p>
            <p><strong>Уровень силы:</strong> ${this.data.powerLevel || 'Не указан'}</p>
            <p><strong>Редкость:</strong> ${this.data.rarity || 'Не указана'}</p>
            <p><strong>Владелец:</strong> ${this.data.owner || 'Не указан'}</p>
            <p><strong>Местонахождение:</strong> ${this.data.location || 'Не указано'}</p>
            <p><strong>Описание:</strong> ${this.data.description ? this.data.description.substring(0, 100) + '...' : 'Не указано'}</p>
        `;

        // Кнопка анализа лор-контекста
        this.createLoreAnalysisButton(container, 'artifact', this.projectPath);
    }

    renderNavigation() {
        const navContainer = this.contentEl.createEl('div', { cls: 'lt-nav' });
        
        // Кнопка "Назад"
        if (this.step > 0) {
            const backBtn = this.createButton('secondary', '← Назад');
            backBtn.onclick = () => {
                this.step--;
                this.render();
            };
            navContainer.appendChild(backBtn);
        }
        
        // Кнопка "Далее" или "Создать"
        const nextBtn = this.createButton('primary', this.step === this.steps.length - 1 ? '✓ Создать артефакт' : 'Далее →');
        nextBtn.onclick = () => {
            if (this.validateCurrentStep()) {
                if (this.step === this.steps.length - 1) {
                    this.createArtifact();
                } else {
                    this.step++;
                    this.render();
                }
            }
        };
        navContainer.appendChild(nextBtn);
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // Основная информация
                if (!this.data.name.trim()) {
                    new this.Notice('Введите название артефакта');
                    return false;
                }
                // Проверяем, не является ли название стандартным именем файла
                const isDefaultName = this.data.name === 'Без названия' || this.data.name === 'Untitled' || this.data.name === 'Новый документ';
                if (isDefaultName) {
                    new this.Notice('Пожалуйста, измените название артефакта на осмысленное имя');
                    return false;
                }
                if (!this.data.type) {
                    new this.Notice('Выберите тип артефакта');
                    return false;
                }
                break;
            case 1: // Описание
                if (!this.data.description.trim()) {
                    new this.Notice('Введите описание артефакта');
                    return false;
                }
                break;
            case 2: // Владение — значения можно не вводить
                // Ничего не валидируем: по умолчанию будет "Не известно"
                break;
            case 7: // Предварительный просмотр - дополнительная проверка названия
                if (!this.data.name.trim()) {
                    new this.Notice('Введите название артефакта');
                    return false;
                }
                // Повторная проверка стандартных имен на финальном этапе
                const isDefaultNameFinal = this.data.name === 'Без названия' || this.data.name === 'Untitled' || this.data.name === 'Новый документ';
                if (isDefaultNameFinal) {
                    new this.Notice('Пожалуйста, измените название артефакта на осмысленное имя');
                    return false;
                }
                break;
        }
        return true;
    }

    async createArtifact() {
        try {
            // Подготовка данных
            const date = window.moment().format('YYYY-MM-DD');
            const typeLower = this.data.type ? this.data.type.toLowerCase().replace(/\s+/g, '_') : '';
            // tagImage по типу артефакта, иначе по ключу "Артефакт"
            let tagImage = '';
            try {
                if (window.litSettingsService) {
                    if (this.data.type) {
                        tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, this.data.type);
                    }
                    if (!tagImage) {
                        tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Артефакт');
                    }
                }
            } catch (e) {}
            const ownerText = this.data.owner && this.data.owner.trim()
                ? `**Владелец:** [[${this.data.owner.trim()}]]`
                : `**Владелец:** Не известно`;
            const locationText = this.data.location && this.data.location.trim()
                ? `**Местонахождение:** [[${this.data.location.trim()}]]`
                : `**Местонахождение:** Не известно`;
            const featuresContent = this.data.features ? this.data.features.split(',').map(f => `- ${f.trim()}`).join('\n') : '';
            
            // Данные для шаблона
            const data = { 
                name: this.data.name, 
                type: this.data.type, 
                description: this.data.description, 
                owner: this.data.owner, 
                location: this.data.location, 
                history: this.data.history, 
                date, 
                typeLower, 
                ownerText, 
                locationText, 
                featuresContent,
                magicalProperties: this.data.magicalProperties,
                limitations: this.data.limitations,
                risks: this.data.risks,
                creationMethod: this.data.creationMethod,
                powerLevel: this.data.powerLevel,
                rarity: this.data.rarity,
                activationMethod: this.data.activationMethod,
                maintenance: this.data.maintenance,
                tagImage,
                // Связанные сущности
                relatedArtifact1: this.data.relatedArtifact1,
                relatedArtifact2: this.data.relatedArtifact2,
                event1: this.data.event1,
                character1: this.data.character1,
                character2: this.data.character2
            };

            // Генерация по шаблону из папки плагина с include и условными блоками
            const filled = await window.generateFromTemplate('Новый_артефакт', data, this.plugin);
            
            // Создание/запись файла
            const targetFolder = `${this.projectPath}/Магия/Артефакты`;
            const cleanName = this.data.name.trim();
            if (!cleanName) {
                new this.Notice('Название артефакта не может быть пустым');
                return;
            }
            const fileName = cleanName.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            
            if (this.options && this.options.targetFile instanceof TFile) {
                // Если это автозапуск, переименовываем файл и записываем содержимое
                const newPath = `${this.options.targetFile.parent.path}/${fileName}.md`;
                try {
                    await this.app.vault.rename(this.options.targetFile, fileName);
                    await this.app.vault.modify(this.options.targetFile, filled);
                    await this.app.workspace.getLeaf(true).openFile(this.options.targetFile);
                } catch (e) {
                    // Если переименование не удалось, просто записываем содержимое
                    await this.app.vault.modify(this.options.targetFile, filled);
                    await this.app.workspace.getLeaf(true).openFile(this.options.targetFile);
                }
            } else {
                // Обычное создание файла
                try { await this.app.vault.createFolder(targetFolder); } catch (e) {}
                const targetPath = `${targetFolder}/${fileName}.md`;
                await this.app.vault.create(targetPath, filled);
                const file = this.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await this.app.workspace.getLeaf(true).openFile(file);
                }
            }
            
            new this.Notice(`Артефакт "${this.data.name}" создан!`);
            this.close();
            
            if (this.onFinish) {
                this.onFinish();
            }
            
        } catch (error) {
            console.error('Ошибка при создании артефакта:', error);
            new this.Notice(`Ошибка при создании артефакта: ${error.message}`);
        }
    }

    fillTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value || '');
        }
        return result;
    }
};

module.exports = { ArtifactWizardModal };
