/**
 * @file       SpellWizardModal.js
 * @description Модальное окно для создания и редактирования информации о заклинаниях.
 * @author     Ваш Автор
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2024-07-22
 * @updated    2024-07-22
 * @docs       docs/Карточка функционала.md (скоро будет создана)
 */
// Modal, Setting, Notice передаются через конструктор

class SpellWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectPath, onFinish) {
        super(app);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.data = {
            spellName: '',
            description: '',
            school: '', schoolManual: '',
            level: '', levelManual: '',
            castingTime: '',
            range: '',
            components: '',
            duration: '',
            tag1: '', tag1Manual: '', tag2: '', tag2Manual: '', tag3: '', tag3Manual: '',
            class1: '', class1Manual: '', class2: '', class2Manual: '',
            effect1Name: '', effect1Description: '', effect1Manual: '',
            effect2Name: '', effect2Description: '', effect2Manual: '',
            effect3Name: '', effect3Description: '', effect3Manual: '',
            requirements: '',
            limitations: '',
            risks: '',
            usageInstructions: '',
            creationHistory: '',
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderCharacteristics.bind(this),
            this.renderEffects.bind(this),
            this.renderTagsClasses.bind(this),
            this.renderUsageConditions.bind(this),
            this.renderUsageInstructions.bind(this),
            this.renderCreationHistory.bind(this),
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
        
        this.render();
    }

    async loadSpravochniki() {
        const base = `${this.projectPath}/Магия/Справочники`;
        const readList = async (file) => {
            try {
                const f = this.app.vault.getAbstractFileByPath(`${base}/${file}`);
                if (!f) return [];
                const text = await this.app.vault.read(f);
                return text.split('\n').map(x => x.trim()).filter(Boolean);
            } catch { return []; }
        };
        const ensureList = async (file, defaults) => {
            try {
                const fullPath = `${base}/${file}`;
                let f = this.app.vault.getAbstractFileByPath(fullPath);
                if (!f) {
                    try { await this.app.vault.createFolder(base); } catch {}
                    const content = (defaults || []).join('\n');
                    await this.app.vault.create(fullPath, content);
                } else if (defaults && defaults.length > 0) {
                    const current = await this.app.vault.read(f);
                    if (!current.trim()) {
                        await this.app.vault.modify(f, defaults.join('\n'));
                    }
                }
            } catch {}
        };

        // Гарантируем наличие базовых справочников
        await ensureList('Школы_заклинаний.md', ['Огня', 'Холода', 'Иллюзии', 'Природы', 'Защиты']);
        await ensureList('Уровни_заклинаний.md', ['Новичок', 'Адепт', 'Мастер', 'Архимаг']);
        await ensureList('Теги_заклинаний.md', ['боевое', 'поддержка', 'контроль', 'исцеление']);
        await ensureList('Классы_заклинаний.md', ['Маг', 'Жрец', 'Друид', 'Бард']);
        await ensureList('Эффекты_заклинаний.md', ['Урон', 'Оглушение', 'Исцеление', 'Усиление']);

        this.spravochniki.school = await readList('Школы_заклинаний.md');
        this.spravochniki.level = await readList('Уровни_заклинаний.md');
        this.spravochniki.tag = await readList('Теги_заклинаний.md');
        this.spravochniki.class = await readList('Классы_заклинаний.md');
        this.spravochniki.effect = await readList('Эффекты_заклинаний.md');
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">💡 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Здесь вы можете указать основную информацию о заклинании: название, описание и базовые характеристики.
                Все поля с выпадающими списками имеют опцию "— Ввести вручную —" для свободного ввода.
            </div>
        `;
        
        new Setting(this.contentEl)
            .setName('Название заклинания')
            .addText(t => t.setValue(this.data.spellName).onChange(v => this.data.spellName = v));
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        this.addNav();
    }

    renderCharacteristics() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'Характеристики заклинания' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">⚡ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Укажите технические характеристики заклинания: школу магии, уровень, время произнесения, дистанцию, компоненты и длительность.
                Все поля с выпадающими списками имеют опцию "— Ввести вручную —" для свободного ввода.
            </div>
        `;
        
        // Школа магии
        const schoolContainer = this.contentEl.createDiv('school-container');
        new Setting(schoolContainer)
            .setName('Школа магии')
            .addDropdown(d => {
                (this.spravochniki.school || []).forEach(val => d.addOption(val, val));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.school || '');
                d.onChange(v => {
                    this.data.school = v;
                    this.render(); // Перерисовываем для показа/скрытия поля ввода
                });
                // Увеличиваем размер выпадающего списка
                d.selectEl.style.minWidth = '280px';
                d.selectEl.style.fontSize = '14px';
                d.selectEl.style.padding = '6px';
            });
        
        // Поле для ручного ввода школы
        if (this.data.school === 'manual') {
            new Setting(schoolContainer)
                .setName('Школа магии (ручной ввод)')
                .addText(t => {
                    t.setValue(this.data.schoolManual || '');
                    t.onChange(v => this.data.schoolManual = v);
                    // Увеличиваем размер поля
                    t.inputEl.style.width = '100%';
                    t.inputEl.style.fontSize = '16px';
                    t.inputEl.style.padding = '8px';
                });
        }
        
        // Уровень заклинания
        const levelContainer = this.contentEl.createDiv('level-container');
        new Setting(levelContainer)
            .setName('Уровень')
            .addDropdown(d => {
                (this.spravochniki.level || []).forEach(val => d.addOption(val, val));
                d.addOption('manual', '— Ввести вручную —');
                d.setValue(this.data.level || '');
                d.onChange(v => {
                    this.data.level = v;
                    this.render(); // Перерисовываем для показа/скрытия поля ввода
                });
                // Увеличиваем размер выпадающего списка
                d.selectEl.style.minWidth = '280px';
                d.selectEl.style.fontSize = '14px';
                d.selectEl.style.padding = '6px';
            });
        
        // Поле для ручного ввода уровня
        if (this.data.level === 'manual') {
            new Setting(levelContainer)
                .setName('Уровень (ручной ввод)')
                .addText(t => {
                    t.setValue(this.data.levelManual || '');
                    t.onChange(v => this.data.levelManual = v);
                    // Увеличиваем размер поля
                    t.inputEl.style.width = '100%';
                    t.inputEl.style.fontSize = '16px';
                    t.inputEl.style.padding = '8px';
                });
        }
        
        // Остальные характеристики
        new Setting(this.contentEl)
            .setName('Время произнесения')
            .addText(t => t.setValue(this.data.castingTime).onChange(v => this.data.castingTime = v));
        new Setting(this.contentEl)
            .setName('Дистанция')
            .addText(t => t.setValue(this.data.range).onChange(v => this.data.range = v));
        new Setting(this.contentEl)
            .setName('Компоненты')
            .addText(t => t.setValue(this.data.components).onChange(v => this.data.components = v));
        new Setting(this.contentEl)
            .setName('Длительность')
            .addText(t => t.setValue(this.data.duration).onChange(v => this.data.duration = v));
        
        this.addNav();
    }

    renderEffects() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'Эффекты заклинания' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">✨ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Опишите эффекты заклинания. Можно указать до 3 эффектов. Каждый эффект может быть выбран из справочника или введен вручную.
            </div>
        `;
        
        for (let i = 1; i <= 3; i++) {
            const effectContainer = this.contentEl.createDiv(`effect-${i}-container`);
            
            new Setting(effectContainer)
                .setName(`Эффект ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.effect || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(this.data[`effect${i}Name`] || '');
                    d.onChange(v => {
                        this.data[`effect${i}Name`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода эффекта
            if (this.data[`effect${i}Name`] === 'manual') {
                new Setting(effectContainer)
                    .setName(`Эффект ${i} (ручной ввод)`)
                    .addText(t => {
                        t.setValue(this.data[`effect${i}Manual`] || '');
                        t.onChange(v => this.data[`effect${i}Manual`] = v);
                    });
            }
            
            new Setting(effectContainer)
                .setName(`Описание эффекта ${i}`)
                .addTextArea(t => t.setPlaceholder('Описание эффекта').setValue(this.data[`effect${i}Description`]).onChange(v => this.data[`effect${i}Description`] = v));
        }
        this.addNav();
    }

    renderTagsClasses() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'Теги и классы заклинания' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🏷️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Укажите теги и классы заклинания для лучшей организации и поиска. Теги помогают классифицировать заклинание по различным критериям.
            </div>
        `;
        
        for (let i = 1; i <= 3; i++) {
            const tagContainer = this.contentEl.createDiv(`tag-${i}-container`);
            
            new Setting(tagContainer)
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
                new Setting(tagContainer)
                    .setName(`Тег ${i} (ручной ввод)`)
                    .addText(t => {
                        t.setValue(this.data[`tag${i}Manual`] || '');
                        t.onChange(v => this.data[`tag${i}Manual`] = v);
                    });
            }
        }
        
        for (let i = 1; i <= 2; i++) {
            const classContainer = this.contentEl.createDiv(`class-${i}-container`);
            
            new Setting(classContainer)
                .setName(`Класс ${i}`)
                .addDropdown(d => {
                    (this.spravochniki.class || []).forEach(val => d.addOption(val, val));
                    d.addOption('manual', '— Ввести вручную —');
                    d.setValue(this.data[`class${i}`] || '');
                    d.onChange(v => {
                        this.data[`class${i}`] = v;
                        this.render(); // Перерисовываем для показа/скрытия поля ввода
                    });
                });
            
            // Поле для ручного ввода класса
            if (this.data[`class${i}`] === 'manual') {
                new Setting(classContainer)
                    .setName(`Класс ${i} (ручной ввод)`)
                    .addText(t => {
                        t.setValue(this.data[`class${i}Manual`] || '');
                        t.onChange(v => this.data[`class${i}Manual`] = v);
                    });
            }
        }
        this.addNav();
    }

    renderUsageConditions() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'Условия применения заклинания' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">⚠️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Опишите условия применения заклинания: требования, ограничения и возможные риски. Это поможет избежать неправильного использования.
            </div>
        `;
        
        new Setting(this.contentEl).setName('Требования').addTextArea(t => t.setValue(this.data.requirements).onChange(v => this.data.requirements = v));
        new Setting(this.contentEl).setName('Ограничения').addTextArea(t => t.setValue(this.data.limitations).onChange(v => this.data.limitations = v));
        new Setting(this.contentEl).setName('Риски').addTextArea(t => t.setValue(this.data.risks).onChange(v => this.data.risks = v));
        this.addNav();
    }

    renderUsageInstructions() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'Инструкции по применению' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📖 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Опишите подробные инструкции по применению заклинания. Включите пошаговые указания, жесты, произносимые слова и другие важные детали.
            </div>
        `;
        
        new Setting(this.contentEl).setName('Инструкции').addTextArea(t => t.setValue(this.data.usageInstructions).onChange(v => this.data.usageInstructions = v));
        this.addNav();
    }

    renderCreationHistory() {
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
        
        const steps = ['Основная информация', 'Характеристики', 'Эффекты', 'Теги и классы', 'Условия использования', 'Инструкции', 'История'];
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
        
        const header = this.contentEl.createEl('h2', { text: 'История создания заклинания' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = this.contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📜 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Опишите историю создания заклинания: кто его создал, когда, какие эксперименты проводились, какие неудачи были на пути к успеху.
            </div>
        `;
        
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
                if (!this.data.spellName.trim()) {
                    new this.Notice('Введите название заклинания!');
                    return;
                }
                this.close();
                this.onFinish(this.data);
            };
        }
    }
}

module.exports = SpellWizardModal;
