/**
 * @file       StateWizardModal.js
 * @description Модальное окно мастера для создания нового государства.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals
 * @created    2024-12-19
 * @updated    2024-12-19
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

const { EntityWizardBase } = require('./EntityWizardBase.js');

class StateWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectRoot, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.projectRoot = projectRoot;
        this.onFinish = onFinish;
        this.step = 0;
        this.data = {
            stateName: '',
            capital: '',
            governmentType: '',
            leader: '',
            population: '',
            language1: '',
            language2: '',
            currency: '',
            tag1: '',
            tag2: '',
            tag3: '',
            location: '',
            climate: '',
            resources: '',
            history: '',
            traditions: '',
            religion: '',
            festivals: '',
            // Добавляем поддержку хронологии и истории населения
            history_events: [], // массив событий: [{year: 800, event: "Основано государство"}, ...]
            population_history: [], // массив значений населения: [{year: 1000, value: 500000}, ...]
            // Обновляем поля для использования массивов
            mainIndustries: [],
            tradePartners: [],
            economicChallenges: [],
            domesticPolicy: '',
            foreignPolicy: '',
            military: '',
            education: '',
            healthcare: '',
            socialIssues: '',
            developmentNotes: ''
        };
        this.config = {
            governmentTypes: [],
            climates: [],
            religions: [],
            currencies: []
        };
        this.steps = [
            'Название и столица',
            'Правительство и лидер',
            'Население и языки',
            'География',
            'История и культура',
            'Хронология',
            'Экономика',
            'Политика',
            'Общество',
            'Предпросмотр'
        ];
    }

    async onOpen() {
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
        this.titleEl.setText('Создание нового государства');
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
            
            const settingsFile = this.app.vault.getAbstractFileByPath(`${this.projectRoot}/Настройки_мира.md`);
            if (settingsFile instanceof TFile) {
                const content = await this.app.vault.read(settingsFile);
                const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                if (configMatch && configMatch[1]) {
                    const parsedConfig = JSON.parse(configMatch[1]);
                    this.config.governmentTypes = parsedConfig.politics?.governmentTypes || ['Монархия', 'Конституционная монархия', 'Республика', 'Империя', 'Федерация', 'Конфедерация', 'Город-государство'];
                    this.config.climates = parsedConfig.locations?.climates || ['Умеренный', 'Тропический', 'Арктический', 'Пустынный', 'Горный'];
                    this.config.religions = parsedConfig.culture?.religions || ['Монотеизм', 'Политеизм', 'Атеизм', 'Анимизм', 'Пантеизм'];
                    this.config.currencies = parsedConfig.economy?.currencies || ['Золото', 'Серебро', 'Медные монеты', 'Бумажные деньги', 'Криптовалюта'];
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки конфигурации:', error);
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
            flex-wrap: wrap;
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
                margin: 2px;
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
            case 0: this.renderNameCapital(contentEl); break;
            case 1: this.renderGovernmentLeader(contentEl); break;
            case 2: this.renderPopulationLanguages(contentEl); break;
            case 3: this.renderGeography(contentEl); break;
            case 4: this.renderHistoryCulture(contentEl); break;
            case 5: this.renderChronology(contentEl); break;
            case 6: this.renderEconomy(contentEl); break;
            case 7: this.renderPolitics(contentEl); break;
            case 8: this.renderSociety(contentEl); break;
            case 9: this.renderPreview(contentEl); break;
        }

        // Унифицированная навигация
        this.renderNavigation(contentEl);
    }

    renderNameCapital(contentEl) {
        // Название государства
        new this.Setting(contentEl)
            .setName('Название государства')
            .setDesc('Введите название нового государства')
            .addText(text => {
                text.setValue(this.data.stateName)
                    .onChange(value => this.data.stateName = value)
                    .setPlaceholder('Например: Королевство Эльдария');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Столица
        new this.Setting(contentEl)
            .setName('Столица')
            .setDesc('Название столицы государства')
            .addText(text => {
                text.setValue(this.data.capital)
                    .onChange(value => this.data.capital = value)
                    .setPlaceholder('Например: Лунный город');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Теги
        new this.Setting(contentEl)
            .setName('Теги')
            .setDesc('Ключевые слова для категоризации (через запятую)')
            .addText(text => {
                text.setValue([this.data.tag1, this.data.tag2, this.data.tag3].filter(Boolean).join(', '))
                    .onChange(value => {
                        const tags = value.split(',').map(t => t.trim()).filter(Boolean);
                        this.data.tag1 = tags[0] || '';
                        this.data.tag2 = tags[1] || '';
                        this.data.tag3 = tags[2] || '';
                    })
                    .setPlaceholder('Например: магия, торговля, воинственность');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });
    }

    renderGovernmentLeader(contentEl) {
        // Тип правительства
        new this.Setting(contentEl)
            .setName('Тип правительства')
            .setDesc('Выберите форму правления')
            .addDropdown(dropdown => {
                dropdown.addOptions({
                    'Монархия': 'Монархия',
                    'Конституционная монархия': 'Конституционная монархия',
                    'Республика': 'Республика',
                    'Империя': 'Империя',
                    'Федерация': 'Федерация',
                    'Конфедерация': 'Конфедерация',
                    'Город-государство': 'Город-государство',
                    'Олигархия': 'Олигархия',
                    'Теократия': 'Теократия',
                    'Демократия': 'Демократия'
                });
                dropdown.setValue(this.data.governmentType);
                dropdown.onChange(value => this.data.governmentType = value);
                // Унифицированные стили для выпадающего списка
                dropdown.selectEl.style.minWidth = '320px';
                dropdown.selectEl.style.fontSize = '14px';
                dropdown.selectEl.style.padding = '6px';
                dropdown.selectEl.style.borderRadius = '4px';
                dropdown.selectEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Лидер
        new this.Setting(contentEl)
            .setName('Лидер государства')
            .setDesc('Имя и титул текущего лидера')
            .addText(text => {
                text.setValue(this.data.leader)
                    .onChange(value => this.data.leader = value)
                    .setPlaceholder('Например: Король Артур Пендрагон');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });
    }

    renderPopulationLanguages(contentEl) {
        // Население
        new this.Setting(contentEl)
            .setName('Население')
            .setDesc('Примерная численность населения')
            .addText(text => {
                text.setValue(this.data.population)
                    .onChange(value => this.data.population = value)
                    .setPlaceholder('Например: 2.5 миллиона');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Языки
        new this.Setting(contentEl)
            .setName('Первый официальный язык')
            .setDesc('Основной язык государства')
            .addText(text => {
                text.setValue(this.data.language1)
                    .onChange(value => this.data.language1 = value)
                    .setPlaceholder('Например: Эльдарианский');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });

        new this.Setting(contentEl)
            .setName('Второй официальный язык')
            .setDesc('Дополнительный язык (необязательно)')
            .addText(text => {
                text.setValue(this.data.language2)
                    .onChange(value => this.data.language2 = value)
                    .setPlaceholder('Например: Общий торговый язык');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });

        // Валюта
        new this.Setting(contentEl)
            .setName('Валюта')
            .setDesc('Название валюты государства')
            .addText(text => {
                text.setValue(this.data.currency)
                    .onChange(value => this.data.currency = value)
                    .setPlaceholder('Например: Эльдарианский талер');
                // Унифицированные стили для текстового поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
            });
    }

    renderGeography(contentEl) {
        // Расположение
        new this.Setting(contentEl)
            .setName('Географическое расположение')
            .setDesc('Описание местоположения государства')
            .addTextArea(text => {
                text.setValue(this.data.location)
                    .onChange(value => this.data.location = value)
                    .setPlaceholder('Опишите, где находится государство, какие границы имеет...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Климат
        new this.Setting(contentEl)
            .setName('Климат')
            .setDesc('Преобладающий климат')
            .addDropdown(dropdown => {
                dropdown.addOptions({
                    'Умеренный': 'Умеренный',
                    'Тропический': 'Тропический',
                    'Арктический': 'Арктический',
                    'Пустынный': 'Пустынный',
                    'Горный': 'Горный',
                    'Смешанный': 'Смешанный'
                });
                dropdown.setValue(this.data.climate);
                dropdown.onChange(value => this.data.climate = value);
            });

        // Ресурсы
        new this.Setting(contentEl)
            .setName('Природные ресурсы')
            .setDesc('Основные природные богатства')
            .addTextArea(text => {
                text.setValue(this.data.resources)
                    .onChange(value => this.data.resources = value)
                    .setPlaceholder('Опишите основные ресурсы: полезные ископаемые, леса, реки...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });
    }

    renderHistoryCulture(contentEl) {
        // История
        new this.Setting(contentEl)
            .setName('История государства')
            .setDesc('Краткая историческая справка')
            .addTextArea(text => {
                text.setValue(this.data.history)
                    .onChange(value => this.data.history = value)
                    .setPlaceholder('Опишите ключевые исторические события, происхождение...');
                text.inputEl.rows = 4;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Традиции
        new this.Setting(contentEl)
            .setName('Культурные традиции')
            .setDesc('Основные традиции и обычаи')
            .addTextArea(text => {
                text.setValue(this.data.traditions)
                    .onChange(value => this.data.traditions = value)
                    .setPlaceholder('Опишите важные традиции, ритуалы, обычаи...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Религия
        new this.Setting(contentEl)
            .setName('Религия')
            .setDesc('Господствующая религия или верования')
            .addTextArea(text => {
                text.setValue(this.data.religion)
                    .onChange(value => this.data.religion = value)
                    .setPlaceholder('Опишите религиозные верования, храмы, духовенство...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Праздники
        new this.Setting(contentEl)
            .setName('Праздники и фестивали')
            .setDesc('Важные культурные события')
            .addTextArea(text => {
                text.setValue(this.data.festivals)
                    .onChange(value => this.data.festivals = value)
                    .setPlaceholder('Опишите главные праздники, их значение, как отмечаются...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });
    }

    renderChronology(contentEl) {
        // Секция для событий истории
        new this.Setting(contentEl)
            .setName('Исторические события')
            .setDesc('Добавьте важные события в истории государства (год: событие)')
            .addTextArea(text => {
                const historyText = this.data.history_events && this.data.history_events.length > 0 
                    ? this.data.history_events.map(h => `${h.year}: ${h.event}`).join('\n')
                    : '';
                text.setPlaceholder('800: Основано государство\n1200: Война с соседями\n1500: Экономический расцвет')
                    .setValue(historyText)
                    .onChange(value => {
                        // Парсим текст в массив объектов history_events
                        this.data.history_events = value.split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0)
                            .map(line => {
                                const colonIndex = line.indexOf(':');
                                if (colonIndex > 0) {
                                    const year = line.substring(0, colonIndex).trim();
                                    const event = line.substring(colonIndex + 1).trim();
                                    if (year && event) {
                                        return { year: parseInt(year) || year, event: event };
                                    }
                                }
                                return null;
                            })
                            .filter(item => item !== null);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });

        // Секция для истории населения
        new this.Setting(contentEl)
            .setName('История населения')
            .setDesc('Добавьте данные о населении по годам (год: количество)')
            .addTextArea(text => {
                const populationText = this.data.population_history && this.data.population_history.length > 0 
                    ? this.data.population_history.map(p => `${p.year}: ${p.value}`).join('\n')
                    : '';
                text.setPlaceholder('1000: 500000\n1500: 1200000\n1800: 2500000')
                    .setValue(populationText)
                    .onChange(value => {
                        // Парсим текст в массив объектов population_history
                        this.data.population_history = value.split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0)
                            .map(line => {
                                const colonIndex = line.indexOf(':');
                                if (colonIndex > 0) {
                                    const year = line.substring(0, colonIndex).trim();
                                    const value = line.substring(colonIndex + 1).trim();
                                    if (year && value) {
                                        return { year: parseInt(year) || year, value: parseInt(value) || value };
                                    }
                                }
                                return null;
                            })
                            .filter(item => item !== null);
                    });
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderEconomy(contentEl) {
        // Основные отрасли
        new this.Setting(contentEl)
            .setName('Основные отрасли экономики')
            .setDesc('Ключевые секторы экономики (каждая с новой строки)')
            .addTextArea(text => {
                const industriesText = this.data.mainIndustries && this.data.mainIndustries.length > 0 
                    ? this.data.mainIndustries.join('\n')
                    : '';
                text.setValue(industriesText)
                    .onChange(value => {
                        this.data.mainIndustries = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    })
                    .setPlaceholder('Сельское хозяйство\nРемесла\nТорговля\nГорнодобывающая промышленность');
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });

        // Торговые партнеры
        new this.Setting(contentEl)
            .setName('Торговые партнеры')
            .setDesc('Основные торговые связи (каждый с новой строки)')
            .addTextArea(text => {
                const partnersText = this.data.tradePartners && this.data.tradePartners.length > 0 
                    ? this.data.tradePartners.join('\n')
                    : '';
                text.setValue(partnersText)
                    .onChange(value => {
                        this.data.tradePartners = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    })
                    .setPlaceholder('Королевство Эльдария\nТорговая лига Ганзы\nВольные города');
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });

        // Экономические вызовы
        new this.Setting(contentEl)
            .setName('Экономические вызовы')
            .setDesc('Проблемы и трудности в экономике (каждая с новой строки)')
            .addTextArea(text => {
                const challengesText = this.data.economicChallenges && this.data.economicChallenges.length > 0 
                    ? this.data.economicChallenges.join('\n')
                    : '';
                text.setValue(challengesText)
                    .onChange(value => {
                        this.data.economicChallenges = value.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                    })
                    .setPlaceholder('Зависимость от импорта зерна\nНехватка квалифицированных ремесленников\nКонкуренция с соседними государствами');
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
            });
    }

    renderPolitics(contentEl) {
        // Внутренняя политика
        new this.Setting(contentEl)
            .setName('Внутренняя политика')
            .setDesc('Основные направления внутренней политики')
            .addTextArea(text => {
                text.setValue(this.data.domesticPolicy)
                    .onChange(value => this.data.domesticPolicy = value)
                    .setPlaceholder('Опишите внутренние политические приоритеты, реформы...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Внешняя политика
        new this.Setting(contentEl)
            .setName('Внешняя политика')
            .setDesc('Отношения с другими государствами')
            .addTextArea(text => {
                text.setValue(this.data.foreignPolicy)
                    .onChange(value => this.data.foreignPolicy = value)
                    .setPlaceholder('Опишите внешнеполитические цели, союзы, конфликты...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Военные силы
        new this.Setting(contentEl)
            .setName('Военные силы')
            .setDesc('Военная мощь и стратегия')
            .addTextArea(text => {
                text.setValue(this.data.military)
                    .onChange(value => this.data.military = value)
                    .setPlaceholder('Опишите армию, флот, военную доктрину...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });
    }

    renderSociety(contentEl) {
        // Образование
        new this.Setting(contentEl)
            .setName('Система образования')
            .setDesc('Как организовано образование')
            .addTextArea(text => {
                text.setValue(this.data.education)
                    .onChange(value => this.data.education = value)
                    .setPlaceholder('Опишите школы, университеты, доступность образования...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Здравоохранение
        new this.Setting(contentEl)
            .setName('Здравоохранение')
            .setDesc('Медицинская система государства')
            .addTextArea(text => {
                text.setValue(this.data.healthcare)
                    .onChange(value => this.data.healthcare = value)
                    .setPlaceholder('Опишите больницы, врачей, качество медицины...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Социальные проблемы
        new this.Setting(contentEl)
            .setName('Социальные проблемы')
            .setDesc('Основные социальные вызовы')
            .addTextArea(text => {
                text.setValue(this.data.socialIssues)
                    .onChange(value => this.data.socialIssues = value)
                    .setPlaceholder('Опишите бедность, неравенство, социальные конфликты...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });

        // Заметки для развития
        new this.Setting(contentEl)
            .setName('Заметки для развития')
            .setDesc('Идеи для дальнейшего развития государства')
            .addTextArea(text => {
                text.setValue(this.data.developmentNotes)
                    .onChange(value => this.data.developmentNotes = value)
                    .setPlaceholder('Запишите идеи для развития, потенциальные сюжетные линии...');
                text.inputEl.rows = 3;
                // Унифицированные стили для текстовой области
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '120px';
                text.inputEl.style.fontSize = '14px';
                text.inputEl.style.lineHeight = '1.4';
                text.inputEl.style.padding = '8px';
                text.inputEl.style.borderRadius = '4px';
                text.inputEl.style.border = '1px solid var(--background-modifier-border)';
                text.inputEl.style.resize = 'vertical';
            });
    }

    renderPreview(contentEl) {
        const preview = contentEl.createDiv('preview-section');
        preview.style.cssText = `
            background: var(--background-secondary);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        `;

        const title = preview.createEl('h3', { text: 'Предпросмотр' });
        title.style.cssText = `
            color: var(--text-accent);
            margin-bottom: 15px;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;

        // Основная информация
        const basicInfo = preview.createDiv('basic-info');
        basicInfo.innerHTML = `
            <p><strong>Название:</strong> ${this.data.stateName || 'Не указано'}</p>
            <p><strong>Столица:</strong> ${this.data.capital || 'Не указано'}</p>
            <p><strong>Тип правительства:</strong> ${this.data.governmentType || 'Не указано'}</p>
            <p><strong>Лидер:</strong> ${this.data.leader || 'Не указано'}</p>
            <p><strong>Население:</strong> ${this.data.population || 'Не указано'}</p>
        `;

        // География
        if (this.data.location || this.data.climate || this.data.resources) {
            const geography = preview.createDiv('geography');
            geography.innerHTML = `
                <h4>География</h4>
                <p><strong>Расположение:</strong> ${this.data.location || 'Не указано'}</p>
                <p><strong>Климат:</strong> ${this.data.climate || 'Не указано'}</p>
                <p><strong>Ресурсы:</strong> ${this.data.resources || 'Не указано'}</p>
            `;
        }

        // Культура
        if (this.data.traditions || this.data.religion) {
            const culture = preview.createDiv('culture');
            culture.innerHTML = `
                <h4>Культура</h4>
                <p><strong>Традиции:</strong> ${this.data.traditions || 'Не указано'}</p>
                <p><strong>Религия:</strong> ${this.data.religion || 'Не указано'}</p>
            `;
        }
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
            const finishBtn = rightButtons.createEl('button', { text: '✓ Создать государство' });
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
            finishBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.finish();
                }
            };
        }
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0:
                if (!this.data.stateName.trim()) {
                    new this.Notice('Введите название государства');
                    return false;
                }
                if (!this.data.capital.trim()) {
                    new this.Notice('Введите название столицы');
                    return false;
                }
                break;
            case 1:
                if (!this.data.governmentType) {
                    new this.Notice('Выберите тип правительства');
                    return false;
                }
                if (!this.data.leader.trim()) {
                    new this.Notice('Введите имя лидера');
                    return false;
                }
                break;
            case 2:
                if (!this.data.population.trim()) {
                    new this.Notice('Введите информацию о населении');
                    return false;
                }
                if (!this.data.language1.trim()) {
                    new this.Notice('Введите хотя бы один официальный язык');
                    return false;
                }
                break;
            case 5: // Хронология
                // Хронология не обязательна, но если добавлена - должна быть корректной
                if (this.data.history_events && this.data.history_events.length > 0) {
                    const invalidHistory = this.data.history_events.filter(h => !h.year || !h.event);
                    if (invalidHistory.length > 0) {
                        new this.Notice('Пожалуйста, проверьте формат исторических событий (год: событие).');
                        return false;
                    }
                }
                if (this.data.population_history && this.data.population_history.length > 0) {
                    const invalidPopulation = this.data.population_history.filter(p => !p.year || !p.value);
                    if (invalidPopulation.length > 0) {
                        new this.Notice('Пожалуйста, проверьте формат истории населения (год: количество).');
                        return false;
                    }
                }
                break;
        }
        return true;
    }

    async finish() {
        try {
            // Добавляем текущую дату
            this.data.date = window.moment().format('YYYY-MM-DD');
            
            // Очищаем пустые поля (только для строк, не для массивов)
            Object.keys(this.data).forEach(key => {
                if (this.data[key] === '' && typeof this.data[key] === 'string') {
                    this.data[key] = 'Не указано';
                }
            });

            // Добавляем поля для шаблона
            this.data.name = this.data.stateName; // для совместимости с шаблоном
            this.data.history = this.data.history_events || []; // переименовываем для шаблона
            this.data.population_history = this.data.population_history || []; // убеждаемся что массив существует

            await this.onFinish(this.data);
            this.close();
        } catch (error) {
            console.error('Ошибка при создании государства:', error);
            new this.Notice('Ошибка при создании государства');
        }
    }

    onClose() {
        // Очистка ресурсов при необходимости
    }
}

module.exports = StateWizardModal;
