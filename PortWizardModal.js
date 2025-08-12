/**
 * @file       PortWizardModal.js
 * @description Модальное окно мастера для создания нового порта.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals, settingsService
 * @created    2024-07-29
 * @updated    2025-01-09
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

class PortWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            portName: '',
            description: '',
            climate: '',
            dominantFaction: '',
            harborType: '',
            province: '',
            state: '',
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
            docks: '',
            mainGoods: [],
            ships: [],
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
            ]
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
        this.titleEl.setText('Создание нового порта');
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
            const provincesFolder = `${this.projectRoot}/Провинции`;
            const provincesFolderObj = this.app.vault.getAbstractFileByPath(provincesFolder);
            if (provincesFolderObj && provincesFolderObj.children) {
                this.config.provinces = provincesFolderObj.children
                    .filter(f => f instanceof TFile && f.extension === 'md')
                    .map(f => f.basename);
            }

            // Загружаем государства
            const statesFolder = `${this.projectRoot}/Государства`;
            const statesFolderObj = this.app.vault.getAbstractFileByPath(statesFolder);
            if (statesFolderObj && statesFolderObj.children) {
                this.config.states = statesFolderObj.children
                    .filter(f => f instanceof TFile && f.extension === 'md')
                    .map(f => f.basename);
            }

            // Инициализируем значения по умолчанию
            this.data.climate = this.data.climate || (this.config.climates[0] || '');
            this.data.dominantFaction = this.data.dominantFaction || (this.config.factions[0] || '');

            console.log('DEBUG: PortWizardModal - Config loaded. climates:', this.config.climates, 'factions:', this.config.factions);
            console.log('DEBUG: PortWizardModal - Data initialized. climate:', this.data.climate, 'dominantFaction:', this.data.dominantFaction);
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
                this.titleEl.setText('Создание нового порта - Шаг 1/9: Название');
                this.renderPortName(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание нового порта - Шаг 2/9: Статус порта');
                this.renderStatus(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание нового порта - Шаг 3/9: Климат и фракция');
                this.renderClimateFaction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание нового порта - Шаг 4/9: Государство и провинция');
                this.renderStateProvince(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание нового порта - Шаг 5/9: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание нового порта - Шаг 6/9: Тип гавани и причалы');
                this.renderHarborTypeDocks(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 6:
                this.titleEl.setText('Создание нового порта - Шаг 7/9: Основные товары и типы судов');
                this.renderMainGoodsShips(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 7:
                this.titleEl.setText('Создание нового порта - Шаг 8/9: Особенности');
                this.renderFeatures(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 8:
                this.titleEl.setText('Создание нового порта - Шаг 9/9: Предпросмотр');
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNav(contentEl, navButtons);
    }

    renderPortName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название порта')
            .addText(text => {
                text.setPlaceholder('Название порта')
                    .setValue(this.data.portName)
                    .onChange(value => {
                        this.data.portName = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderStatus(contentEl) {
        new this.Setting(contentEl)
            .setName('Статус порта')
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
                text.setPlaceholder('Например: Война, шторм, экономический кризис')
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
                text.setPlaceholder('Подробное описание порта')
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

    renderHarborTypeDocks(contentEl) {
        new this.Setting(contentEl)
            .setName('Тип гавани')
            .addText(text => {
                text.setPlaceholder('Например: Естественная бухта, Искусственная гавань')
                    .setValue(this.data.harborType)
                    .onChange(value => {
                        this.data.harborType = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });

        new this.Setting(contentEl)
            .setName('Количество причалов')
            .addText(text => {
                text.setPlaceholder('Например: 5')
                    .setValue(this.data.docks)
                    .onChange(value => {
                        this.data.docks = value;
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderMainGoodsShips(contentEl) {
        new this.Setting(contentEl)
            .setName('Основные товары (через запятую)')
            .addTextArea(text => {
                text.setPlaceholder('Например: Зерно, рыба, лес')
                    .setValue(this.data.mainGoods.join(', '))
                    .onChange(value => {
                        this.data.mainGoods = value.split(',').map(s => s.trim()).filter(Boolean);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });

        new this.Setting(contentEl)
            .setName('Типы судов (через запятую)')
            .addTextArea(text => {
                text.setPlaceholder('Например: Каравеллы, галеоны, шхуны')
                    .setValue(this.data.ships.join(', '))
                    .onChange(value => {
                        this.data.ships = value.split(',').map(s => s.trim()).filter(Boolean);
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
        previewEl.createEl('p', { text: `**Название:** ${this.data.portName}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Доминирующая фракция:** ${this.data.dominantFaction}` });
        if (this.data.state) {
            previewEl.createEl('p', { text: `**Государство:** ${this.data.state}` });
        }
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
        previewEl.createEl('p', { text: `**Тип гавани:** ${this.data.harborType}` });
        previewEl.createEl('p', { text: `**Количество причалов:** ${this.data.docks}` });
        previewEl.createEl('p', { text: `**Основные товары:** ${this.data.mainGoods.join(', ')}` });
        previewEl.createEl('p', { text: `**Типы судов:** ${this.data.ships.join(', ')}` });
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
            case 0: // Port Name
                if (!this.data.portName.trim()) {
                    new this.Notice('Пожалуйста, введите название порта.');
                    return false;
                }
                break;
            case 1: // Climate and Faction
                if (!this.data.climate || !this.data.dominantFaction) {
                    new this.Notice('Пожалуйста, выберите климат и доминирующую фракцию.');
                    return false;
                }
                break;
            case 2: // State and Province
                if (!this.data.state) {
                    new this.Notice('Пожалуйста, выберите государство.');
                    return false;
                }
                break;
            case 3: // Description
                if (!this.data.description.trim()) {
                    new this.Notice('Пожалуйста, введите описание порта.');
                    return false;
                }
                break;
            case 4: // Harbor Type and Docks
                if (!this.data.harborType.trim()) {
                    new this.Notice('Пожалуйста, укажите тип гавани.');
                    return false;
                }
                if (!this.data.docks.trim() || isNaN(Number(this.data.docks))) {
                    new this.Notice('Пожалуйста, укажите количество причалов (числом).');
                    return false;
                }
                break;
            case 5: // Main Goods and Ships (optional)
                // Nothing to validate, as they are optional
                break;
            case 6: // Features (optional)
                // Nothing to validate, as they are optional
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = PortWizardModal;
