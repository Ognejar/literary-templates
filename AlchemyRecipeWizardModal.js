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

class AlchemyRecipeWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projectPath, onFinish) {
        super(app);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
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

    render() {
        this.contentEl.empty();
        
        // Заголовок
        const header = this.contentEl.createEl('h2', { text: 'Создание алхимического рецепта' });
        header.style.cssText = 'margin-bottom: 20px; color: #var(--text-accent);';
        
        // Прогресс
        const progress = this.contentEl.createEl('div', { cls: 'progress-bar' });
        progress.style.cssText = `
            width: 100%;
            height: 4px;
            background: #var(--background-secondary);
            border-radius: 2px;
            margin-bottom: 20px;
        `;
        const progressFill = progress.createEl('div');
        progressFill.style.cssText = `
            width: ${((this.step + 1) / this.steps.length) * 100}%;
            height: 100%;
            background: #var(--text-accent);
            border-radius: 2px;
            transition: width 0.3s ease;
        `;
        
        // Шаг
        const stepInfo = this.contentEl.createEl('div', { 
            text: `Шаг ${this.step + 1} из ${this.steps.length}` 
        });
        stepInfo.style.cssText = 'margin-bottom: 20px; color: #var(--text-muted); font-size: 14px;';
        
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
        
        // Ингредиенты (основные)
        new Setting(container)
            .setName('Основные ингредиенты')
            .setDesc('Список основных ингредиентов')
            .addTextArea(text => text
                .setPlaceholder('Перечислите основные ингредиенты через запятую...')
                .setValue(this.data.ingredients)
                .onChange(value => this.data.ingredients = value)
            );
        
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
        
        // Основные эффекты
        new Setting(container)
            .setName('Основные эффекты')
            .setDesc('Описание основных эффектов рецепта')
            .addTextArea(text => text
                .setPlaceholder('Опишите основные эффекты, которые производит рецепт...')
                .setValue(this.data.effects)
                .onChange(value => this.data.effects = value)
            );
        
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
        const navContainer = this.contentEl.createEl('div');
        navContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #var(--background-modifier-border);
        `;
        
        // Кнопка "Назад"
        if (this.step > 0) {
            const backBtn = navContainer.createEl('button', { text: '← Назад' });
            backBtn.style.cssText = `
                padding: 8px 16px;
                background: #var(--background-secondary);
                border: 1px solid #var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
            `;
            backBtn.onclick = () => {
                this.step--;
                this.render();
            };
        }
        
        // Кнопка "Далее" или "Создать"
        const nextBtn = navContainer.createEl('button', { 
            text: this.step === this.steps.length - 1 ? 'Создать рецепт' : 'Далее →' 
        });
        nextBtn.style.cssText = `
            padding: 8px 16px;
            background: #var(--text-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: auto;
        `;
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
                if (!this.data.ingredients.trim()) {
                    new this.Notice('Укажите основные ингредиенты');
                    return false;
                }
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
            const date = window.moment().format('YYYY-MM-DD');
            const categoryLower = this.data.category ? this.data.category.toLowerCase() : '';
            
            // Формирование списка ингредиентов
            const ingredientsList = [];
            if (this.ingredientsList && this.ingredientsList.length > 0) {
                this.ingredientsList.forEach(ingredient => {
                    if (ingredient.name && ingredient.name.trim()) {
                        const ingredientText = `- **${ingredient.name}**: ${ingredient.amount || 'Не указано'}${ingredient.source ? ` (${ingredient.source})` : ''}${ingredient.notes ? ` - ${ingredient.notes}` : ''}`;
                        ingredientsList.push(ingredientText);
                    }
                });
            }
            const ingredientsContent = ingredientsList.join('\n');
            
            // Формирование списка эффектов
            const effectsList = [];
            if (this.data.effect1Name) {
                effectsList.push(`- **${this.data.effect1Name}**: ${this.data.effect1Duration || 'Не указано'} - ${this.data.effect1Description || 'Не указано'}`);
            }
            if (this.data.effect2Name) {
                effectsList.push(`- **${this.data.effect2Name}**: ${this.data.effect2Duration || 'Не указано'} - ${this.data.effect2Description || 'Не указано'}`);
            }
            const effectsContent = effectsList.join('\n');
            
            // Формирование списка ограничений
            const limitationsList = [];
            if (this.data.limitation1) {
                limitationsList.push(`- **${this.data.limitation1}**: Риск: ${this.data.risk1 || 'Не указан'}. Меры предосторожности: ${this.data.precaution1 || 'Не указаны'}`);
            }
            if (this.data.limitation2) {
                limitationsList.push(`- **${this.data.limitation2}**: Риск: ${this.data.risk2 || 'Не указан'}. Меры предосторожности: ${this.data.precaution2 || 'Не указаны'}`);
            }
            const limitationsContent = limitationsList.join('\n');
            
            // Чтение шаблона
            const templatePath = 'templates/Новый_алхимический_рецепт.md';
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (!templateFile) {
                new this.Notice('Шаблон алхимического рецепта не найден!');
                return;
            }
            const templateContent = await this.app.vault.read(templateFile);
            
            // Подстановка значений
            const data = { 
                name: this.data.name, 
                category: this.data.category, 
                description: this.data.description, 
                difficulty: this.data.difficulty,
                preparationTime: this.data.preparationTime,
                ingredients: this.data.ingredients,
                process: this.data.process,
                result: this.data.result,
                effects: this.data.effects,
                sideEffects: this.data.sideEffects,
                storage: this.data.storage,
                notes: this.data.notes,
                date,
                categoryLower,
                ingredientsContent,
                effectsContent,
                limitationsContent
            };
            
            const filled = this.fillTemplate(templateContent, data);
            
            // Создание файла
            const targetFolder = `${this.projectPath}/Магия/Алхимия`;
            const fileName = this.data.name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            
            // Создаем папку, если не существует
            try {
                await this.app.vault.createFolder(targetFolder);
            } catch {
                // Папка уже существует
            }
            
            const targetPath = `${targetFolder}/${fileName}.md`;
            await this.app.vault.create(targetPath, filled);
            
            // Открытие файла
            const file = this.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            }
            
            new this.Notice(`Алхимический рецепт "${this.data.name}" создан!`);
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
