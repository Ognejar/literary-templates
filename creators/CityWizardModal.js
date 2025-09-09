/**
 * @file       CityWizardModal.js
 * @description Модальное окно мастера для создания нового города.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals
 * @created    2024-07-29
 * @updated    2024-07-29
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

// Универсальная нормализация значения к массиву строк
function normalizeToArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
    if (value && typeof value === 'object') {
        // Преобразуем объект в массив его значений/названий
        const vals = Object.values(value);
        return vals
            .map(v => {
                if (typeof v === 'string') return v;
                if (v && typeof v === 'object') {
                    if (typeof v.name === 'string') return v.name;
                    return JSON.stringify(v);
                }
                return '';
            })
            .filter(Boolean);
    }
    return [];
}

const { EntityWizardBase } = require('./EntityWizardBase.js');

var CityWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            cityName: '',
            name: '', // Добавляем name для шаблона
            type: 'Город',
            climate: '',
            dominantFaction: '', // Переименовываем faction в dominantFaction
            province: '',
            country: '', // Добавляем country для шаблона
            state: '', // Добавляем state для шаблона
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
            // Юрисдикция
            jurisdictionMode: 'province', // 'province' | 'countryOnly'
            countryManual: '',
            // Убираем поля, которые будут заменены ссылками на заметки
            // description: '', // Будет ссылка на заметку
            // history: '', // Будет ссылка на заметку
            population: '',
            mainIndustries: [],
            districts: [],
            districtsSection: '', // Добавляем для шаблона
            uniqueFeatures: [],
            uniqueFeaturesSection: '', // Добавляем для шаблона
            features: []
        };
        // Используем синхронную инициализацию, как в других модулях
        this.projectRoot = projectRoot;
        this.config = {
            climates: [],
            factions: [],
            provinces: [],
            countries: [],
            statuses: [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ]
        };
        this.steps = [
            'Название города',
            'Статус города',
            'Климат и фракция',
            'Юрисдикция',
            'Основные отрасли',
            'Районы',
            'Уникальные особенности',
            'Предпросмотр',
        ];
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
        this.titleEl.setText('Создание нового города');
        await this.loadConfig();
        this.render();
    }

        async loadConfig() {
        try {
            // Инициализируем config объект, сохраняя statuses
            const defaultStatuses = (this.config && Array.isArray(this.config.statuses) && this.config.statuses.length > 0)
                ? this.config.statuses
                : [
                    { value: 'действует', label: 'Действует', icon: '✅' },
                    { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                    { value: 'разрушено', label: 'Разрушено', icon: '💥' }
                ];
            this.config = {
                locationTypes: [],
                climates: [],
                factions: [],
                provinces: [],
                countries: [],
                statuses: defaultStatuses
            };

            const projectRoot = this.projectRoot; // Используем переданный projectRoot
            if (!projectRoot) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }
            
            // Загружаем настройки через сервис
            const svc = window.litSettingsService;
            if (svc) {
                const settings = await svc.readWorldSettings(this.app, projectRoot);
                this.config.locationTypes = await svc.getLocationTypes(this.app, projectRoot);
                this.config.climates = await svc.getClimates(this.app, projectRoot);
                this.config.factions = await svc.getFactions(this.app, projectRoot);
            } else {
                // Fallback на старую логику (если сервис не подгрузился)
                const jsonFile = this.app.vault.getAbstractFileByPath(`${projectRoot}/Настройки_мира.json`);
                if (jsonFile instanceof TFile) {
                    try {
                        const jsonContent = await this.app.vault.read(jsonFile);
                        const parsedConfig = JSON.parse(jsonContent);
                        this.config.locationTypes = normalizeToArray(parsedConfig.locationTypes);
                        this.config.climates = normalizeToArray(parsedConfig.climates);
                        const factionsSource = parsedConfig.locations?.factions ?? parsedConfig.factions;
                        this.config.factions = normalizeToArray(factionsSource);
                    } catch (e) {}
                }
            }
            
            // Загружаем государства
            this.config.countries = this.loadFilesFromFolder(`${projectRoot}/Локации/Государства`, 'Государства');
            
            // Загружаем все провинции (будут фильтроваться по государству)
            this.config.allProvinces = this.loadFilesFromFolder(`${projectRoot}/Локации/Провинции`, 'Провинции');
            this.config.provinces = []; // Будет заполнено при выборе государства

            
            // Инициализируем значения по умолчанию
            this.data.climate = this.data.climate || this.config.climates[0] || 'Умеренный';
            this.data.dominantFaction = this.data.dominantFaction || this.config.factions[0] || 'Королевская власть';
        } catch (e) {
            new this.Notice('Ошибка загрузки конфигурации: ' + e.message);
            this.close();
        }
    }

    /**
     * Фильтрует провинции по выбранному государству
     * @param {string} countryName - название государства
     */
    async filterProvincesByCountry(countryName) {
        if (!countryName || countryName === 'manual') {
            this.config.provinces = [];
            return;
        }

        try {
            this.config.provinces = await this.filterProvincesByState(countryName, this.projectRoot, this.config.allProvinces);
        } catch (e) {
            console.error('Ошибка фильтрации провинций:', e);
            this.config.provinces = [];
        }
    }
    render() {
        const { contentEl } = this;
        contentEl.empty();

        // Индикатор прогресса
        const progress = contentEl.createDiv('progress-indicator');
        progress.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--background-secondary);
            border-radius: 8px;
        `;
        
        this.steps.forEach((step, index) => {
            const stepEl = progress.createDiv('step');
            stepEl.style.cssText = `
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: ${index === this.step ? '600' : '400'};
                color: ${index === this.step ? 'var(--text-on-accent)' : 'var(--text-muted)'};
                background: ${index === this.step ? 'var(--interactive-accent)' : 'transparent'};
            `;
            stepEl.textContent = step;
        });
        
        // Заголовок шага
        const header = contentEl.createEl('h2', { text: this.steps[this.step] });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;

        // Основной контент
        switch (this.step) {
            case 0: this.renderCityName(contentEl); break;
            case 1: this.renderStatus(contentEl); break;
            case 2: this.renderClimateFaction(contentEl); break;
            case 3: this.renderJurisdiction(contentEl); break;
            case 4: this.renderMainIndustries(contentEl); break;
            case 5: this.renderDistricts(contentEl); break;
            case 6: this.renderUniqueFeatures(contentEl); break;
            case 7: this.renderPreview(contentEl); break;
        }

        // Унифицированная навигация
        this.renderNavigation(contentEl);
    }

    renderCityName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название города')
            .addText(text => {
                text.setPlaceholder('Название города')
                    .setValue(this.data.cityName)
                    .onChange(value => {
                        this.data.cityName = value;
                        this.data.name = value; // Обновляем также поле name для шаблона
                    });
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });
    }

    renderStatus(contentEl) {
        new this.Setting(contentEl)
            .setName('Статус города')
            .addDropdown(dropdown => {
                this.config.statuses = this.ensureStatuses(this.config.statuses);
                this.addDropdownOptions(dropdown, this.config.statuses);
                dropdown.setValue(this.data.status);
                dropdown.onChange(value => {
                    this.data.status = value;
                    const reasonSetting = contentEl.querySelector('.status-reason-setting');
                    if (reasonSetting) {
                        reasonSetting.style.display = value === 'действует' ? 'none' : 'block';
                    }
                });
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        const reasonSetting = new this.Setting(contentEl)
            .setName('Причина')
            .addText(text => {
                text.setPlaceholder('Например: Война, катастрофа, эпидемия')
                    .setValue(this.data.statusReason)
                    .onChange(value => {
                        this.data.statusReason = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
        reasonSetting.settingEl.addClass('status-reason-setting');
        if (this.data.status === 'действует') {
            reasonSetting.settingEl.style.display = 'none';
        }
    }

    renderClimateFaction(contentEl) {
        // Климат
        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите климат');
                this.config.climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate || '');
                dropdown.onChange(value => this.data.climate = value);
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
                dropdown.selectEl.style.borderRadius = '4px';
                dropdown.selectEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Доминирующая фракция — теперь свободный ввод
        new this.Setting(contentEl)
            .setName('Доминирующая фракция')
            .addText(text => {
                text.setPlaceholder('Введите название фракции')
                    .setValue(this.data.dominantFaction || '')
                    .onChange(value => this.data.dominantFaction = value);
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderJurisdiction(contentEl) {
        // Сначала государство (ОБЯЗАТЕЛЬНО)
        const countries = this.config.countries || [];
        new this.Setting(contentEl)
            .setName('Государство *')
            .setDesc('Выберите государство, в котором находится город')
            .addDropdown(d => {
                d.addOption('', 'Выберите государство');
                countries.forEach(c => d.addOption(c, c));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.country || '');
                d.onChange(async (v) => { 
                    this.data.country = v; 
                    // Обновляем поле state для шаблона
                    if (v === 'manual') {
                        this.data.state = this.data.countryManual || '';
                        this.config.provinces = []; // Очищаем провинции
                    } else {
                        this.data.state = v;
                        // Фильтруем провинции по выбранному государству
                        this.config.allProvinces = this.loadFilesFromFolder(`${this.projectRoot}/Локации/Провинции`, 'Провинции');
                        await this.filterProvincesByCountry(v);
                    }
                    this.render(); 
                });
                // Увеличиваем размер выпадающего списка
                d.selectEl.style.minWidth = '320px';
                d.selectEl.style.fontSize = '14px';
                d.selectEl.style.padding = '6px';
            });

        // Ручной ввод государства
        if (this.data.country === 'manual') {
            new this.Setting(contentEl)
                .setName('Государство (ручной ввод) *')
                .setDesc('Введите название государства')
                .addText(t => {
                    t.setValue(this.data.countryManual || '').onChange(v => {
                        this.data.countryManual = v;
                        this.data.state = v; // Обновляем поле state для шаблона
                    });
                    // Увеличиваем размер поля
                    t.inputEl.style.width = '100%';
                    t.inputEl.style.fontSize = '16px';
                    t.inputEl.style.padding = '8px';
                });
        }

        // Режим (только после выбора государства)
        if (this.data.country && this.data.country !== '') {
            new this.Setting(contentEl)
                .setName('Режим')
                .setDesc('Выберите, будет ли город в провинции или только в стране')
                .addDropdown(d => {
                    d.addOption('province', 'С провинцией');
                    d.addOption('countryOnly', 'Без провинции (только страна)');
                    d.setValue(this.data.jurisdictionMode || 'province');
                    d.onChange(v => { this.data.jurisdictionMode = v; this.render(); });
                    // Увеличиваем размер выпадающего списка
                    d.selectEl.style.minWidth = '300px';
                    d.selectEl.style.fontSize = '14px';
                    d.selectEl.style.padding = '6px';
                });

            // Провинция (если выбран режим province)
            if ((this.data.jurisdictionMode || 'province') === 'province') {
                const provinceDesc = this.data.country && this.data.country !== 'manual' 
                    ? `Провинции государства "${this.data.country}"` 
                    : 'Выберите провинцию';
                
                new this.Setting(contentEl)
                    .setName('Провинция')
                    .setDesc(provinceDesc)
                    .addDropdown(dropdown => {
                        dropdown.addOption('', 'Выберите провинцию (опционально)');
                        this.config.provinces.forEach(province => dropdown.addOption(province, province));
                        dropdown.setValue(this.data.province || '');
                        dropdown.onChange(value => this.data.province = value);
                        // Увеличиваем размер выпадающего списка
                        dropdown.selectEl.style.minWidth = '320px';
                        dropdown.selectEl.style.fontSize = '14px';
                        dropdown.selectEl.style.padding = '6px';
                    });
            }
        }
    }

    renderMainIndustries(contentEl) {
        new this.Setting(contentEl)
            .setName('Основные отрасли (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте основные отрасли, каждую с новой строки')
                    .setValue(this.data.mainIndustries ? this.data.mainIndustries.join('\n') : '')
                    .onChange(value => {
                        this.data.mainIndustries = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderDistricts(contentEl) {
        new this.Setting(contentEl)
            .setName('Районы (каждый с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте районы, каждый с новой строки')
                    .setValue(this.data.districts ? this.data.districts.join('\n') : '')
                    .onChange(value => {
                        this.data.districts = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                        this.data.districtsSection = this.data.districts.map(d => `- ${d}`).join('\n');
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderUniqueFeatures(contentEl) {
        new this.Setting(contentEl)
            .setName('Уникальные особенности (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте уникальные особенности, каждую с новой строки')
                    .setValue(this.data.uniqueFeatures ? this.data.uniqueFeatures.join('\n') : '')
                    .onChange(value => {
                        this.data.uniqueFeatures = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                        this.data.uniqueFeaturesSection = this.data.uniqueFeatures.map(f => `- ${f}`).join('\n');
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.cityName}` });
        previewEl.createEl('p', { text: `**Тип:** ${this.data.type}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Доминирующая фракция:** ${this.data.dominantFaction}` });
        const countryDisplay = (this.data.country === 'manual') ? (this.data.countryManual || '') : (this.data.country || '');
        if (countryDisplay) {
            previewEl.createEl('p', { text: `**Государство:** ${countryDisplay}` });
        }
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        previewEl.createEl('p', { text: `**Описание:** Ссылка на заметку будет создана автоматически` });
        previewEl.createEl('p', { text: `**История:** Ссылка на заметку будет создана автоматически` });
        previewEl.createEl('p', { text: `**Основные отрасли:** ${this.data.mainIndustries && this.data.mainIndustries.length > 0 ? this.data.mainIndustries.join(', ') : 'Не указаны'}` });
        previewEl.createEl('p', { text: `**Районы:** ${this.data.districts && this.data.districts.length > 0 ? this.data.districts.join(', ') : 'Не указаны'}` });
        previewEl.createEl('p', { text: `**Уникальные особенности:** ${this.data.uniqueFeatures && this.data.uniqueFeatures.length > 0 ? this.data.uniqueFeatures.join(', ') : 'Не указаны'}` });
        
        // Добавляем отладочную информацию
        previewEl.createEl('hr');
        previewEl.createEl('h4', { text: 'Отладочная информация:' });
        previewEl.createEl('p', { text: `**name:** "${this.data.name}"` });
        previewEl.createEl('p', { text: `**state:** "${this.data.state}"` });
        previewEl.createEl('p', { text: `**country:** "${this.data.country}"` });
        previewEl.createEl('p', { text: `**countryManual:** "${this.data.countryManual}"` });
    }

    renderNavigation(contentEl) {
        const navEl = contentEl.createEl('div', { cls: 'modal-nav' });
        navEl.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--background-modifier-border);
        `;
        
        const leftButtons = navEl.createDiv('nav-left');
        const rightButtons = navEl.createDiv('nav-right');
        
        // Кнопка "Назад"
        if (this.step > 0) {
            const prevBtn = leftButtons.createEl('button', { text: '← Назад' });
            prevBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--background-secondary);
                color: var(--text-muted);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            prevBtn.addEventListener('mouseenter', () => {
                prevBtn.style.background = 'var(--background-modifier-hover)';
            });
            prevBtn.addEventListener('mouseleave', () => {
                prevBtn.style.background = 'var(--background-secondary)';
            });
            prevBtn.onclick = () => {
                this.step--;
                this.render();
            };
        }
        
        // Кнопка "Далее" или "Завершить"
        if (this.step < this.steps.length - 1) {
            const nextBtn = rightButtons.createEl('button', { text: 'Далее →' });
            nextBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            nextBtn.addEventListener('mouseenter', () => {
                nextBtn.style.background = 'var(--interactive-accent-hover)';
            });
            nextBtn.addEventListener('mouseleave', () => {
                nextBtn.style.background = 'var(--interactive-accent)';
            });
            nextBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.step++;
                    this.render();
                }
            };
        } else {
            const finishBtn = rightButtons.createEl('button', { text: '✓ Создать город' });
            finishBtn.style.cssText = `
                padding: 10px 20px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            finishBtn.addEventListener('mouseenter', () => {
                finishBtn.style.background = 'var(--interactive-accent-hover)';
            });
            finishBtn.addEventListener('mouseleave', () => {
                finishBtn.style.background = 'var(--interactive-accent)';
            });
            finishBtn.onclick = async () => {
                if (this.validateCurrentStep()) {
                    if (this.validateTemplateMapping()) {
                        try {
                            // Дождаться завершения создания; закрыть окно только при успехе
                            if (this.onFinish) {
                                await this.onFinish(this.data);
                            }
                            this.close();
                        } catch (e) {
                            console.error('[CityWizardModal] Ошибка создания города:', e);
                            new this.Notice('Не удалось создать город: ' + (e?.message || e));
                        }
                    } else {
                        new this.Notice('Ошибка: не все обязательные поля заполнены для создания города.');
                    }
                }
            };
        }
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // Название города
                if (!this.data.cityName.trim()) {
                    new this.Notice('Пожалуйста, введите название города.');
                    return false;
                }
                break;
            case 1: // Статус — специфической валидации нет
                break;
            case 2: // Климат и фракция
                if (!this.data.climate || this.data.climate.trim() === '' || !this.data.dominantFaction || this.data.dominantFaction.trim() === '') {
                    new this.Notice('Пожалуйста, выберите климат и доминирующую фракцию.');
                    return false;
                }
                break;
            case 3: // Юрисдикция (провинция/государство)
                if ((this.data.jurisdictionMode || 'province') === 'province') {
                    if (!this.data.province || this.data.province.trim() === '') {
                        new this.Notice('Пожалуйста, выберите провинцию или смените режим на "Без провинции (только государство)".');
                        return false;
                    }
                } else { // countryOnly
                    const countryValue = (this.data.country === 'manual') ? (this.data.countryManual || '') : (this.data.country || '');
                    if (!countryValue.trim()) {
                        new this.Notice('Пожалуйста, укажите государство.');
                        return false;
                    }
                }
                break;
            case 4: // Основные отрасли
                // Industries can be empty
                break;
            case 5: // Районы
                // Districts can be empty
                break;
            case 6: // Уникальные особенности
                // Unique Features can be empty
                break;
            case 7: // Предпросмотр
                // Features can be empty
                break;
        }
        return true;
    }

    /**
     * Валидация соответствия полей шаблону
     * Проверяет, что все необходимые поля для шаблона заполнены
     */
    validateTemplateMapping() {
        const requiredFields = [
            'name', 'type', 'climate', 'dominantFaction', 'state'
        ];
        
        const optionalFields = ['province'];
        
        // Проверяем обязательные поля
        const missingRequiredFields = requiredFields.filter(field => {
            const value = this.data[field];
            return !value || (typeof value === 'string' && !value.trim());
        });
        
        // Проверяем опциональные поля (предупреждение, но не ошибка)
        const missingOptionalFields = optionalFields.filter(field => {
            const value = this.data[field];
            return !value || (typeof value === 'string' && !value.trim());
        });
        
        if (missingRequiredFields.length > 0) {
            console.warn('CityWizardModal: Missing required fields for template:', missingRequiredFields);
            return false;
        }
        
        if (missingOptionalFields.length > 0) {
            console.log('CityWizardModal: Missing optional fields for template:', missingOptionalFields);
        }
        
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }

    async finish() {
        try {
            // Добавляем текущую дату
            this.data.date = window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10);
            
            // Добавляем поля для шаблона
            this.data.name = this.data.cityName; // для совместимости с шаблоном
            this.data.history = this.data.history || []; // убеждаемся что массив существует
            this.data.population_history = this.data.population_history || []; // убеждаемся что массив существует

            // Правильно заполняем поле state
            if (this.data.country === 'manual') {
                this.data.state = this.data.countryManual || 'Не указано';
            } else if (this.data.country && this.data.country !== '') {
                this.data.state = this.data.country;
            } else {
                this.data.state = 'Не указано';
            }
            
            // Очищаем пустые поля (только для строк, не для массивов), но НЕ трогаем state
            Object.keys(this.data).forEach(key => {
                if (key !== 'state' && this.data[key] === '' && typeof this.data[key] === 'string') {
                    this.data[key] = 'Не указано';
                }
            });

            await this.onFinish(this.data);
            this.close();
        } catch (error) {
            console.error('Ошибка при создании города:', error);
            new this.Notice('Ошибка при создании города');
        }
    }

    onFinish() {
        console.log('[DEBUG] CityWizardModal: onFinish вызван');
        console.log('[DEBUG] CityWizardModal: Данные для передачи:', this.data);
        
        // Проверяем соответствие полей шаблону
        if (!this.validateTemplateMapping()) {
            console.warn('[DEBUG] CityWizardModal: Валидация шаблона не пройдена');
            return;
        }
        
        console.log('[DEBUG] CityWizardModal: Валидация пройдена, вызываем finish');
        
        // Вызываем finish для подготовки данных
        this.finish();
    }
};

module.exports = { CityWizardModal };
