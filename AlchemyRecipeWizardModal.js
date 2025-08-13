/**
 * @file       AlchemyRecipeWizardModal.js
 * @description Модальное окно мастера для создания нового алхимического рецепта.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    [дата создания]
 * @updated    2025-08-12
 * @docs       /docs/project.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal.js');

class AlchemyRecipeWizardModal extends HtmlWizardModal {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish) {
        super(app, ModalClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.data = {
            name: '',
            category: '',
            description: '',
            difficulty: '',
            preparationTime: '',
            ingredients: '',
            process: '',
            result: '',
            effects: '',
            sideEffects: '',
            storage: '',
            notes: '',
            // Ингредиенты
            ingredient1Name: '', ingredient1Amount: '', ingredient1Source: '', ingredient1Notes: '',
            ingredient2Name: '', ingredient2Amount: '', ingredient2Source: '', ingredient2Notes: '',
            ingredient3Name: '', ingredient3Amount: '', ingredient3Source: '', ingredient3Notes: '',
            ingredient4Name: '', ingredient4Amount: '', ingredient4Source: '', ingredient4Notes: '',
            ingredient5Name: '', ingredient5Amount: '', ingredient5Source: '', ingredient5Notes: '',
            // Эффекты
            effect1Name: '', effect1Duration: '', effect1Description: '',
            effect2Name: '', effect2Duration: '', effect2Description: '',
            effect3Name: '', effect3Duration: '', effect3Description: '',
            // Ограничения и риски
            limitation1: '', risk1: '', precaution1: '',
            limitation2: '', risk2: '', precaution2: '',
            limitation3: '', risk3: '', precaution3: '',
        };
        this.step = 0;
        this.steps = [
            this.renderMainInfo.bind(this),
            this.renderDescription.bind(this),
            this.renderIngredients.bind(this),
            this.renderProcess.bind(this),
            this.renderEffects.bind(this),
            this.renderRisks.bind(this),
            this.renderStorage.bind(this),
            this.renderPreview.bind(this),
        ];
        this.config = {
            categories: ['Металлургия', 'Эликсиры', 'Порошки', 'Мази', 'Яды', 'Антидоты', 'Усилители', 'Трансформации', 'Другое'],
            difficulties: ['Простой', 'Средний', 'Сложный', 'Очень сложный', 'Экспертный'],
            preparationTimes: ['Быстро (до 1 часа)', 'Средне (1-4 часа)', 'Долго (4-12 часов)', 'Очень долго (12+ часов)', 'Дни', 'Недели'],
        };
    }

    async onOpen() {
        this.applyBaseStyles();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        this.contentEl.classList.add('lt-wizard');
        this.render();
    }

    render() {
        this.contentEl.empty();
        
        // Заголовок
        const header = this.contentEl.createEl('h2', { text: 'Создание алхимического рецепта' });
        header.classList.add('lt-header');
        
        // Прогресс
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const progressFill = progress.createEl('div', { cls: 'lt-progress__fill' });
        progressFill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        
        // Шаг
        const stepInfo = this.contentEl.createEl('div', { text: `Шаг ${this.step + 1} из ${this.steps.length}` });
        stepInfo.classList.add('lt-subtle');
        
        // Контент шага
        this.steps[this.step]();
        
        // Кнопки навигации
        this.renderNavigation();
    }

    renderMainInfo() {
        const container = this.contentEl.createEl('div');
        
        // Название
        new Setting(container)
            .setName('Название рецепта')
            .setDesc('Введите название алхимического рецепта')
            .addText(text => text
                .setPlaceholder('Например: Эликсир силы')
                .setValue(this.data.name)
                .onChange(value => this.data.name = value)
            );
        
        // Категория
        new Setting(container)
            .setName('Категория')
            .setDesc('Выберите категорию рецепта')
            .addDropdown(dropdown => {
                this.config.categories.forEach(category => {
                    dropdown.addOption(category, category);
                });
                dropdown.setValue(this.data.category);
                dropdown.onChange(value => this.data.category = value);
            });
        
        // Сложность
        new Setting(container)
            .setName('Сложность')
            .setDesc('Выберите уровень сложности рецепта')
            .addDropdown(dropdown => {
                this.config.difficulties.forEach(difficulty => {
                    dropdown.addOption(difficulty, difficulty);
                });
                dropdown.setValue(this.data.difficulty);
                dropdown.onChange(value => this.data.difficulty = value);
            });
        
        // Время приготовления
        new Setting(container)
            .setName('Время приготовления')
            .setDesc('Выберите время, необходимое для приготовления')
            .addDropdown(dropdown => {
                this.config.preparationTimes.forEach(time => {
                    dropdown.addOption(time, time);
                });
                dropdown.setValue(this.data.preparationTime);
                dropdown.onChange(value => this.data.preparationTime = value);
            });
    }

    renderDescription() {
        const container = this.contentEl.createEl('div');
        
        // Описание
        new Setting(container)
            .setName('Описание')
            .setDesc('Краткое описание рецепта и его назначения')
            .addTextArea(text => text
                .setPlaceholder('Опишите, что представляет собой этот рецепт и для чего он используется...')
                .setValue(this.data.description)
                .onChange(value => this.data.description = value)
            );
        
        // Результат
        new Setting(container)
            .setName('Результат')
            .setDesc('Что получается в результате приготовления')
            .addTextArea(text => text
                .setPlaceholder('Опишите, что получается в результате приготовления...')
                .setValue(this.data.result)
                .onChange(value => this.data.result = value)
            );
    }

    renderIngredients() {
        const container = this.contentEl.createEl('div');
        
        // Детальные ингредиенты
        const ingredientsTitle = container.createEl('h3', { text: 'Детальная информация об ингредиентах' });
        ingredientsTitle.style.cssText = 'margin-top: 20px; margin-bottom: 15px; color: #var(--text-accent);';
        
        // Контейнер для ингредиентов
        const ingredientsContainer = container.createEl('div', { cls: 'ingredients-list' });
        ingredientsContainer.style.cssText = 'margin-bottom: 20px;';
        
        // Инициализируем массив ингредиентов, если его нет
        if (!this.ingredientsList) {
            this.ingredientsList = [
                { name: this.data.ingredient1Name || '', amount: this.data.ingredient1Amount || '', source: this.data.ingredient1Source || '', notes: this.data.ingredient1Notes || '' },
                { name: this.data.ingredient2Name || '', amount: this.data.ingredient2Amount || '', source: this.data.ingredient2Source || '', notes: this.data.ingredient2Notes || '' }
            ];
        }
        
        // Отображаем существующие ингредиенты
        this.renderIngredientsList(ingredientsContainer);
        
        // Кнопка добавления нового ингредиента
        const addButton = container.createEl('button', { text: '+ Добавить ингредиент' });
        addButton.style.cssText = `
            padding: 8px 16px;
            background: #var(--text-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        `;
        addButton.onclick = () => {
            this.ingredientsList.push({ name: '', amount: '', source: '', notes: '' });
            this.renderIngredientsList(ingredientsContainer);
        };
    }

    renderIngredientsList(container) {
        container.empty();
        
        this.ingredientsList.forEach((ingredient, index) => {
            const ingredientDiv = container.createEl('div', { cls: 'ingredient-item' });
            ingredientDiv.style.cssText = `
                border: 1px solid #var(--background-modifier-border);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                background: #var(--background-secondary);
            `;
            
            const headerDiv = ingredientDiv.createEl('div');
            headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            
            const title = headerDiv.createEl('h4', { text: `Ингредиент ${index + 1}` });
            title.style.cssText = 'margin: 0; color: #var(--text-accent);';
            
            // Кнопка удаления (если больше одного ингредиента)
            if (this.ingredientsList.length > 1) {
                const deleteBtn = headerDiv.createEl('button', { text: '×' });
                deleteBtn.style.cssText = `
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                `;
                deleteBtn.onclick = () => {
                    this.ingredientsList.splice(index, 1);
                    this.renderIngredientsList(container);
                };
            }
            
            // Название ингредиента
            new Setting(ingredientDiv)
                .setName('Название')
                .setDesc('Название ингредиента')
                .addText(text => text
                    .setPlaceholder('Например: Корень мандрагоры')
                    .setValue(ingredient.name)
                    .onChange(value => {
                        ingredient.name = value;
                        this.updateIngredientsData();
                    })
                );
            
            // Количество
            new Setting(ingredientDiv)
                .setName('Количество')
                .setDesc('Количество и единицы измерения')
                .addText(text => text
                    .setPlaceholder('Например: 2 грамма')
                    .setValue(ingredient.amount)
                    .onChange(value => {
                        ingredient.amount = value;
                        this.updateIngredientsData();
                    })
                );
            
            // Источник
            new Setting(ingredientDiv)
                .setName('Источник')
                .setDesc('Где можно найти этот ингредиент')
                .addText(text => text
                    .setPlaceholder('Например: Лесные чащи, аптеки')
                    .setValue(ingredient.source)
                    .onChange(value => {
                        ingredient.source = value;
                        this.updateIngredientsData();
                    })
                );
            
            // Примечания
            new Setting(ingredientDiv)
                .setName('Примечания')
                .setDesc('Дополнительные примечания')
                .addText(text => text
                    .setPlaceholder('Особенности, предупреждения, советы')
                    .setValue(ingredient.notes)
                    .onChange(value => {
                        ingredient.notes = value;
                        this.updateIngredientsData();
                    })
                );
        });
    }

    updateIngredientsData() {
        // Обновляем данные в this.data для совместимости
        if (this.ingredientsList[0]) {
            this.data.ingredient1Name = this.ingredientsList[0].name;
            this.data.ingredient1Amount = this.ingredientsList[0].amount;
            this.data.ingredient1Source = this.ingredientsList[0].source;
            this.data.ingredient1Notes = this.ingredientsList[0].notes;
        }
        if (this.ingredientsList[1]) {
            this.data.ingredient2Name = this.ingredientsList[1].name;
            this.data.ingredient2Amount = this.ingredientsList[1].amount;
            this.data.ingredient2Source = this.ingredientsList[1].source;
            this.data.ingredient2Notes = this.ingredientsList[1].notes;
        }
        // Добавляем поддержку дополнительных ингредиентов
        if (this.ingredientsList[2]) {
            this.data.ingredient3Name = this.ingredientsList[2].name;
            this.data.ingredient3Amount = this.ingredientsList[2].amount;
            this.data.ingredient3Source = this.ingredientsList[2].source;
            this.data.ingredient3Notes = this.ingredientsList[2].notes;
        }
        if (this.ingredientsList[3]) {
            this.data.ingredient4Name = this.ingredientsList[3].name;
            this.data.ingredient4Amount = this.ingredientsList[3].amount;
            this.data.ingredient4Source = this.ingredientsList[3].source;
            this.data.ingredient4Notes = this.ingredientsList[3].notes;
        }
        if (this.ingredientsList[4]) {
            this.data.ingredient5Name = this.ingredientsList[4].name;
            this.data.ingredient5Amount = this.ingredientsList[4].amount;
            this.data.ingredient5Source = this.ingredientsList[4].source;
            this.data.ingredient5Notes = this.ingredientsList[4].notes;
        }
    }

    renderProcess() {
        const container = this.contentEl.createEl('div');
        
        // Процесс приготовления
        new Setting(container)
            .setName('Процесс приготовления')
            .setDesc('Пошаговое описание процесса приготовления')
            .addTextArea(text => text
                .setPlaceholder('Опишите пошагово процесс приготовления...')
                .setValue(this.data.process)
                .onChange(value => this.data.process = value)
            );
    }

    renderEffects() {
        const container = this.contentEl.createEl('div');
        
        // Детальные эффекты
        const effectsTitle = container.createEl('h3', { text: 'Детальная информация об эффектах' });
        effectsTitle.style.cssText = 'margin-top: 20px; margin-bottom: 15px; color: #var(--text-accent);';
        
        // Эффект 1
        new Setting(container)
            .setName('Эффект 1')
            .setDesc('Название первого эффекта')
            .addText(text => text
                .setPlaceholder('Название эффекта')
                .setValue(this.data.effect1Name)
                .onChange(value => this.data.effect1Name = value)
            );
        
        new Setting(container)
            .setName('Длительность')
            .addText(text => text
                .setPlaceholder('Длительность эффекта')
                .setValue(this.data.effect1Duration)
                .onChange(value => this.data.effect1Duration = value)
            );
        
        new Setting(container)
            .setName('Описание')
            .addText(text => text
                .setPlaceholder('Подробное описание эффекта')
                .setValue(this.data.effect1Description)
                .onChange(value => this.data.effect1Description = value)
            );
        
        // Эффект 2
        new Setting(container)
            .setName('Эффект 2')
            .setDesc('Название второго эффекта')
            .addText(text => text
                .setPlaceholder('Название эффекта')
                .setValue(this.data.effect2Name)
                .onChange(value => this.data.effect2Name = value)
            );
        
        new Setting(container)
            .setName('Длительность')
            .addText(text => text
                .setPlaceholder('Длительность эффекта')
                .setValue(this.data.effect2Duration)
                .onChange(value => this.data.effect2Duration = value)
            );
        
        new Setting(container)
            .setName('Описание')
            .addText(text => text
                .setPlaceholder('Подробное описание эффекта')
                .setValue(this.data.effect2Description)
                .onChange(value => this.data.effect2Description = value)
            );
    }

    renderRisks() {
        const container = this.contentEl.createEl('div');
        
        // Побочные эффекты
        new Setting(container)
            .setName('Побочные эффекты')
            .setDesc('Описание возможных побочных эффектов')
            .addTextArea(text => text
                .setPlaceholder('Опишите возможные побочные эффекты...')
                .setValue(this.data.sideEffects)
                .onChange(value => this.data.sideEffects = value)
            );
        
        // Ограничения и риски
        const risksTitle = container.createEl('h3', { text: 'Ограничения и риски' });
        risksTitle.style.cssText = 'margin-top: 20px; margin-bottom: 15px; color: #var(--text-accent);';
        
        // Ограничение 1
        new Setting(container)
            .setName('Ограничение 1')
            .setDesc('Первое ограничение использования')
            .addText(text => text
                .setPlaceholder('Опишите ограничение')
                .setValue(this.data.limitation1)
                .onChange(value => this.data.limitation1 = value)
            );
        
        new Setting(container)
            .setName('Риск 1')
            .addText(text => text
                .setPlaceholder('Опишите связанный риск')
                .setValue(this.data.risk1)
                .onChange(value => this.data.risk1 = value)
            );
        
        new Setting(container)
            .setName('Меры предосторожности 1')
            .addText(text => text
                .setPlaceholder('Опишите меры предосторожности')
                .setValue(this.data.precaution1)
                .onChange(value => this.data.precaution1 = value)
            );
        
        // Ограничение 2
        new Setting(container)
            .setName('Ограничение 2')
            .setDesc('Второе ограничение использования')
            .addText(text => text
                .setPlaceholder('Опишите ограничение')
                .setValue(this.data.limitation2)
                .onChange(value => this.data.limitation2 = value)
            );
        
        new Setting(container)
            .setName('Риск 2')
            .addText(text => text
                .setPlaceholder('Опишите связанный риск')
                .setValue(this.data.risk2)
                .onChange(value => this.data.risk2 = value)
            );
        
        new Setting(container)
            .setName('Меры предосторожности 2')
            .addText(text => text
                .setPlaceholder('Опишите меры предосторожности')
                .setValue(this.data.precaution2)
                .onChange(value => this.data.precaution2 = value)
            );
    }

    renderStorage() {
        const container = this.contentEl.createEl('div');
        
        // Условия хранения
        new Setting(container)
            .setName('Условия хранения')
            .setDesc('Как хранить готовый продукт')
            .addTextArea(text => text
                .setPlaceholder('Опишите условия хранения готового продукта...')
                .setValue(this.data.storage)
                .onChange(value => this.data.storage = value)
            );
        
        // Примечания
        new Setting(container)
            .setName('Дополнительные примечания')
            .setDesc('Любые дополнительные замечания')
            .addTextArea(text => text
                .setPlaceholder('Любые дополнительные замечания, советы, предупреждения...')
                .setValue(this.data.notes)
                .onChange(value => this.data.notes = value)
            );
    }

    renderPreview() {
        const container = this.contentEl.createEl('div');
        
        // Предварительный просмотр
        const preview = container.createEl('div', { cls: 'preview-section' });
        preview.style.cssText = `
            background: #var(--background-secondary);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        `;
        
        const previewTitle = preview.createEl('h3', { text: 'Предварительный просмотр' });
        previewTitle.style.cssText = 'margin-bottom: 15px; color: #var(--text-accent);';
        
        const previewContent = preview.createEl('div');
        previewContent.innerHTML = `
            <p><strong>Название:</strong> ${this.data.name || 'Не указано'}</p>
            <p><strong>Категория:</strong> ${this.data.category || 'Не указана'}</p>
            <p><strong>Сложность:</strong> ${this.data.difficulty || 'Не указана'}</p>
            <p><strong>Время приготовления:</strong> ${this.data.preparationTime || 'Не указано'}</p>
            <p><strong>Описание:</strong> ${this.data.description ? this.data.description.substring(0, 100) + '...' : 'Не указано'}</p>
            <p><strong>Результат:</strong> ${this.data.result ? this.data.result.substring(0, 100) + '...' : 'Не указан'}</p>
        `;
    }

    renderNavigation() {
        const navContainer = this.contentEl.createEl('div', { cls: 'lt-nav' });
        
        // Кнопка "Назад"
        if (this.step > 0) {
            const backBtn = this.createButton('secondary', '← Назад');
            backBtn.onclick = () => {
                this.step--;
                this.render();
            };
            navContainer.appendChild(backBtn);
        }
        
        // Кнопка "Далее" или "Готово"
        const nextBtn = this.createButton('primary', this.step === this.steps.length - 1 ? '✓ Готово' : 'Далее →');
        nextBtn.onclick = () => {
            if (this.validateCurrentStep()) {
                if (this.step === this.steps.length - 1) {
                    this.createRecipe();
                } else {
                    this.step++;
                    this.render();
                }
            }
        };
        navContainer.appendChild(nextBtn);
    }

    validateCurrentStep() {
        switch (this.step) {
            case 0: // Основная информация
                if (!this.data.name.trim()) {
                    new this.Notice('Введите название рецепта');
                    return false;
                }
                if (!this.data.category) {
                    new this.Notice('Выберите категорию рецепта');
                    return false;
                }
                break;
            case 1: // Описание
                if (!this.data.description.trim()) {
                    new this.Notice('Введите описание рецепта');
                    return false;
                }
                if (!this.data.result.trim()) {
                    new this.Notice('Опишите результат рецепта');
                    return false;
                }
                break;
            case 2: // Ингредиенты
                // Проверяем, что есть хотя бы один ингредиент с названием
                if (!this.ingredientsList || this.ingredientsList.length === 0 || !this.ingredientsList.some(ing => ing.name && ing.name.trim())) {
                    new this.Notice('Добавьте хотя бы один ингредиент с названием');
                    return false;
                }
                break;
            case 3: // Процесс
                if (!this.data.process.trim()) {
                    new this.Notice('Опишите процесс приготовления');
                    return false;
                }
                break;
        }
        return true;
    }

    async createRecipe() {
        try {
            // Подготовка данных
            const date = (window.moment ? window.moment() : { format: () => new Date().toISOString().slice(0, 10) }).format('YYYY-MM-DD');
            const rawCategory = String(this.data.category || '').trim();
            const category = rawCategory === 'manual' ? '' : rawCategory;
            const categoryLower = category ? category.toLowerCase() : '';

            // Формирование списка ингредиентов
            const ingredientsList = [];
            if (this.ingredientsList && this.ingredientsList.length > 0) {
                this.ingredientsList.forEach((ingredient) => {
                    const name = String(ingredient.name || '').trim();
                    if (name) {
                        const amount = String(ingredient.amount || '').trim();
                        const source = String(ingredient.source || '').trim();
                        const notes = String(ingredient.notes || '').trim();
                        const ingredientText = `- **${name}**: ${amount || 'Не указано'}${source ? ` (${source})` : ''}${notes ? ` - ${notes}` : ''}`;
                        ingredientsList.push(ingredientText);
                    }
                });
            }
            const ingredientsContent = ingredientsList.join('\n');

            // Формирование списка эффектов (детально)
            const effectsList = [];
            const pushEffect = (name, duration, desc) => {
                const effName = String(name || '').trim();
                if (!effName || effName === 'manual') return;
                const effDuration = String(duration || '').trim();
                const effDesc = String(desc || '').trim();
                effectsList.push(`- **${effName}**: ${effDuration || 'Не указано'} - ${effDesc || 'Не указано'}`);
            };
            pushEffect(this.data.effect1Name, this.data.effect1Duration, this.data.effect1Description);
            pushEffect(this.data.effect2Name, this.data.effect2Duration, this.data.effect2Description);
            const effectsContent = effectsList.join('\n');

            // Формирование списка ограничений
            const limitationsList = [];
            const pushLimitation = (lim, risk, precaution) => {
                const l = String(lim || '').trim();
                if (!l || l === 'manual') return;
                const r = String(risk || '').trim();
                const p = String(precaution || '').trim();
                limitationsList.push(`- **${l}**: Риск: ${r || 'Не указан'}. Меры предосторожности: ${p || 'Не указаны'}`);
            };
            pushLimitation(this.data.limitation1, this.data.risk1, this.data.precaution1);
            pushLimitation(this.data.limitation2, this.data.risk2, this.data.precaution2);
            const limitationsContent = limitationsList.join('\n');

            // Теги и tagImage
            const tags = ['alchemy', 'алхимия', 'recipe'].concat(categoryLower ? [categoryLower] : []);
            let tagImage = '';
            try {
                if (window.litSettingsService) {
                    if (tags.length > 0) {
                        tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, tags[0]);
                    }
                    if (!tagImage) {
                        tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Алхимия');
                    }
                }
            } catch {}

            // Данные для шаблона
            const data = {
                name: String(this.data.name || '').trim(),
                category,
                description: String(this.data.description || '').trim(),
                difficulty: (this.data.difficulty === 'manual') ? '' : String(this.data.difficulty || '').trim(),
                preparationTime: (this.data.preparationTime === 'manual') ? '' : String(this.data.preparationTime || '').trim(),
                process: String(this.data.process || '').trim(),
                result: String(this.data.result || '').trim(),
                sideEffects: String(this.data.sideEffects || '').trim(),
                storage: String(this.data.storage || '').trim(),
                notes: String(this.data.notes || '').trim(),
                date,
                categoryLower,
                ingredientsContent,
                effectsContent,
                limitationsContent,
                tagImage
            };

            // Генерация по шаблону с условными блоками и include
            const content = await window.generateFromTemplate('Новый_алхимический_рецепт', data, this.plugin);

            // Создание файла
            const targetFolder = `${this.projectPath}/Магия/Алхимия`;
            const fileName = data.name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            await window.ensureEntityInfrastructure(targetFolder, fileName, this.app);
            const targetPath = `${targetFolder}/${fileName}.md`;
            await window.safeCreateFile(targetPath, content, this.app);

            // Открытие файла
            const file = this.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            }

            // Автопополнение справочников (категории/эффекты/теги алхимии)
            try {
                const base = `${this.projectPath}/Магия/Справочники`;
                // Категории
                if (category) {
                    await updateReference(this.plugin, `${base}/Категории_алхимии.md`, [category]);
                }
                // Эффекты
                const effectNames = effectsList.map((line) => {
                    const m = line.match(/\*\*(.+?)\*\*/);
                    return m ? m[1] : '';
                }).filter(Boolean);
                if (effectNames.length) {
                    await updateReference(this.plugin, `${base}/Эффекты_алхимии.md`, effectNames);
                }
                // Теги
                if (tags.length) {
                    await updateReference(this.plugin, `${base}/Теги_алхимии.md`, tags);
                }
            } catch {}

            new this.Notice(`Алхимический рецепт "${data.name}" создан!`);
            this.close();

            if (this.onFinish) {
                this.onFinish();
            }

        } catch (error) {
            console.error('Ошибка при создании алхимического рецепта:', error);
            new this.Notice(`Ошибка при создании алхимического рецепта: ${error.message}`);
        }
    }

    fillTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value || '');
        }
        return result;
    }
}

module.exports = { AlchemyRecipeWizardModal };

async function updateReference(plugin, filePath, names) {
    try {
        const app = plugin.app;
        const base = filePath.split('/').slice(0, -1).join('/');
        const clean = (names || []).map((s) => String(s || '').trim()).filter(Boolean);
        if (clean.length === 0) return;
        let current = '';
        try {
            const f = app.vault.getAbstractFileByPath(filePath);
            if (f) current = await app.vault.read(f);
        } catch {}
        const existing = new Set(current.split('\n').map((s) => s.trim()).filter(Boolean));
        let added = false;
        clean.forEach((n) => {
            if (!existing.has(n)) { existing.add(n); added = true; }
        });
        if (!added) return;
        const lines = Array.from(existing).sort((a, b) => a.localeCompare(b, 'ru'));
        if (app.vault.getAbstractFileByPath(filePath)) {
            await app.vault.adapter.write(filePath, lines.join('\n'));
        } else {
            try { await app.vault.createFolder(base); } catch {}
            await app.vault.create(filePath, lines.join('\n'));
        }
    } catch (e) {
        try { await plugin.logDebug('updateReference (alchemy) error: ' + e.message); } catch {}
    }
}
