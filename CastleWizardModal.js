/**
 * @file       CastleWizardModal.js
 * @description Модальное окно мастера для создания нового замка/крепости.
 * @author     [автор]
 * @version    1.0.0
 * @license    [лицензия]
 * @dependencies obsidian, utils/modals
 * @created    2023-10-27
 * @updated    2023-10-27
 * @docs       [ссылка на документацию]
 */

// Modal, Setting, Notice передаются через конструктор

class CastleWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            castleName: '',
            fortificationType: 'Замок', // Замок | Крепость | Форт
            type: 'Замок',
            climate: '',
            dominantFaction: '',
            province: '',
            state: '',
            country: '',
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
            description: '',
            fortifications: [],
            garrison: [],
            garrisonSize: '',
            garrisonTier: '',
            notableFeatures: []
        };
        this.config = {
            locationTypes: [],
            climates: [],
            factions: [],
            provinces: [],
            states: [],
            statuses: [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ]
        };
        this.steps = [
            'Название и тип',
            'Статус фортификации',
            'Климат и фракция',
            'Государство и провинция',
            'Описание',
            'Укрепления',
            'Гарнизон',
            'Примечательные особенности',
            'Предпросмотр'
        ];
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
        this.titleEl.setText('Создание фортификации');
        await this.loadConfig();
        // Префилл типа при быстром запуске из меню
        if (this.prefillType && typeof this.prefillType === 'string') {
            this.applyFortificationTypeDefaults(this.prefillType);
        }
        this.render();
    }

    async loadConfig() {
        try {
            const projectRoot = this.projectRoot;
            if (!projectRoot) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }

            // Унифицированная загрузка настроек мира
            const svc = window.litSettingsService;
            const ensureArray = (arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []);
            if (svc && typeof svc.getClimates === 'function') {
                this.config.climates = ensureArray(await svc.getClimates(projectRoot));
                this.config.factions = ensureArray(await svc.getFactions(projectRoot));
                this.config.locationTypes = ensureArray(await svc.getLocationTypes(projectRoot));
            } else {
                // Fallback: читаем JSON напрямую
                try {
                    const jsonPath = `${projectRoot}/Настройки_мира.json`;
                    const raw = await this.app.vault.adapter.read(jsonPath);
                    const parsed = JSON.parse(raw || '{}');
                    const loc = parsed.locations || {};
                    this.config.climates = ensureArray(loc.climates);
                    this.config.factions = ensureArray(loc.factions);
                    this.config.locationTypes = ensureArray(loc.locationTypes);
                } catch {
                    this.config.climates = [];
                    this.config.factions = [];
                    this.config.locationTypes = [];
                }
            }

            // Список провинций берём из папки `Провинции`
            this.config.provinces = [];
            const provincesFolderPath = `${projectRoot}/Провинции`;
            const provincesFolder = this.app.vault.getAbstractFileByPath(provincesFolderPath);
            if (provincesFolder && provincesFolder.children && Array.isArray(provincesFolder.children)) {
                this.config.provinces = provincesFolder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename.replace(/\.md$/i, ''));
            }

            // Список государств берём из папки `Государства`
            this.config.states = [];
            const statesFolderPath = `${projectRoot}/Государства`;
            const statesFolder = this.app.vault.getAbstractFileByPath(statesFolderPath);
            if (statesFolder && statesFolder.children && Array.isArray(statesFolder.children)) {
                this.config.states = statesFolder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename.replace(/\.md$/i, ''));
            }

            this.data.climate = this.data.climate || (this.config.climates[0] || '');
            this.data.dominantFaction = this.data.dominantFaction || (this.config.factions[0] || '');

            console.log('DEBUG: CastleWizardModal - Config loaded. climates:', this.config.climates, 'factions:', this.config.factions);
            console.log('DEBUG: CastleWizardModal - Data initialized. climate:', this.data.climate, 'dominantFaction:', this.data.dominantFaction);

        } catch (e) {
            new this.Notice('Ошибка загрузки конфигурации для замка: ' + e.message);
            console.error('Ошибка загрузки конфигурации для замка:', e);
            this.close();
        }
    }

    render() {
        this.contentEl.empty();
        const { contentEl } = this;
        let navButtons = '';

        switch (this.step) {
            case 0:
                this.titleEl.setText('Создание фортификации - Шаг 1/9: Название и тип');
                this.renderNameAndType(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание фортификации - Шаг 2/9: Статус фортификации');
                this.renderStatus(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание фортификации - Шаг 3/9: Климат и фракция');
                this.renderClimateDominantFaction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание фортификации - Шаг 4/9: Государство и провинция');
                this.renderProvince(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание фортификации - Шаг 5/9: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание фортификации - Шаг 6/9: Укрепления');
                this.renderFortifications(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 6:
                this.titleEl.setText('Создание фортификации - Шаг 7/9: Гарнизон');
                this.renderGarrison(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 7:
                this.titleEl.setText('Создание фортификации - Шаг 8/9: Примечательные особенности');
                this.renderNotableFeatures(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 8:
                this.titleEl.setText('Создание фортификации - Шаг 9/9: Предпросмотр');
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNav(contentEl, navButtons);
    }

    renderNameAndType(contentEl) {
        new this.Setting(contentEl)
            .setName('Название фортификации')
            .addText(text => {
                text.setPlaceholder('Название (замок/крепость/форт)')
                    .setValue(this.data.castleName)
                    .onChange(value => {
                        this.data.castleName = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });

        new this.Setting(contentEl)
            .setName('Тип фортификации')
            .addDropdown(d => {
                ['Замок','Крепость','Форт'].forEach(t => d.addOption(t, t));
                d.setValue(this.data.fortificationType || 'Замок');
                d.onChange(v => {
                    this.applyFortificationTypeDefaults(v);
                });
                d.selectEl.style.minWidth = '320px';
            });
    }

    renderStatus(contentEl) {
        new this.Setting(contentEl)
            .setName('Статус фортификации')
            .addDropdown(dropdown => {
                this.config.statuses.forEach(status => {
                    dropdown.addOption(status.value, `${status.icon} ${status.label}`);
                });
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
                text.setPlaceholder('Например: Война, осада, забвение')
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

    applyFortificationTypeDefaults(v) {
        this.data.fortificationType = v;
        this.data.type = v;
        if (v === 'Форт') { this.data.garrisonSize = '50–200'; this.data.garrisonTier = 'C'; }
        if (v === 'Замок') { this.data.garrisonSize = '200–800'; this.data.garrisonTier = 'B'; }
        if (v === 'Крепость') { this.data.garrisonSize = '800–3000'; this.data.garrisonTier = 'A'; }
    }

    renderClimateDominantFaction(contentEl) {
        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                this.config.climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate || this.config.climates[0]);
                dropdown.onChange(value => this.data.climate = value);
                // Увеличиваем размер выпадающего списка
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
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderProvince(contentEl) {
        new this.Setting(contentEl)
            .setName('Государство')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите государство');
                this.config.states.forEach(state => dropdown.addOption(state, state));
                dropdown.setValue(this.data.state);
                dropdown.onChange(value => this.data.state = value);
                // Увеличиваем размер выпадающего списка
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
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderDescription(contentEl) {
        new this.Setting(contentEl)
            .setName('Описание')
            .addTextArea(text => {
                text.setPlaceholder('Подробное описание замка/крепости')
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

    renderFortifications(contentEl) {
        new this.Setting(contentEl)
            .setName('Укрепления (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте описание укреплений, каждую с новой строки')
                    .setValue(this.data.fortifications.join('\n'))
                    .onChange(value => {
                        this.data.fortifications = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderGarrison(contentEl) {
        new this.Setting(contentEl)
            .setName('Гарнизон (каждый с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте информацию о гарнизоне, каждую с новой строки')
                    .setValue(this.data.garrison.join('\n'))
                    .onChange(value => {
                        this.data.garrison = value.split('\n').map(g => g.trim()).filter(g => g.length > 0);
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderNotableFeatures(contentEl) {
        new this.Setting(contentEl)
            .setName('Примечательные особенности (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте примечательные особенности, каждую с новой строки')
                    .setValue(this.data.notableFeatures.join('\n'))
                    .onChange(value => {
                        this.data.notableFeatures = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
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
        previewEl.createEl('p', { text: `**Название:** ${this.data.castleName}` });
        previewEl.createEl('p', { text: `**Тип:** ${this.data.fortificationType}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Доминирующая фракция:** ${this.data.dominantFaction}` });
        if (this.data.state) {
            previewEl.createEl('p', { text: `**Государство:** ${this.data.state}` });
        }
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        previewEl.createEl('p', { text: `**Гарнизон (оценка):** ${this.data.garrisonSize || ''} (уровень ${this.data.garrisonTier || ''})` });
        previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
        previewEl.createEl('p', { text: `**Укрепления:** ${this.data.fortifications.join(', ')}` });
        previewEl.createEl('p', { text: `**Гарнизон:** ${this.data.garrison.join(', ')}` });
        previewEl.createEl('p', { text: `**Примечательные особенности:** ${this.data.notableFeatures.join(', ')}` });
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
            case 0: // Castle Name
                if (!this.data.castleName.trim()) {
                    new this.Notice('Пожалуйста, введите название замка/крепости.');
                    return false;
                }
                break;
            case 1: // Climate, Dominant Faction
                if ( (this.config.climates.length > 0 && (!this.data.climate || this.data.climate.trim() === '')) ||
                     (this.config.factions.length > 0 && (!this.data.dominantFaction || this.data.dominantFaction.trim() === ''))
                   ) {
                    new this.Notice('Пожалуйста, выберите климат и доминирующую фракцию.');
                    return false;
                }
                break;
            case 2: // Province (optional)
                if (!this.data.state || this.data.state.trim() === '') {
                    new this.Notice('Пожалуйста, выберите государство.');
                    return false;
                }
                break;
            case 3: // Description
                if (!this.data.description.trim()) {
                    new this.Notice('Пожалуйста, введите описание замка/крепости.');
                    return false;
                }
                break;
            case 4: // Fortifications (optional)
            case 5: // Garrison (optional)
            case 6: // Notable Features (optional)
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = CastleWizardModal;
