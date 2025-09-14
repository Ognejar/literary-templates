/**
 * @file       DeadZoneWizardModal.js
 * @description Модальное окно мастера для создания "мертвой зоны".
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals
 * @created    2024-07-29
 * @updated    2024-07-29
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

const { EntityWizardBase } = require('./EntityWizardBase.js');

var DeadZoneWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.config = {
            climates: [],
            factions: [],
            states: [],
            allProvinces: [],
            provinces: []
        };
        this.data = {
            zoneName: '',
            dangerLevel: '',
            description: '',
            anomalies: [],
            inhabitants: [],
            findings: [],
            oldEconomy: '',
            currentState: '',
            climate: '',
            faction: '',
            type: 'Мёртвая зона',
            // Статус по умолчанию
            status: 'заброшено',
            statusReason: 'Затопление',
            // Юрисдикция
            state: '',
            province: '',
            country: '',
            stateManual: ''
        };
    }

    async onOpen() {
        // Добавляем общие стили для модального окна
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
        this.titleEl.setText('Создание новой мертвой зоны');
        await this.loadConfig();
        this.render();
    }

    async loadConfig() {
        try {
            const projectRoot = this.projectRoot; // Используем переданный projectRoot
            if (!projectRoot) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }
            
            // Инициализируем config если он не существует
            if (!this.config) {
                this.config = {
                    climates: [],
                    factions: []
                };
            }
            
            // Новый способ: settingsService
            if (window.litSettingsService) {
                try {
                    this.config.climates = await window.litSettingsService.getClimates(this.app, this.projectRoot) || [];
                    this.config.factions = await window.litSettingsService.getFactions(this.app, this.projectRoot) || [];
                } catch (serviceError) {
                    console.warn('Ошибка получения данных из settingsService:', serviceError);
                    this.config.climates = [];
                    this.config.factions = [];
                }
            } else {
                this.config.climates = [];
                this.config.factions = [];
            }
            
            // Загрузка государств и всех провинций
            this.config.states = this.loadFilesFromFolder(`${projectRoot}/Локации/Государства`, 'Государства');
            this.config.allProvinces = this.loadFilesFromFolder(`${projectRoot}/Локации/Провинции`, 'Провинции');
            this.config.provinces = [];

            // Инициализируем this.data.climate и this.data.faction здесь, после загрузки конфига
            this.data.climate = this.data.climate || this.config.climates[0] || '';
            this.data.faction = this.data.faction || this.config.factions[0] || '';

            console.log('DEBUG: DeadZoneWizardModal - Config loaded. climates:', this.config.climates, 'factions:', this.config.factions);
            console.log('DEBUG: DeadZoneWizardModal - Data initialized. climate:', this.data.climate, 'faction:', this.data.faction);
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
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 1/7: Название');
                this.renderZoneName(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 2/8: Климат, Фракция, Эпоха');
                this.renderClimateFactionEra(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 3/8: Государство и провинция');
                this.renderJurisdiction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 4/8: Бывшая экономика');
                this.renderOldEconomy(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 5/8: Текущее состояние');
                this.renderCurrentState(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 6/8: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 6:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 7/8: Находки');
                this.renderFindings(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 7:
                this.titleEl.setText('Создание новой мертвой зоны - Шаг 8/8: Предпросмотр');
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNavFlex(contentEl);
    }

    renderZoneName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название мертвой зоны')
            .addText(text => {
                text.setPlaceholder('Название мертвой зоны')
                    .setValue(this.data.zoneName)
                    .onChange(value => {
                        this.data.zoneName = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderClimateFactionEra(contentEl) {
        // Убеждаемся, что массивы существуют
        const climates = this.config.climates || [];
        const factions = this.config.factions || [];
        
        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate || climates[0] || '');
                dropdown.onChange(value => this.data.climate = value);
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        new this.Setting(contentEl)
            .setName('Фракция (свободный ввод)')
            .addText(text => {
                text.setPlaceholder('Введите название фракции (опционально)')
                    .setValue(this.data.faction || '')
                    .onChange(value => this.data.faction = value);
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderOldEconomy(contentEl) {
        new this.Setting(contentEl)
            .setName('Бывшая экономика (опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Описание бывшей экономики региона')
                    .setValue(this.data.oldEconomy)
                    .onChange(value => {
                        this.data.oldEconomy = value;
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderCurrentState(contentEl) {
        new this.Setting(contentEl)
            .setName('Текущее состояние (опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Описание текущего состояния зоны')
                    .setValue(this.data.currentState)
                    .onChange(value => {
                        this.data.currentState = value;
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderDescription(contentEl) {
        new this.Setting(contentEl)
            .setName('Описание')
            .addTextArea(text => {
                text.setPlaceholder('Подробное описание мертвой зоны')
                    .setValue(this.data.description)
                    .onChange(value => {
                        this.data.description = value;
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '140px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderFindings(contentEl) {
        const findingsContainer = contentEl.createEl('div', { cls: 'findings-container' });
        new this.Setting(findingsContainer)
            .setName('Находки и особенности (каждая с новой строки)')
            .addTextArea(text => {
                // Убеждаемся, что findings существует
                const findings = this.data.findings || [];
                text.setPlaceholder('Добавьте находки и особенности, каждую с новой строки')
                    .setValue(findings.join('\n'))
                    .onChange(value => {
                        this.data.findings = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                        this.renderPreview(this.contentEl); // Обновляем предпросмотр
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderJurisdiction(contentEl) {
        // Государство
        new this.Setting(contentEl)
            .setName('Государство')
            .setDesc('Выберите государство для фильтрации провинций')
            .addDropdown(d => {
                d.addOption('', 'Выберите государство');
                (this.config.states || []).forEach(s => d.addOption(s, s));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.state || '');
                d.onChange(async (v) => {
                    this.data.state = v === 'manual' ? (this.data.stateManual || '') : v;
                    this.data.country = this.data.state; // Дублируем для единообразия
                    // Фильтруем провинции
                    this.config.provinces = await super.filterProvincesByState(this.data.state, this.projectRoot, this.config.allProvinces);
                    this.render();
                });
                d.selectEl.style.minWidth = '320px';
                d.selectEl.style.fontSize = '14px';
                d.selectEl.style.padding = '6px';
            });

        if (this.data.state === 'manual') {
            new this.Setting(contentEl)
                .setName('Государство (ручной ввод)')
                .addText(t => {
                    t.setValue(this.data.stateManual || '').onChange(v => {
                        this.data.stateManual = v;
                        this.data.state = v;
                        this.data.country = v;
                    });
                    t.inputEl.style.width = '100%';
                    t.inputEl.style.fontSize = '16px';
                    t.inputEl.style.padding = '8px';
                });
        }

        // Провинция
        new this.Setting(contentEl)
            .setName('Провинция (опционально)')
            .setDesc(this.data.state ? `Провинции государства "${this.data.state}"` : 'Сначала выберите государство')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите провинцию');
                (this.config.provinces || []).forEach(p => dropdown.addOption(p, p));
                dropdown.setValue(this.data.province || '');
                dropdown.onChange(value => this.data.province = value);
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.zoneName || ''}` });
        previewEl.createEl('p', { text: `**Тип:** ${this.data.type || 'Мёртвая зона'}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate || ''}` });
        previewEl.createEl('p', { text: `**Фракция:** ${this.data.faction || ''}` });
        // Статус по умолчанию отображаем в предпросмотре
        const statusLabel = this.data.status === 'заброшено' ? '🏚️ Заброшено' : (this.data.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует');
        previewEl.createEl('p', { text: `**Статус:** ${statusLabel}` });
        if (this.data.status !== 'действует' && this.data.statusReason) {
            previewEl.createEl('p', { text: `**Причина:** ${this.data.statusReason}` });
        }
        if (this.data.oldEconomy) {
            previewEl.createEl('p', { text: `**Бывшая экономика:** ${this.data.oldEconomy.substring(0, 100)}...` });
        }
        if (this.data.currentState) {
            previewEl.createEl('p', { text: `**Текущее состояние:** ${this.data.currentState.substring(0, 100)}...` });
        }
        previewEl.createEl('p', { text: `**Описание:** ${(this.data.description || '').substring(0, 100)}...` });
        const findings = this.data.findings || [];
        previewEl.createEl('p', { text: `**Находки:** ${findings.join(', ')}` });
    }

    renderNavFlex(contentEl) {
        const navEl = contentEl.createEl('div', { cls: 'modal-nav' });
        navEl.style.display = 'flex';
        navEl.style.justifyContent = 'space-between';
        navEl.style.marginTop = '32px';
        navEl.style.gap = '16px';

        // Левая часть (Назад)
        const left = navEl.createDiv();
        if (this.step > 0) {
            const backBtn = left.createEl('button', { text: '← Назад' });
            backBtn.className = 'mod-cta';
            backBtn.onclick = () => {
                this.step--;
                this.render();
            };
        }

        // Правая часть (Далее/Создать)
        const right = navEl.createDiv();
        if (this.step < 8) {
            const nextBtn = right.createEl('button', { text: 'Далее →' });
            nextBtn.className = 'mod-cta';
            nextBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.step++;
                    this.render();
                }
            };
        } else {
            const finishBtn = right.createEl('button', { text: '✓ Создать мёртвую зону' });
            finishBtn.className = 'mod-cta';
            finishBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.onFinish(this.data);
                    this.close();
                }
            };
        }
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // Zone Name
                if (!this.data.zoneName.trim()) {
                    new this.Notice('Пожалуйста, введите название мертвой зоны.');
                    return false;
                }
                break;
            case 1: // Climate, Faction, Era (всё опционально)
                break;
            case 2: // Jurisdiction (optional)
                // Nothing to validate, as jurisdiction is optional
                break;
            case 3: // Old Economy (optional)
            case 4: // Current State (optional)
                // Nothing to validate, as they are optional
                break;
            case 5: // Description (опционально)
                break;
            case 6: // Findings
                // Findings can be empty
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
};



module.exports = DeadZoneWizardModal;
