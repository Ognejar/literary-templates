/**
 * @file       ProvinceWizardModal.js
 * @description Модальное окно мастера для создания новой провинции.
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

var ProvinceWizardModal = class extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, plugin, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.plugin = plugin;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            provinceName: '',
            description: '',
            climate: '',
            population: '',
            economy: '',
            culture: [],
            state: '',
            historicalPeriod: '',
            dominantFaction: '',
            minorFactions: [],
            cities: [],
            villages: [],
            deadZones: [],
            ports: [],
            castles: [],
            // Убраны поля history и populationHistory - теперь вводятся вручную в шаблоне
        };
        // Используем синхронную инициализацию, как в других модулях
        this.projectRoot = projectRoot;
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
        this.titleEl.setText('Создание новой провинции');
        console.log('[ProvinceWizardModal] projectRoot:', this.projectRoot);
        this.settingsFilePath = `${this.projectRoot}/Настройки_мира.md`;
        console.log('[ProvinceWizardModal] settingsFilePath:', this.settingsFilePath);
        await this.loadConfig();
        await this.render();
    }

    async loadConfig() {
        try {
            // Инициализируем config объект
            this.config = {
                locationTypes: [],
                climates: [],
                factions: [],
                historicalPeriods: [],
                states: []
            };

            const projectRoot = this.projectRoot; // Используем переданный projectRoot
            if (!projectRoot) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }
            this.settingsFilePath = `${projectRoot}/Настройки_мира.md`;
            const settingsFile = this.app.vault.getAbstractFileByPath(this.settingsFilePath);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    this.config.locationTypes = parsedConfig.locations?.locationTypes || [];
                    this.config.climates = parsedConfig.locations?.climates || [];
                    this.config.factions = parsedConfig.locations?.factions || [];
                    this.config.historicalPeriods = parsedConfig.historicalPeriods || [];
                    this.config.states = parsedConfig.states || [];
                }
            }
            // Инициализируем this.data.historicalPeriod, this.data.climate и this.data.dominantFaction здесь, после загрузки конфига
            this.data.historicalPeriod = this.data.historicalPeriod || this.config.historicalPeriods[0] || 'Средневековье';
            this.data.climate = this.data.climate || this.config.climates[0] || 'Умеренный';
            this.data.dominantFaction = this.data.dominantFaction || this.config.factions[0] || 'Королевская власть';

            console.log('DEBUG: ProvinceWizardModal - Config loaded. this.config.historicalPeriods:', this.config.historicalPeriods, 'climates:', this.config.climates, 'factions:', this.config.factions, 'states:', this.config.states);
            console.log('DEBUG: ProvinceWizardModal - Data initialized. historicalPeriod:', this.data.historicalPeriod, 'climate:', this.data.climate, 'dominantFaction:', this.data.dominantFaction);
        } catch (e) {
            new this.Notice('Ошибка загрузки конфигурации: ' + e.message);
            console.error('Ошибка загрузки конфигурации:', e);
            this.close();
        }
    }

    async createStateFile(stateName) {
        try {
            // Создаем папку Локации/Государства, если её нет
            const statesFolderPath = `${this.projectRoot}/Локации/Государства`;
            let statesFolder = this.app.vault.getAbstractFileByPath(statesFolderPath);
            if (!statesFolder) {
                await this.app.vault.createFolder(statesFolderPath);
                statesFolder = this.app.vault.getAbstractFileByPath(statesFolderPath);
            }

            // Создаем или обновляем индексный файл
            const indexPath = `${statesFolderPath}/Index.md`;
            let indexFile = this.app.vault.getAbstractFileByPath(indexPath);
            if (!indexFile) {
                await this.app.vault.create(indexPath, `# Индекс государств\n\n- [[${stateName}]]\n`);
            } else {
                const content = await this.app.vault.read(indexFile);
                if (!content.includes(`[[${stateName}]]`)) {
                    await this.app.vault.modify(indexFile, content + `- [[${stateName}]]\n`);
                }
            }

            // Создаем файл государства
            const stateFilePath = `${statesFolderPath}/${stateName}.md`;
            let stateFile = this.app.vault.getAbstractFileByPath(stateFilePath);
            
            // Проверяем, не создался ли файл без расширения
            if (!stateFile) {
                const stateFileWithoutExt = this.app.vault.getAbstractFileByPath(`${statesFolderPath}/${stateName}`);
                if (stateFileWithoutExt) {
                    // Если файл создался без расширения, переименовываем его
                    await this.app.vault.rename(stateFileWithoutExt, `${stateName}.md`);
                    stateFile = this.app.vault.getAbstractFileByPath(stateFilePath);
                }
            }
            
            if (!stateFile) {
                const stateContent = `---
created: "${new Date().toISOString().split('T')[0]}"
name: "${stateName}"
aliases: ["${stateName}"]
type: "Государство"
tags: [place, государство]
---

# ${stateName}

## Описание
[Здесь должно быть описание государства]

## Провинции
[Список провинций государства]

## Столица
[Название столицы]

## Правитель
[Информация о правителе]

## История
[История государства]

## Культура
[Культурные особенности]

## Экономика
[Экономическое описание]

## Вооруженные силы
[Информация о вооруженных силах]
`;
                await this.app.vault.create(stateFilePath, stateContent);
                console.log('DEBUG: ProvinceWizardModal - State file created:', stateFilePath);
                return true;
            }
        } catch (e) {
            console.error('Ошибка создания файла государства:', e);
            return false;
        }
        return false;
    }

    async saveConfig() {
        try {
            const settingsFile = this.app.vault.getAbstractFileByPath(this.settingsFilePath);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    // Обновляем только states, сохраняя остальные настройки
                    parsedConfig.states = this.config.states;
                    
                    // Заменяем JSON блок в файле
                    const newContent = content.replace(
                        /```json\n[\s\S]*?\n```/,
                        '```json\n' + JSON.stringify(parsedConfig, null, 2) + '\n```'
                    );
                    
                    await this.app.vault.modify(settingsFile, newContent);
                    console.log('DEBUG: ProvinceWizardModal - Config saved with new states:', this.config.states);
                }
            }
        } catch (e) {
            console.error('Ошибка сохранения конфигурации:', e);
        }
    }

    async render() {
        this.contentEl.empty();
        const { contentEl } = this;
        let navButtons = '';

        switch (this.step) {
            case 0:
                this.titleEl.setText('Создание новой провинции - Шаг 1/10: Государство');
                await this.renderStateSelect(contentEl);
                navButtons = '<button class="mod-cta" id="next">Далее</button>';
                break;
            case 1:
                this.titleEl.setText('Создание новой провинции - Шаг 2/10: Название');
                this.renderProvinceName(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 2:
                this.titleEl.setText('Создание новой провинции - Шаг 3/10: Климат, Исторический период, Доминирующая фракция');
                this.renderClimateHistoricalPeriodDominantFaction(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 3:
                this.titleEl.setText('Создание новой провинции - Шаг 4/10: Второстепенные фракции');
                this.renderMinorFactions(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 4:
                this.titleEl.setText('Создание новой провинции - Шаг 5/10: Население');
                this.renderPopulation(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 5:
                this.titleEl.setText('Создание новой провинции - Шаг 6/10: Экономика');
                this.renderEconomy(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 6:
                this.titleEl.setText('Создание новой провинции - Шаг 7/8: Описание');
                this.renderDescription(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta" id="next">Далее</button>';
                break;
            case 7:
                // Убираем шаги со связанными сущностями: на момент создания провинции эти данные неизвестны
                this.titleEl.setText('Создание новой провинции - Шаг 8/8: Предпросмотр');
                this.renderPreview(contentEl);
                navButtons = '<button id="prev">Назад</button><button class="mod-cta">Создать</button>';
                break;
            default:
                break;
        }

        this.renderNavFlex(contentEl);
    }

    async loadStatesFromFolder() {
        try {
            return this.loadFilesFromFolder(`${this.projectRoot}/Локации/Государства`, 'Государства');
        } catch (e) {
            console.error('Ошибка загрузки государств из папки:', e);
            return [];
        }
    }

    async renderStateSelect(contentEl) {
        // Загружаем государства из папки и конфига
        const folderStates = await this.loadStatesFromFolder();
        const configStates = this.config.states || [];
        const allStates = [...new Set([...folderStates, ...configStates])];
        
        if (allStates.length === 0) {
            new this.Setting(contentEl)
                .setName('Государство')
                .setDesc('⚠️ Не найдено ни одного государства. Введите название нового государства и нажмите Enter или перейдите к следующему полю - будет создан файл государства в папке "Государства".')
                .addText(text => {
                    text.setPlaceholder('Введите название государства')
                        .setValue(this.data.state)
                        .onChange(value => {
                            this.data.state = value;
                        });
                    
                    // Добавляем обработчик потери фокуса для создания файла
                    text.inputEl.addEventListener('blur', async () => {
                        const stateName = this.data.state.trim();
                        if (stateName && !this.config.states.includes(stateName)) {
                            this.config.states.push(stateName);
                            const created = await this.createStateFile(stateName);
                            if (created) {
                                new this.Notice(`✅ Государство "${stateName}" создано и добавлено в список`);
                            } else {
                                new this.Notice(`⚠️ Государство "${stateName}" добавлено в список, но файл не создан`);
                            }
                        }
                    });

                    // Добавляем обработчик нажатия Enter для создания файла
                    text.inputEl.addEventListener('keydown', async (event) => {
                        if (event.key === 'Enter') {
                            const stateName = this.data.state.trim();
                            if (stateName && !this.config.states.includes(stateName)) {
                                this.config.states.push(stateName);
                                const created = await this.createStateFile(stateName);
                                if (created) {
                                    new this.Notice(`✅ Государство "${stateName}" создано и добавлено в список`);
                                } else {
                                    new this.Notice(`⚠️ Государство "${stateName}" добавлено в список, но файл не создан`);
                                }
                            }
                            // Переходим к следующему шагу
                            if (this.validateCurrentStep()) {
                                this.step++;
                                await this.render();
                            }
                        }
                    });
                    text.inputEl.style.width = '100%';
                    text.inputEl.style.fontSize = '16px';
                    text.inputEl.style.padding = '8px';
                });
        } else {
                         new this.Setting(contentEl)
                 .setName('Государство')
                 .setDesc(allStates.length === 1 ? 
                     `✅ Автоматически выбрано единственное государство: ${allStates[0]}` : 
                     'Выберите государство, к которому принадлежит провинция')
                                 .addDropdown(dropdown => {
                     allStates.forEach(state => dropdown.addOption(state, state));
                     // Автоматически выбираем первый вариант, если он один
                     const selectedState = this.data.state || allStates[0];
                     dropdown.setValue(selectedState);
                     this.data.state = selectedState; // Устанавливаем значение в data
                     dropdown.onChange(value => this.data.state = value);
                     dropdown.selectEl.style.minWidth = '280px';
                     dropdown.selectEl.style.fontSize = '14px';
                     dropdown.selectEl.style.padding = '6px';
                 });
        }
    }

    renderProvinceName(contentEl) {
        new this.Setting(contentEl)
            .setName('Название провинции')
            .addText(text => {
                text.setPlaceholder('Название провинции')
                    .setValue(this.data.provinceName)
                    .onChange(value => {
                        this.data.provinceName = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderClimateHistoricalPeriodDominantFaction(contentEl) {
        const fallbackClimates = ['Тропический', 'Умеренный', 'Холодный', 'Пустынный', 'Горный', 'Прибрежный', 'Субтропический'];
        const fallbackPeriods = ['Древность', 'Средневековье', 'Ренессанс', 'Новое время', 'Современность', 'Футуристическое'];
        const climates = this.config.climates.length > 0 ? this.config.climates : fallbackClimates;
        const periods = this.config.historicalPeriods.length > 0 ? this.config.historicalPeriods : fallbackPeriods;

        new this.Setting(contentEl)
            .setName('Климат')
            .addDropdown(dropdown => {
                climates.forEach(climate => dropdown.addOption(climate, climate));
                dropdown.setValue(this.data.climate || climates[0]);
                dropdown.onChange(value => this.data.climate = value);
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
            });

        new this.Setting(contentEl)
            .setName('Исторический период')
            .setDesc('Выберите исторический период, в котором происходит действие. Это поможет определить архитектуру, технологии и социальную структуру.')
            .addDropdown(dropdown => {
                periods.forEach(period => dropdown.addOption(period, period));
                dropdown.setValue(this.data.historicalPeriod || periods[0]);
                dropdown.onChange(value => this.data.historicalPeriod = value);
                dropdown.selectEl.style.minWidth = '280px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
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

    renderMinorFactions(contentEl) {
        new this.Setting(contentEl)
            .setName('Второстепенные фракции (каждая с новой строки, опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Список второстепенных фракций')
                    .setValue(this.data.minorFactions.join('\n'))
                    .onChange(value => {
                        this.data.minorFactions = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderPopulation(contentEl) {
        new this.Setting(contentEl)
            .setName('Население (опционально)')
            .addText(text => {
                text.setPlaceholder('Численность населения')
                    .setValue(this.data.population)
                    .onChange(value => {
                        this.data.population = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
    }

    renderEconomy(contentEl) {
        new this.Setting(contentEl)
            .setName('Экономика (опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Описание экономики провинции')
                    .setValue(this.data.economy)
                    .onChange(value => {
                        this.data.economy = value;
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
                text.setPlaceholder('Подробное описание провинции')
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

    renderRelatedEntities(contentEl, fieldName, placeholderText) {
        new this.Setting(contentEl)
            .setName(`Связанные ${placeholderText} (каждый с новой строки, опционально)`)
            .addTextArea(text => {
                text.setPlaceholder(`Список ${placeholderText} в провинции`)
                    .setValue(this.data[fieldName].join('\n'))
                    .onChange(value => {
                        this.data[fieldName] = value.split('\n').map(e => e.trim()).filter(e => e.length > 0);
                    });
                // Увеличиваем размер текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderPortsAndCastles(contentEl) {
        new this.Setting(contentEl)
            .setName('Порты (каждый с новой строки, опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Список портов в провинции')
                    .setValue(this.data.ports.join('\n'))
                    .onChange(value => {
                        this.data.ports = value.split('\n').map(e => e.trim()).filter(e => e.length > 0);
                    });
            });

        new this.Setting(contentEl)
            .setName('Замки/крепости (каждый с новой строки, опционально)')
            .addTextArea(text => {
                text.setPlaceholder('Список замков/крепостей в провинции')
                    .setValue(this.data.castles.join('\n'))
                    .onChange(value => {
                        this.data.castles = value.split('\n').map(e => e.trim()).filter(e => e.length > 0);
                    });
            });
    }

    renderPreview(contentEl) {
        const previewEl = contentEl.createEl('div', { cls: 'preview-section' });
        previewEl.createEl('h3', { text: 'Предпросмотр:' });
        previewEl.createEl('p', { text: `**Название:** ${this.data.provinceName}` });
        previewEl.createEl('p', { text: `**Государство:** ${this.data.state}` });
        previewEl.createEl('p', { text: `**Климат:** ${this.data.climate}` });
        previewEl.createEl('p', { text: `**Исторический период:** ${this.data.historicalPeriod}` });
        previewEl.createEl('p', { text: `**Доминирующая фракция:** ${this.data.dominantFaction}` });
        if (this.data.minorFactions.length) {
            previewEl.createEl('p', { text: `**Второстепенные фракции:** ${this.data.minorFactions.join(', ')}` });
        }
        if (this.data.population) {
            previewEl.createEl('p', { text: `**Население:** ${this.data.population}` });
        }
        if (this.data.economy) {
            previewEl.createEl('p', { text: `**Экономика:** ${this.data.economy.substring(0, 100)}...` });
        }
        if (this.data.description) {
            previewEl.createEl('p', { text: `**Описание:** ${this.data.description.substring(0, 100)}...` });
        }
        // История и история населения теперь вводятся вручную в шаблоне
        if (this.data.cities.length) {
            previewEl.createEl('p', { text: `**Города:** ${this.data.cities.join(', ')}` });
        }
        if (this.data.villages.length) {
            previewEl.createEl('p', { text: `**Деревни:** ${this.data.villages.join(', ')}` });
        }
        if (this.data.deadZones.length) {
            previewEl.createEl('p', { text: `**Мертвые зоны:** ${this.data.deadZones.join(', ')}` });
        }
        if (this.data.ports.length) {
            previewEl.createEl('p', { text: `**Порты:** ${this.data.ports.join(', ')}` });
        }
        if (this.data.castles.length) {
            previewEl.createEl('p', { text: `**Замки/Крепости:** ${this.data.castles.join(', ')}` });
        }
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
            const finishBtn = right.createEl('button', { text: '✓ Создать провинцию' });
            finishBtn.className = 'mod-cta';
            finishBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.onFinish(this.data);
                    this.close();
                }
            };
        }
        prevBtn.classList.add('lt-btn', 'lt-btn-outline');
        nextBtn.classList.add('lt-btn', 'lt-btn-primary');
        finishBtn.classList.add('lt-btn', 'lt-btn-success');
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // State
                if (!this.data.state || this.data.state.trim() === '') {
                    new this.Notice('Пожалуйста, выберите или введите название государства.');
                    return false;
                }
                // Если есть только одно государство, автоматически выбираем его
                if (this.config.states && this.config.states.length === 1 && !this.data.state) {
                    this.data.state = this.config.states[0];
                }
                break;
            case 1: // Province Name
                if (!this.data.provinceName.trim()) {
                    new this.Notice('Пожалуйста, введите название провинции.');
                    return false;
                }
                break;
            case 2: // Climate, Historical Period, Dominant Faction
                if (!this.data.climate || this.data.climate.trim() === '') {
                    new this.Notice('Пожалуйста, выберите климат.');
                    return false;
                }
                if (!this.data.historicalPeriod || this.data.historicalPeriod.trim() === '') {
                    new this.Notice('Пожалуйста, выберите исторический период.');
                    return false;
                }
                if (!this.data.dominantFaction || this.data.dominantFaction.trim() === '') {
                    new this.Notice('Пожалуйста, выберите доминирующую фракцию.');
                    return false;
                }
                break;
            case 3: // Minor Factions (optional)
                // Nothing to validate, as they are optional
                break;
            case 4: // Population (optional)
                // Nothing to validate, as it's optional
                break;
            case 5: // Economy (optional)
                // Nothing to validate, as it's optional
                break;
            case 6: // History (optional)
                // Nothing to validate, as it's optional
                break;
            case 7: // Population History (optional)
                // Nothing to validate, as it's optional
                break;
            case 8: // Description
                if (!this.data.description.trim()) {
                    new this.Notice('Пожалуйста, введите описание провинции.');
                    return false;
                }
                break;
            case 9: // Cities (optional)
            case 10: // Villages (optional)
            case 11: // Dead Zones (optional)
            case 12: // Ports and Castles (optional)
                // Nothing to validate, as they are optional
                break;
        }
        return true;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }

    async finish() {
        const clean = s => String(s || '').trim();
        const name = clean(this.data.provinceName);
        if (!name) { new this.Notice('Не указано название провинции'); return; }
        const cleanName = name.replace(/[^А-Яа-яA-Za-zЁё0-9_\-\.\s]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        const projectName = (this.projectRoot || '').split('/').pop() || '';

        // Преобразуем историю в ожидаемый шаблоном формат
        const history = []; // Пустой массив - история теперь вводится вручную в шаблоне

        // populationHistory в data хранится с ключом population -> нужно value
        const population_history = []; // Пустой массив - история населения теперь вводится вручную в шаблоне

        const data = {
            date,
            name,
            projectName,
            state: clean(this.data.state),
            climate: clean(this.data.climate),
            dominantFaction: clean(this.data.dominantFaction),
            population: clean(this.data.population),
            history,
            population_history,
            epochs: clean(this.data.historicalPeriod || ''),
            imageBlock: '',
        };

        const folder = `${this.projectRoot}/Локации/Провинции`;
        try {
            await window.ensureEntityInfrastructure(folder, cleanName, this.app);
            // Получаем правильный объект плагина из глобальной области
            const plugin = window.app?.plugins?.plugins?.['literary-templates'] || this.plugin;
            if (!plugin.logDebug) plugin.logDebug = () => {};
            if (!plugin.readTemplateFile) plugin.readTemplateFile = window.app?.plugins?.plugins?.['literary-templates']?.readTemplateFile;
            const content = await window.generateFromTemplate('Новая_провинция', data, plugin);
            const path = `${folder}/${cleanName}.md`;
            await window.safeCreateFile(path, content, this.app);
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
            new this.Notice(`Провинция «${name}» создана.`);
            this.close();
            // Передаем сформированные данные и содержимое в callback
            if (this.onFinish) this.onFinish(this.data, content);
        } catch (e) {
            console.error('Ошибка генерации провинции:', e);
            throw e;
        }
    }
};

module.exports = { ProvinceWizardModal };
