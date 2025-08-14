/**
 * @file       LocationWizardModal.js
 * @description Модальное окно мастера для создания новой локации.
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

class LocationWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            locationName: '',
            type: 'Локация',
            description: '',
            region: '',
            climate: '',
            faction: '',
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
        };
        this.config = {
            locationTypes: [],
            climates: [],
            factions: [],
            provinces: [],
            statuses: [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ]
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
        this.titleEl.setText('Создание новой локации');
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
            const settingsFile = this.app.vault.getAbstractFileByPath(`${projectRoot}/Настройки_мира.md`);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    this.config.locationTypes = parsedConfig.locations.locationTypes || [];
                    this.config.climates = parsedConfig.locations.climates || [];
                    this.config.factions = parsedConfig.locations.factions || [];
                }
            }

            const locationsFolder = `${projectRoot}/Локации`;
            const folder = this.app.vault.getAbstractFileByPath(locationsFolder);
            if (folder && folder.children) {
                this.config.provinces = folder.children
                    .filter(f => f instanceof TFile && f.extension === 'md' && f.basename.includes('Провинция') && !f.basename.startsWith('Index') && !f.basename.startsWith('.'))
                    .map(f => f.basename);
            }
            // Инициализируем this.data.type, this.data.climate и this.data.faction здесь, после загрузки конфига
            this.data.type = this.data.type || this.config.locationTypes[0] || '';
            this.data.climate = this.data.climate || this.config.climates[0] || '';
            this.data.faction = this.data.faction || this.config.factions[0] || '';

            console.log('DEBUG: LocationWizardModal - Config loaded. this.config.locationTypes:', this.config.locationTypes, 'climates:', this.config.climates, 'factions:', this.config.factions);
            console.log('DEBUG: LocationWizardModal - Data initialized. type:', this.data.type, 'climate:', this.data.climate, 'faction:', this.data.faction);
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
                this.titleEl.setText('Создание новой локации - Шаг 1/6: Название');
                this.renderLocationName(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание новой локации - Шаг 2/6: Статус локации');
                this.renderStatus(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание новой локации - Шаг 3/6: Тип, Климат, Фракция');
                this.renderTypeClimateFaction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание новой локации - Шаг 4/6: Провинция');
                this.renderProvince(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание новой локации - Шаг 5/6: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание новой локации - Шаг 6/6: Особенности и Предпросмотр');
                this.renderFeatures(contentEl);
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNav(contentEl, navButtons);
    }

    renderLocationName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название локации')
            .addText(text => {
                text.setPlaceholder('Название локации')
                    .setValue(this.data.locationName)
                    .onChange(value => {
                        this.data.locationName = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderStatus(contentEl) {
        new this.Setting(contentEl)
            .setName('Статус локации')
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
                text.setPlaceholder('Например: Катастрофа, забвение, изменение ландшафта')
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

    renderTypeClimateFaction(contentEl) {
        new this.Setting(contentEl)
            .setName('Тип локации')
            .addDropdown(dropdown => {
                this.config.locationTypes.forEach(type => dropdown.addOption(type, type));
                dropdown.setValue(this.data.type || this.config.locationTypes[0]);
                dropdown.onChange(value => this.data.type = value);
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

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
            .setName('Фракция')
            .addDropdown(dropdown => {
                this.config.factions.forEach(faction => dropdown.addOption(faction, faction));
                dropdown.setValue(this.data.faction || this.config.factions[0]);
                dropdown.onChange(value => this.data.faction = value);
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderProvince(contentEl) {
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
                text.setPlaceholder('Подробное описание локации')
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

    renderFeatures(contentEl) {
        const featureContainer = contentEl.createEl('div', { cls: 'features-container' });
        new this.Setting(featureContainer)
            .setName('Особенности (каждая с новой строки)')
            .addTextArea(text => {
                text.setPlaceholder('Добавьте особенности, каждую с новой строки')
                    .setValue(this.data.features.join('\\n'))
                    .onChange(value => {
                        this.data.features = value.split('\\n').map(f => f.trim()).filter(f => f.length > 0);
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

    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.locationName}` });
        previewEl.createEl('p', { text: `**Тип:** ${this.data.type}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Фракция:** ${this.data.faction}` });
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
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
            case 0: // Название локации
                if (!this.data.locationName.trim()) {
                    new this.Notice('Пожалуйста, введите название локации.');
                    return false;
                }
                break;
            case 1: // Статус — специфической валидации нет
                break;
            case 2: // Тип, Климат, Фракция
                if (!this.data.type || !this.data.climate || !this.data.faction) {
                    new this.Notice('Пожалуйста, выберите тип, климат и фракцию.');
                    return false;
                }
                break;
            case 3: // Провинция (опционально)
                // Ничего не проверяем — опционально
                break;
            case 4: // Описание
                if (!this.data.description.trim()) {
                    new this.Notice('Пожалуйста, введите описание локации.');
                    return false;
                }
                break;
            case 5: // Особенности (опционально)
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = LocationWizardModal;
