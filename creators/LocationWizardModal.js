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
            type: '',
            description: '',
            region: '',
            climate: '',
            state: '',
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
        };
        this.config = {
            provinces: [],
            states: [],
            climates: [],
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

            // Загружаем климаты из настроек
            const settingsFile = this.app.vault.getAbstractFileByPath(`${projectRoot}/Настройки_мира.md`);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    this.config.climates = parsedConfig.locations?.climates || [];
                }
            }

            // Загружаем государства и провинции из папки Локации
            const locationsFolder = `${projectRoot}/Локации`;
            const folder = this.app.vault.getAbstractFileByPath(locationsFolder);
            if (folder && folder.children) {
                // Загружаем государства
                const statesFolder = this.app.vault.getAbstractFileByPath(`${locationsFolder}/Государства`);
                if (statesFolder && statesFolder.children) {
                    this.config.states = [];
                    for (const file of statesFolder.children) {
                        if (file instanceof TFile && file.extension === 'md' && !file.basename.startsWith('Index') && !file.basename.startsWith('.')) {
                            try {
                                const content = await this.app.vault.read(file);
                                const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?/m);
                                const name = nameMatch ? nameMatch[1].trim() : file.basename;
                                this.config.states.push(name);
                            } catch (e) {
                                console.error(`Ошибка чтения файла государства ${file.basename}:`, e);
                                this.config.states.push(file.basename);
                            }
                        }
                    }
                }
                
                // Загружаем провинции с их государствами
                const provincesFolder = this.app.vault.getAbstractFileByPath(`${locationsFolder}/Провинции`);
                if (provincesFolder && provincesFolder.children) {
                    this.config.provinces = [];
                    for (const file of provincesFolder.children) {
                        if (file instanceof TFile && file.extension === 'md' && !file.basename.startsWith('Index') && !file.basename.startsWith('.')) {
                            try {
                                const content = await this.app.vault.read(file);
                                const stateMatch = content.match(/^state:\s*["']?([^"'\n]+)["']?/m);
                                const state = stateMatch ? stateMatch[1].trim() : '';
                                this.config.provinces.push({
                                    name: file.basename,
                                    state: state
                                });
                            } catch (e) {
                                console.error(`Ошибка чтения файла провинции ${file.basename}:`, e);
                            }
                        }
                    }
                }
            }
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
                this.titleEl.setText('Создание новой локации - Шаг 3/6: Тип и Климат');
                this.renderTypeAndClimate(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание новой локации - Шаг 4/6: Государство');
                this.renderState(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание новой локации - Шаг 5/6: Провинция');
                this.renderProvince(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание новой локации - Шаг 6/6: Описание и Предпросмотр');
                this.renderDescription(contentEl);
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

    renderTypeAndClimate(contentEl) {
        new this.Setting(contentEl)
            .setName('Тип локации')
            .addText(text => {
                text.setPlaceholder('Например: Пещера, Руины, Святилище, Лес, Гора')
                    .setValue(this.data.type)
                    .onChange(value => {
                        this.data.type = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });

        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите климат (опционально)');
                const fallbackClimates = ['Тропический', 'Умеренный', 'Холодный', 'Пустынный', 'Горный', 'Прибрежный', 'Субтропический'];
                const climates = this.config.climates.length > 0 ? this.config.climates : fallbackClimates;
                climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate);
                dropdown.onChange(value => this.data.climate = value);
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderProvince(contentEl) {
        new this.Setting(contentEl)
            .setName('Провинция (опционально)')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите провинцию (опционально)');
                
                // Фильтруем провинции по выбранному государству
                const filteredProvinces = this.data.state 
                    ? this.config.provinces.filter(province => 
                        province.state === this.data.state
                      )
                    : this.config.provinces;
                
                filteredProvinces.forEach(province => dropdown.addOption(province.name, province.name));
                dropdown.setValue(this.data.province);
                dropdown.onChange(value => this.data.province = value);
                // Увеличиваем размер выпадающего списка
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });
    }

    renderState(contentEl) {
        new this.Setting(contentEl)
            .setName('Государство (опционально)')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Выберите государство (опционально)');
                this.config.states.forEach(state => dropdown.addOption(state, state));
                dropdown.setValue(this.data.state);
                dropdown.onChange(value => this.data.state = value);
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


    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.locationName}` });
        previewEl.createEl('p', { text: `**Тип:** ${this.data.type}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        if (this.data.province) {
            previewEl.createEl('p', { text: `**Провинция:** ${this.data.province}` });
        }
        if (this.data.state) {
            previewEl.createEl('p', { text: `**Государство:** ${this.data.state}` });
        }
        previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
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
            case 2: // Тип и Климат — все опционально
                break;
            case 3: // Государство (опционально)
                break;
            case 4: // Провинция (опционально)
                break;
            case 5: // Описание — опционально
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
