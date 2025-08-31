/**
 * @file       MineWizardModal.js
 * @description Модальное окно мастера для создания новой шахты.
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, settingsService
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

const { EntityWizardBase } = require('./EntityWizardBase.js');

var MineWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            mineName: '',
            description: '',
            climate: '',
            dominantFaction: '',
            mineType: '',
            province: '',
            state: '',
            status: 'действует',
            statusReason: '',
            shafts: '',
            resources: [],
            methods: [],
            features: [],
        };
        this.config = {
            climates: [],
            factions: [],
            provinces: [],
            states: [],
            statuses: [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ],
            mineTypes: ['Железная руда', 'Медная руда', 'Золотая руда', 'Серебряная руда', 'Уголь', 'Соль', 'Драгоценные камни', 'Другое']
        };
    }

    async onOpen() {
        // Добавляем общие стили для модального окна
        this.applyBaseUI();
        this.modalEl.style.cssText = `
            max-width: 900px !important;
            width: 900px !important;
        `;
        this.contentEl.style.cssText = `
            padding: 20px;
            max-width: 900px !important;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        this.contentEl.empty();
        this.titleEl.setText('Создание новой шахты');
        await this.loadConfig();
        this.render();
    }

    async loadConfig() {
        try {
            if (!this.projectRoot) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }

            // Используем settingsService для загрузки конфигурации
            if (window.litSettingsService) {
                this.config.climates = await window.litSettingsService.getClimates(this.app, this.projectRoot) || [];
                this.config.factions = await window.litSettingsService.getFactions(this.app, this.projectRoot) || [];
            } else {
                // Fallback к старому методу
                const settingsFile = this.app.vault.getAbstractFileByPath(`${this.projectRoot}/Настройки_мира.md`);
                if (settingsFile instanceof TFile) {
                    const content = await this.app.vault.read(settingsFile);
                    const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                    if (configMatch && configMatch[1]) {
                        const parsedConfig = JSON.parse(configMatch[1]);
                        this.config.climates = parsedConfig.locations?.climates || [];
                        this.config.factions = parsedConfig.locations?.factions || [];
                    }
                }
            }

            // Загружаем провинции
            const provincesFolder = `${this.projectRoot}/Локации/Провинции`;
            const provincesFolderObj = this.app.vault.getAbstractFileByPath(provincesFolder);
            if (provincesFolderObj && provincesFolderObj.children) {
                this.config.provinces = provincesFolderObj.children
                    .filter(f => f instanceof TFile && f.extension === 'md')
                    .map(f => f.basename);
            }

            // Загружаем государства
            this.config.states = this.loadFilesFromFolder(`${this.projectRoot}/Локации/Государства`, 'Государства');

            // Инициализируем значения по умолчанию
            this.data.climate = this.data.climate || (this.config.climates[0] || '');
            this.data.dominantFaction = this.data.dominantFaction || (this.config.factions[0] || '');
            this.data.mineType = this.data.mineType || (this.config.mineTypes[0] || '');

            console.log('DEBUG: MineWizardModal - Config loaded. climates:', this.config.climates, 'factions:', this.config.factions);
            console.log('DEBUG: MineWizardModal - Data initialized. climate:', this.data.climate, 'dominantFaction:', this.data.dominantFaction);
        } catch (e) {
            new this.Notice('Ошибка загрузки конфигурации: ' + e.message);
            console.error('Ошибка загрузки конфигурации:', e);
            this.close();
        }
    }

    render() {
        this.contentEl.empty();
        const { contentEl } = this;
        let navButtons = '';

        switch (this.step) {
            case 0:
                this.titleEl.setText('Создание новой шахты - Шаг 1/8: Название');
                this.renderMineName(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание новой шахты - Шаг 2/9: Статус шахты');
                this.renderStatus(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание новой шахты - Шаг 3/9: Климат и фракция');
                this.renderClimateFaction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание новой шахты - Шаг 4/9: Государство и провинция');
                this.renderStateProvince(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание новой шахты - Шаг 5/9: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание новой шахты - Шаг 6/9: Тип шахты и количество шахт');
                this.renderMineTypeShafts(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 6:
                this.titleEl.setText('Создание новой шахты - Шаг 7/9: Основные ресурсы и методы добычи');
                this.renderResourcesMethods(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 7:
                this.titleEl.setText('Создание новой шахты - Шаг 8/9: Особенности');
                this.renderFeatures(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 8:
                this.titleEl.setText('Создание новой шахты - Шаг 9/9: Предпросмотр');
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNav(contentEl, navButtons);
    }

    renderMineName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название шахты')
            .addText(text => {
                text.setPlaceholder('Название шахты')
                    .setValue(this.data.mineName)
                    .onChange(value => {
                        this.data.mineName = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderClimateFaction(contentEl) {
        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                this.config.climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate || this.config.climates[0]);
                dropdown.onChange(value => this.data.climate = value);
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        new this.Setting(contentEl)
            .setName('Доминирующая фракция')
            .addDropdown(dropdown => {
                this.config.factions.forEach(faction => dropdown.addOption(faction, faction));
                dropdown.setValue(this.data.dominantFaction || this.config.factions[0]);
                dropdown.onChange(value => this.data.dominantFaction = value);
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderStateProvince(contentEl) {
        new this.Setting(contentEl)
            .setName('Государство')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите государство');
                this.config.states.forEach(state => dropdown.addOption(state, state));
                dropdown.setValue(this.data.state);
                dropdown.onChange(value => this.data.state = value);
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        new this.Setting(contentEl)
            .setName('Провинция (опционально)')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите провинцию (опционально)');
                this.config.provinces.forEach(province => dropdown.addOption(province, province));
                dropdown.setValue(this.data.province);
                dropdown.onChange(value => this.data.province = value);
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderDescription(contentEl) {
        new this.Setting(contentEl)
            .setName('Описание')
            .addTextArea(text => {
                text.setPlaceholder('Подробное описание шахты')
                    .setValue(this.data.description)
                    .onChange(value => {
                        this.data.description = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '140px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderMineTypeShafts(contentEl) {
        new this.Setting(contentEl)
            .setName('Тип шахты')
            .addDropdown(dropdown => {
                this.config.mineTypes.forEach(type => dropdown.addOption(type, type));
                dropdown.setValue(this.data.mineType || this.config.mineTypes[0]);
                dropdown.onChange(value => this.data.mineType = value);
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        new this.Setting(contentEl)
            .setName('Количество шахт')
            .addText(text => {
                text.setPlaceholder('Например: 3')
                    .setValue(this.data.shafts)
                    .onChange(value => {
                        this.data.shafts = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderResourcesMethods(contentEl) {
        new this.Setting(contentEl)
            .setName('Основные ресурсы (через запятую)')
            .addTextArea(text => {
                text.setPlaceholder('Например: Железная руда, уголь')
                    .setValue(this.data.resources.join(', '))
                    .onChange(value => {
                        this.data.resources = value.split(',').map(s => s.trim()).filter(Boolean);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });

        new this.Setting(contentEl)
            .setName('Методы добычи (через запятую)')
            .addTextArea(text => {
                text.setPlaceholder('Например: Открытая разработка, подземная добыча')
                    .setValue(this.data.methods.join(', '))
                    .onChange(value => {
                        this.data.methods = value.split(',').map(s => s.trim()).filter(Boolean);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderFeatures(contentEl) {
        const featureContainer = contentEl.createEl('div', { cls: 'features-container' });
        new this.Setting(featureContainer)
            .setName('Особенности (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте особенности, каждую с новой строки')
                    .setValue(this.data.features.join('\n'))
                    .onChange(value => {
                        this.data.features = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    });
            });
    }

    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.mineName}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Доминирующая фракция:** ${this.data.dominantFaction}` });
        if (this.data.state) {
            previewEl.createEl('p', { text: `**Государство:** ${this.data.state}` });
        }
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
        previewEl.createEl('p', { text: `**Тип шахты:** ${this.data.mineType}` });
        previewEl.createEl('p', { text: `**Количество шахт:** ${this.data.shafts}` });
        const statusLabel = this.config.statuses.find(s => s.value === this.data.status)?.label || this.data.status;
        previewEl.createEl('p', { text: `**Статус:** ${statusLabel}` });
        if (this.data.status !== 'действует' && this.data.statusReason) {
            previewEl.createEl('p', { text: `**Причина:** ${this.data.statusReason}` });
        }
        if (this.data.status === 'действует') {
            previewEl.createEl('p', { text: `**Основные ресурсы:** ${this.data.resources.join(', ')}` });
            previewEl.createEl('p', { text: `**Методы добычи:** ${this.data.methods.join(', ')}` });
        }
        previewEl.createEl('p', { text: `**Особенности:** ${this.data.features.join(', ')}` });
    }

    renderNav(contentEl, buttonsHtml) {
        const navEl = contentEl.createEl('div', { cls: 'modal-nav' });
        navEl.innerHTML = buttonsHtml;

        navEl.querySelector('#prev')?.addEventListener('click', () => {
            this.step--;
            this.render();
        });

        navEl.querySelector('#next')?.addEventListener('click', () => {
            if (this.validateCurrentStep()) {
                this.step++;
                this.render();
            }
        });

        navEl.querySelector('.mod-cta:not(#next)')?.addEventListener('click', () => {
            if (this.validateCurrentStep()) {
                this.onFinish(this.data);
                this.close();
            }
        });
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // Name
                if (!this.data.mineName.trim()) {
                    new this.Notice('Пожалуйста, введите название шахты.');
                    return false;
                }
                break;
            case 1: // Status
                if (!this.data.status) {
                    new this.Notice('Пожалуйста, выберите статус шахты.');
                    return false;
                }
                if (this.data.status !== 'действует' && !this.data.statusReason.trim()) {
                    new this.Notice('Пожалуйста, укажите причину заброшенности/разрушения.');
                    return false;
                }
                break;
            case 2: // Climate and Faction
                if (!this.data.climate || !this.data.dominantFaction) {
                    new this.Notice('Пожалуйста, выберите климат и доминирующую фракцию.');
                    return false;
                }
                break;
            case 3: // State and Province
                if (!this.data.state) {
                    new this.Notice('Пожалуйста, выберите государство.');
                    return false;
                }
                break;
            case 4: // Description
                if (!this.data.description.trim()) {
                    new this.Notice('Пожалуйста, введите описание шахты.');
                    return false;
                }
                break;
            case 5: // Mine Type and Shafts
                if (!this.data.mineType.trim()) {
                    new this.Notice('Пожалуйста, укажите тип шахты.');
                    return false;
                }
                if (!this.data.shafts.trim() || isNaN(Number(this.data.shafts))) {
                    new this.Notice('Пожалуйста, укажите количество шахт (числом).');
                    return false;
                }
                break;
            case 6: // Resources and Methods (optional)
                // Nothing to validate, as they are optional
                break;
            case 7: // Features (optional)
                // Nothing to validate, as they are optional
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
};

// Защита: если по каким-то причинам метод отсутствует после сборки — добавим его на прототип
if (typeof MineWizardModal !== 'undefined' && typeof MineWizardModal.prototype.renderStatus !== 'function') {
    MineWizardModal.prototype.renderStatus = function(contentEl) {
        new this.Setting(contentEl)
            .setName('Статус шахты')
            .addDropdown(dropdown => {
                this.config.statuses = (typeof this.ensureStatuses === 'function') ? this.ensureStatuses(this.config.statuses) : (this.config.statuses || [
                    { value: 'действует', label: 'Действует', icon: '✅' },
                    { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                    { value: 'разрушено', label: 'Разрушено', icon: '💥' }
                ]);
                if (typeof this.addDropdownOptions === 'function') {
                    this.addDropdownOptions(dropdown, this.config.statuses);
                } else {
                    this.config.statuses.forEach(status => dropdown.addOption(status.value, `${status.icon} ${status.label}`));
                }
                dropdown.setValue(this.data.status || 'действует');
                dropdown.onChange(value => {
                    this.data.status = value;
                    const reasonSetting = contentEl.querySelector('.status-reason-setting');
                    if (reasonSetting) {
                        reasonSetting.style.display = value === 'действует' ? 'none' : 'block';
                    }
                });
            });

        const reasonSetting = new this.Setting(contentEl)
            .setName('Причина')
            .addText(text => {
                text.setPlaceholder('Например: Истощение, затопление, авария')
                    .setValue(this.data.statusReason || '')
                    .onChange(value => {
                        this.data.statusReason = value;
                    });
            });

        reasonSetting.settingEl.addClass('status-reason-setting');
        if ((this.data.status || 'действует') === 'действует') {
            reasonSetting.settingEl.style.display = 'none';
        }
    };
}

module.exports = { MineWizardModal };
