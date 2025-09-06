/**
 * @file       PotionWizardModal.js
 * @description Модальное окно мастера для создания нового зелья.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    [дата создания]
 * @updated    2025-08-12
 * @docs       /docs/project.md
 */

class PotionWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectPath, onFinish, options = {}) {
        super(app);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.data = {
            potionName: '',
            description: '',
            preparationTime: '',
            conditions: '',
            tools: '',
            complexity: '',
            shelfLife: '',
            storageConditions: '',
            usageInstructions: '',
            creationHistory: '',
            // Ингредиенты
            ingredient1Name: '', ingredient1Amount: '', ingredient1Source: '', ingredient1Notes: '', ingredient1Manual: '',
            ingredient2Name: '', ingredient2Amount: '', ingredient2Source: '', ingredient2Notes: '', ingredient2Manual: '',
            ingredient3Name: '', ingredient3Amount: '', ingredient3Source: '', ingredient3Notes: '', ingredient3Manual: '',
            // Эффекты
            effect1Name: '', effect1Duration: '', effect1Description: '', effect1Manual: '',
            effect2Name: '', effect2Duration: '', effect2Description: '', effect2Manual: '',
            effect3Name: '', effect3Duration: '', effect3Description: '', effect3Manual: '',
            // Теги и локации
            tag1: '', tag1Manual: '', tag2: '', tag2Manual: '', tag3: '', tag3Manual: '',
            location1: '', location1Manual: '', location2: '', location2Manual: '',
            // Ограничения и риски
            limitation1: '', risk1: '', precaution1: '',
            limitation2: '', risk2: '', precaution2: '',
            limitation3: '', risk3: '', precaution3: '',
            // Дополнительно
            addToReference: true,
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderIngredients.bind(this),
            this.renderEffects.bind(this),
            this.renderTagsLocations.bind(this),
            this.renderPreparation.bind(this),
            this.renderUsage.bind(this),
            this.renderRisks.bind(this),
            this.renderHistory.bind(this),
        ];
        this.spravochniki = {};
    }

    async onOpen() {
        await this.loadSpravochniki();
        
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
        
        // Предзаполнение имени из options.prefillName
        if (this.options && typeof this.options.prefillName === 'string' && this.options.prefillName.trim()) {
            if (!this.data.potionName) this.data.potionName = this.options.prefillName.trim();
        }
        this.render();
    }

    async loadSpravochniki() {
        // Чтение справочников из Магия/Справочники/
        const base = `${this.projectPath}/Магия/Справочники`;
        console.log('[DEBUG] Загружаем справочники из:', base);
        
        const readList = async (file) => {
            try {
                const fullPath = `${base}/${file}`;
                console.log('[DEBUG] Пытаемся прочитать файл:', fullPath);
                const f = this.app.vault.getAbstractFileByPath(fullPath);
                if (!f) {
                    console.log('[DEBUG] Файл не найден:', fullPath);
                    return [];
                }
                const text = await this.app.vault.read(f);
                const lines = text.split('\n').map(x => x.trim()).filter(Boolean);
                console.log(`[DEBUG] Прочитано ${lines.length} строк из ${file}:`, lines);
                return lines;
            } catch (error) {
                console.error('[DEBUG] Ошибка при чтении файла:', file, error);
                return [];
            }
        };

        const ensureList = async (file, defaults) => {
            try {
                const fullPath = `${base}/${file}`;
                let f = this.app.vault.getAbstractFileByPath(fullPath);
                if (!f) {
                    try { await this.app.vault.createFolder(base); } catch (e) {}
                    const content = (defaults || []).join('\n');
                    f = await this.app.vault.create(fullPath, content);
                    console.log('[DEBUG] Создан справочник:', fullPath);
                } else if (defaults && defaults.length > 0) {
                    // Если файл пустой, заполним дефолтами
                    try {
                        const current = await this.app.vault.read(f);
                        if (!current.trim()) {
                            await this.app.vault.modify(f, defaults.join('\n'));
                            console.log('[DEBUG] Заполнен пустой справочник:', fullPath);
                        }
                    } catch (e) {}
                }
            } catch (e) {
                console.warn('[DEBUG] ensureList error for', file, e.message);
            }
        };
        
        // Гарантируем наличие базовых справочников (создаём, если отсутствуют)
        await ensureList('Ингредиенты_зелий.md', []);
        await ensureList('Эффекты_зелий.md', ['Исцеление', 'Усиление силы', 'Невидимость', 'Сон', 'Очищение']);
        await ensureList('Теги_зелий.md', ['лечебное', 'боевое', 'поддержка', 'яд', 'редкое']);
        await ensureList('Локации_зелий.md', ['Лаборатория', 'Лес', 'Рынок трав', 'Пещера']);
        await ensureList('Инструменты_зельеварения.md', ['Котелок', 'Реторта', 'Обратный холодильник', 'Ступка и пестик', 'Весы', 'Фильтр']);
        // Сложности и время могут уже существовать — создадим при отсутствии без дефолтов (или используем имеющиеся)
        await ensureList('Сложности_зелий.md', []);
        await ensureList('Время_приготовления_зелий.md', []);

        // Читаем все списки
        this.spravochniki.ingredient = await readList('Ингредиенты_зелий.md');
        this.spravochniki.effect = await readList('Эффекты_зелий.md');
        this.spravochniki.tag = await readList('Теги_зелий.md');
        this.spravochniki.location = await readList('Локации_зелий.md');
        this.spravochniki.complexity = await readList('Сложности_зелий.md');
        this.spravochniki.prepTime = await readList('Время_приготовления_зелий.md');
        this.spravochniki.instrument = await readList('Инструменты_зельеварения.md');
        
        console.log('[DEBUG] Загруженные справочники:', this.spravochniki);
    }

    render() {
        this.contentEl.empty();
        this.steps[this.step]();
    }

    renderMainInfo() {
        // Индикатор прогресса
        const progress = this.contentEl.createDiv('progress-indicator');
        progress.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--background-secondary);
            border-radius: 8px;
        `;
        
        const steps = ['Основная информация', 'Ингредиенты', 'Эффекты', 'Теги и локации', 'Приготовление', 'Применение', 'Риски', 'История'];
        steps.forEach((step, index) => {
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
        
        const header = this.contentEl.createEl('h2', { text: 'Основная информация' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        new Setting(this.contentEl)
            .setName('Название зелья')
            .addText(t => t.setValue(this.data.potionName).onChange(v => this.data.potionName = v));
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        this.addNav();
    }

    renderIngredients() {
        console.log('[DEBUG] renderIngredients вызван');
        this.contentEl.createEl('h2', { text: 'Ингредиенты (до 3)' });
        
        // Добавляем справку
        console.log('[DEBUG] Создаем справку...');
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        `;
        
        const helpTitle = help.createEl('h3', { text: '🧪 Справка по ингредиентам' });
        helpTitle.style.cssText = `
            margin: 0 0 10px 0;
            color: var(--text-accent);
            font-size: 16px;
        `;
        
        const helpText = help.createEl('p', { text: 'Выберите ингредиенты из справочника или введите вручную. Укажите количество, источник получения и дополнительные заметки.' });
        helpText.style.cssText = `
            margin: 0;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.4;
        `;
        
        console.log('[DEBUG] Справка создана, создаем ингредиенты...');
        
        for (let i = 1; i <= 3; i++) {
            const container = this.contentEl.createDiv('ingredient-container');
            
            // Dropdown для выбора из справочника или ручного ввода
            new Setting(container)
                .setName(`Ингредиент ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.ingredient || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(this.data[`ingredient${i}Name`] || '');
                    d.onChange(v => {
                        this.data[`ingredient${i}Name`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода (показывается только если выбрано "Ввести вручную")
            if (this.data[`ingredient${i}Name`] === 'manual') {
                new Setting(container)
                    .setName('Название (ручной ввод)')
                    .addText(t => {
                        t.setValue(this.data[`ingredient${i}Manual`] || '');
                        t.onChange(v => this.data[`ingredient${i}Manual`] = v);
                    });
            }
            
            // Остальные поля
            new Setting(container)
                .addText(t => t.setPlaceholder('Количество').setValue(this.data[`ingredient${i}Amount`]).onChange(v => this.data[`ingredient${i}Amount`] = v))
                .addText(t => t.setPlaceholder('Источник').setValue(this.data[`ingredient${i}Source`]).onChange(v => this.data[`ingredient${i}Source`] = v))
                .addText(t => t.setPlaceholder('Заметки').setValue(this.data[`ingredient${i}Notes`]).onChange(v => this.data[`ingredient${i}Notes`] = v));
        }
        // Опция добавления новых ингредиентов в справочник
        const refSetting = new Setting(this.contentEl)
            .setName('Добавлять новые ингредиенты в справочник')
            .setDesc('Новые названия из ручного ввода будут автоматически дописаны в Магия/Справочники/Ингредиенты_зелий.md')
            .addToggle(t => {
                t.setValue(this.data.addToReference ?? true);
                t.onChange(v => this.data.addToReference = v);
            });
        console.log('[DEBUG] renderIngredients завершен');
        this.addNav();
    }

    renderEffects() {
        this.contentEl.createEl('h2', { text: 'Эффекты (до 3)' });
        
        // Добавляем справку
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        `;
        
        const helpTitle = help.createEl('h3', { text: '⚡ Справка по эффектам' });
        helpTitle.style.cssText = `
            margin: 0 0 10px 0;
            color: var(--text-accent);
            font-size: 16px;
        `;
        
        const helpText = help.createEl('p', { text: 'Опишите эффекты зелья: что происходит при его употреблении, как долго действует и какие ощущения вызывает.' });
        helpText.style.cssText = `
            margin: 0;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.4;
        `;
        
        for (let i = 1; i <= 3; i++) {
            const container = this.contentEl.createDiv('effect-container');
            
            // Dropdown для выбора из справочника или ручного ввода
            new Setting(container)
                .setName(`Эффект ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.effect || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    const current = this.data[`effect${i}Name`];
                    // Если ранее был ручной ввод, не подменять значение на 'manual' в дропдауне без сохранённого текста
                    d.setValue(current === 'manual' ? 'manual' : (current || ''));
                    d.onChange(v => {
                        this.data[`effect${i}Name`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода (показывается только если выбрано "Ввести вручную")
            if (this.data[`effect${i}Name`] === 'manual') {
                new Setting(container)
                    .setName('Название эффекта (ручной ввод)')
                    .addText(t => {
                        t.setValue(this.data[`effect${i}Manual`] || '');
                        t.onChange(v => this.data[`effect${i}Manual`] = v);
                    });
            }
            
            // Остальные поля
            new Setting(container)
                .addText(t => t.setPlaceholder('Длительность').setValue(this.data[`effect${i}Duration`]).onChange(v => this.data[`effect${i}Duration`] = v))
                .addTextArea(t => t.setPlaceholder('Описание').setValue(this.data[`effect${i}Description`]).onChange(v => this.data[`effect${i}Description`] = v));
        }
        this.addNav();
    }

    renderTagsLocations() {
        this.contentEl.createEl('h2', { text: 'Теги и локации' });
        
        // Добавляем справку
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        `;
        
        const helpTitle = help.createEl('h3', { text: '💡 Справка' });
        helpTitle.style.cssText = `
            margin: 0 0 10px 0;
            color: var(--text-accent);
            font-size: 16px;
        `;
        
        const helpText = help.createEl('p', { text: 'Теги помогают классифицировать зелье. Локации указывают, где собирают ингредиенты, готовят или используют зелье.' });
        helpText.style.cssText = `
            margin: 0;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.4;
        `;
        
        // Группируем теги и локации
        const tagsSection = this.contentEl.createDiv('tags-section');
        tagsSection.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const tagsTitle = tagsSection.createEl('h3', { text: '🏷️ Теги' });
        tagsTitle.style.cssText = `
            margin: 0 0 15px 0;
            color: var(--text-accent);
            font-size: 16px;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 5px;
        `;
        
        // Теги
        for (let i = 1; i <= 3; i++) {
            const container = tagsSection.createDiv('tag-container');
            
            new Setting(container)
                .setName(`Тег ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.tag || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(this.data[`tag${i}`] || '');
                    d.onChange(v => {
                        this.data[`tag${i}`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода тега
            if (this.data[`tag${i}`] === 'manual') {
                new Setting(container)
                    .setName('Тег (ручной ввод)')
                    .addText(t => {
                        t.setValue(this.data[`tag${i}Manual`] || '');
                        t.onChange(v => this.data[`tag${i}Manual`] = v);
                    });
            }
        }
        
        const locationsSection = this.contentEl.createDiv('locations-section');
        const locationsTitle = locationsSection.createEl('h3', { text: '📍 Локации' });
        locationsTitle.style.cssText = `
            margin: 0 0 15px 0;
            color: var(--text-accent);
            font-size: 16px;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 5px;
        `;
        
        const locationsHelp = locationsSection.createEl('p', { text: 'Укажите места сбора ингредиентов, приготовления или использования зелья' });
        locationsHelp.style.cssText = `
            margin: 0 0 15px 0;
            color: var(--text-muted);
            font-size: 12px;
            font-style: italic;
        `;
        
        // Локации
        for (let i = 1; i <= 2; i++) {
            const container = locationsSection.createDiv('location-container');
            
            new Setting(container)
                .setName(`Локация ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.location || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(this.data[`location${i}`] || '');
                    d.onChange(v => {
                        this.data[`location${i}`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода локации
            if (this.data[`location${i}`] === 'manual') {
                new Setting(container)
                    .setName('Локация (ручной ввод)')
                    .addText(t => {
                        t.setValue(this.data[`location${i}Manual`] || '');
                        t.onChange(v => this.data[`location${i}Manual`] = v);
                    });
            }
        }
        
        this.addNav();
    }

    renderPreparation() {
        this.contentEl.createEl('h2', { text: 'Процесс приготовления' });
        // Время приготовления из справочника или вручную
        const prepContainer = this.contentEl.createDiv();
        new Setting(prepContainer)
            .setName('Время приготовления')
            .addDropdown(d => {
                (this.spravochniki.prepTime || []).forEach(val => d.addOption(val, val));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.preparationTime || '');
                d.onChange(v => { this.data.preparationTime = v; this.render(); });
            });
        if (this.data.preparationTime === 'manual') {
            new Setting(prepContainer)
                .setName('Время (ручной ввод)')
                .addText(t => t.setValue(this.data.preparationTimeManual || '').onChange(v => this.data.preparationTimeManual = v));
        }
        // Условия, инструменты
        new Setting(this.contentEl).setName('Условия').addText(t => t.setValue(this.data.conditions).onChange(v => this.data.conditions = v));
        // Динамический список инструментов
        const instrumentsTitle = this.contentEl.createEl('h3', { text: 'Инструменты' });
        instrumentsTitle.style.cssText = 'margin: 16px 0 8px 0; color: var(--text-accent);';
        const instrumentsContainer = this.contentEl.createDiv('instruments-list');
        // Инициализация из существующей строки tools
        if (!this.instrumentsList) {
            const seed = (this.data.tools || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .map(name => ({ mode: 'select', name }));
            this.instrumentsList = seed.length > 0 ? seed : [{ mode: 'select', name: '' }];
        }
        this.renderInstrumentsList(instrumentsContainer);
        const addInstrumentBtn = this.contentEl.createEl('button', { text: '+ Добавить инструмент' });
        addInstrumentBtn.style.cssText = 'margin-top: 8px; padding: 6px 12px;';
        addInstrumentBtn.onclick = () => {
            this.instrumentsList.push({ mode: 'select', name: '' });
            this.renderInstrumentsList(instrumentsContainer);
        };
        // Сложность из справочника или вручную
        const compContainer = this.contentEl.createDiv();
        new Setting(compContainer)
            .setName('Сложность')
            .addDropdown(d => {
                (this.spravochniki.complexity || []).forEach(val => d.addOption(val, val));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.complexity || '');
                d.onChange(v => { this.data.complexity = v; this.render(); });
            });
        if (this.data.complexity === 'manual') {
            new Setting(compContainer)
                .setName('Сложность (ручной ввод)')
                .addText(t => t.setValue(this.data.complexityManual || '').onChange(v => this.data.complexityManual = v));
        }
        // Прочее
        new Setting(this.contentEl).setName('Срок годности').addText(t => t.setValue(this.data.shelfLife).onChange(v => this.data.shelfLife = v));
        new Setting(this.contentEl).setName('Условия хранения').addText(t => t.setValue(this.data.storageConditions).onChange(v => this.data.storageConditions = v));
        this.addNav();
    }

    renderInstrumentsList(container) {
        container.empty();
        (this.instrumentsList || []).forEach((item, idx) => {
            const row = container.createDiv('instrument-row');
            row.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:6px;';
            // Dropdown выбора из справочника или ручной ввод
            new Setting(row)
                .setName(`Инструмент ${idx + 1}`)
                .addDropdown(d => {
                    (this.spravochniki.instrument || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(item.mode === 'manual' ? 'manual' : (item.name || ''));
                    d.onChange(v => {
                        if (v === 'manual') {
                            item.mode = 'manual';
                            item.name = item.manual || '';
                        } else {
                            item.mode = 'select';
                            item.name = v;
                        }
                        this.updateToolsFromList();
                        this.renderInstrumentsList(container);
                    });
                });
            if (item.mode === 'manual') {
                new Setting(row)
                    .setName('Название (ручной ввод)')
                    .addText(t => {
                        t.setValue(item.manual || '');
                        t.onChange(v => {
                            item.manual = v;
                            item.name = v;
                            this.updateToolsFromList();
                        });
                    });
            }
            // Кнопка удаления
            if (this.instrumentsList.length > 1) {
                const del = row.createEl('button', { text: '×' });
                del.style.cssText = 'padding:4px 8px;';
                del.onclick = () => {
                    this.instrumentsList.splice(idx, 1);
                    this.updateToolsFromList();
                    this.renderInstrumentsList(container);
                };
            }
        });
        this.updateToolsFromList();
    }

    updateToolsFromList() {
        const names = (this.instrumentsList || [])
            .map(x => (x.name || '').trim())
            .filter(Boolean);
        this.data.tools = names.join(', ');
    }

    renderUsage() {
        this.contentEl.createEl('h2', { text: 'Инструкции по применению' });
        new Setting(this.contentEl).setName('Инструкции').addTextArea(t => t.setValue(this.data.usageInstructions).onChange(v => this.data.usageInstructions = v));
        this.addNav();
    }

    renderRisks() {
        this.contentEl.createEl('h2', { text: 'Ограничения и риски (до 3)' });
        for (let i = 1; i <= 3; i++) {
            new Setting(this.contentEl)
                .setName(`Ограничение ${i}`)
                .addText(t => t.setValue(this.data[`limitation${i}`]).onChange(v => this.data[`limitation${i}`] = v))
                .addText(t => t.setPlaceholder('Риск').setValue(this.data[`risk${i}`]).onChange(v => this.data[`risk${i}`] = v))
                .addText(t => t.setPlaceholder('Меры предосторожности').setValue(this.data[`precaution${i}`]).onChange(v => this.data[`precaution${i}`] = v));
        }
        this.addNav();
    }

    renderHistory() {
        this.contentEl.createEl('h2', { text: 'История создания' });
        new Setting(this.contentEl).setName('История').addTextArea(t => t.setValue(this.data.creationHistory).onChange(v => this.data.creationHistory = v));
        this.addNav(true);
    }

    addNav(isLast = false) {
        const nav = this.contentEl.createDiv('nav-buttons');
        nav.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--background-modifier-border);
        `;
        
        const leftButtons = nav.createDiv('nav-left');
        const rightButtons = nav.createDiv('nav-right');
        
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
            prevBtn.onclick = () => { this.step--; this.render(); };
        }
        
        if (!isLast) {
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
            nextBtn.onclick = () => { this.step++; this.render(); };
        } else {
            const finishBtn = rightButtons.createEl('button', { text: '✓ Готово' });
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
                if (!this.data.potionName.trim()) {
                    new this.Notice('Введите название зелья!');
                    return;
                }
                this.close();
                this.onFinish(this.data);
            };
        }
    }
}

module.exports = PotionWizardModal;
