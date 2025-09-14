/**
 * @file       SceneWizardModal.js
 * @description Модальное окно мастера для создания новой сцены.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

// Modal, Setting, Notice передаются через конструктор

class SceneWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, autocompleteData, onFinish, plugin) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.plugin = plugin; // Добавляем плагин
        this.autocompleteData = autocompleteData; // { plotLinesList, charactersList, locationsList, chapterChoices, defaultChapterNum }
        this.onFinish = onFinish;
        this.state = {
            step: 0,
            sceneName: '',
            chapterNum: (autocompleteData && autocompleteData.defaultChapterNum) || '',
            // chapterManual: '', // Удалено: ручной ввод главы не нужен
            plotLines: [],
            characters: [],
            locations: [],
            tags: [],
        };
        this.steps = [
            'Название сцены',
            'Номер главы',
            'Сюжетные линии',
            'Персонажи',
            'Локации',
            'Теги',
            'Предпросмотр',
        ];
    }
    onOpen() {
        try { console.log('[SceneWizardModal] onOpen'); } catch (_) {}
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
        try { console.log('[SceneWizardModal] render step =', this.state.step); } catch (_) {}
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
        `;
        
        this.steps.forEach((step, index) => {
            const stepEl = progress.createDiv('step');
            stepEl.style.cssText = `
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: ${index === this.state.step ? '600' : '400'};
                color: ${index === this.state.step ? 'var(--text-on-accent)' : 'var(--text-muted)'};
                background: ${index === this.state.step ? 'var(--interactive-accent)' : 'transparent'};
            `;
            stepEl.textContent = step;
        });
        
        // Заголовок шага
        const header = contentEl.createEl('h2', { text: this.steps[this.state.step] });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Основной контент
        switch (this.state.step) {
            case 0: this.renderSceneName(contentEl); break;
            case 1: this.renderChapterNumber(contentEl); break;
            case 2: this.renderPlotLines(contentEl); break;
            case 3: this.renderCharacters(contentEl); break;
            case 4: this.renderLocations(contentEl); break;
            case 5: this.renderTags(contentEl); break;
            case 6: this.renderPreview(contentEl); break;
        }
    }
    renderSceneName(el) {
        try { console.log('[SceneWizardModal] renderSceneName'); } catch (_) {}
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🎬 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Введите краткое и описательное название сцены. Название должно отражать основное действие или событие, которое происходит в сцене.
            </div>
        `;
        
        new this.Setting(el)
            .setName('Название сцены')
            .addText(text => {
                text.setPlaceholder('Введите название сцены')
                .setValue(this.state.sceneName)
                .onChange(value => {
                    this.state.sceneName = value;
                    });
                // Увеличиваем размер поля
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontSize = '16px';
                text.inputEl.style.padding = '8px';
            });
        this.renderNav(el, () => {
            if (!this.state.sceneName.trim()) {
                new this.Notice('Название сцены обязательно!');
                return;
            }
            try { console.log('[SceneWizardModal] sceneName set:', this.state.sceneName); } catch (_) {}
            this.state.step++;
            this.render();
        });
    }
    renderChapterNumber(el) {
        try { console.log('[SceneWizardModal] renderChapterNumber, chapters =', (this.autocompleteData.chapterChoices||[]).length); } catch (_) {}
        // Справка
        const help = el.createDiv('help-section');
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
                Выберите главу, в которой будет размещена сцена. Сцена будет помещена в папку выбранной главы.
            </div>
        `;
        
        const chapters = this.autocompleteData.chapterChoices || [];
        const container = el.createDiv();
        el.appendChild(container);
        
        if (chapters.length === 0) {
            const noChaptersDiv = container.createDiv();
            noChaptersDiv.style.cssText = `
                padding: 20px;
                text-align: center;
                color: var(--text-muted);
                background: var(--background-secondary);
                border-radius: 8px;
                margin-bottom: 15px;
            `;
            noChaptersDiv.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 8px;">📚</div>
                <div>Главы не найдены</div>
                <div style="font-size: 12px; margin-top: 5px;">Создайте главы в проекте для продолжения</div>
            `;
        } else {
            // Создаем кнопки для каждой главы
            chapters.forEach(chapter => {
                const chapterBtn = container.createEl('button', {
                    text: `${chapter.num} - ${chapter.name}`
                });
                const isSelected = this.state.chapterNum === chapter.num;
                chapterBtn.classList.add('lt-btn', 'lt-btn-wide');
                if (isSelected) chapterBtn.classList.add('lt-btn-selected');
                chapterBtn.onclick = () => {
                    this.state.chapterNum = chapter.num;
                    this.render();
                };
            });
        }
        
        this.renderNav(el, () => {
            if (!this.state.chapterNum) {
                new this.Notice('Пожалуйста, выберите главу из списка.');
                return;
            }
            try { console.log('[SceneWizardModal] chapter selected:', this.state.chapterNum); } catch (_) {}
            this.state.step++;
            this.render();
        });
    }
    renderPlotLines(el) {
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📈 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите сюжетные линии, которые развиваются в этой сцене. Укажите степень участия: прямая (основная линия), связанная (вторичная) или фоновая (упоминается).
            </div>
        `;
        
        const list = this.autocompleteData.plotLinesList;
        const selected = [...this.state.plotLines];
        const container = el.createDiv();
        el.appendChild(container);
        
        // Красивая кнопка добавления
        const addBtn = container.createEl('button', { text: '➕ Добавить сюжетную линию' });
        addBtn.addClass('lt-btn', 'lt-btn-primary');
        
        addBtn.addEventListener('mouseenter', () => {
            addBtn.style.background = 'var(--interactive-accent-hover)';
        });
        addBtn.addEventListener('mouseleave', () => {
            addBtn.style.background = 'var(--interactive-accent)';
        });
        
        addBtn.onclick = () => {
            console.log('[SceneWizardModal] add plot line clicked');
            console.log('[SceneWizardModal] list:', list);
            console.log('[SceneWizardModal] selected:', selected);
            const choices = list.filter(l => !selected.find(s => s.id === l.id)).map(l => `${l.name} - ${l.description}`);
            console.log('[SceneWizardModal] choices:', choices);
            if (choices.length === 0) {
                console.log('[SceneWizardModal] No choices available');
                return;
            }
            console.log('[SceneWizardModal] window.SuggesterModal:', typeof window.SuggesterModal);
            if (typeof window.SuggesterModal === 'undefined') {
                console.error('[SceneWizardModal] SuggesterModal not found!');
                return;
            }
            new window.SuggesterModal(this.app, this.Modal, this.Setting, this.Notice, choices, choices, 'Выберите сюжетную линию').openAndGetValue().then(choice => {
                if (!choice) return;
                const lineObj = list.find(l => `${l.name} - ${l.description}` === choice);
                if (!lineObj) return;
                // Степень
                const degrees = [ 'Прямая', 'Связанная', 'Фоновая' ];
                new window.SuggesterModal(this.app, this.Modal, this.Setting, this.Notice, degrees, degrees, `Степень для "${lineObj.name}"`).openAndGetValue().then(degree => {
                    if (!degree) return;
                    // Описание
                    const descPrompt = new window.PromptModal(this.app, this.Modal, this.Setting, this.Notice, `Краткое описание роли сцены в линии "${lineObj.name}":`);
                    descPrompt.openAndGetValue().then(description => {
                        selected.push({
                            id: lineObj.id,
                            line: lineObj.name,
                            degree: degree.toLowerCase(),
                            description: description || `Развитие линии "${lineObj.name}"`
                        });
                        this.state.plotLines = selected;
                        this.render();
                    });
                });
            });
        };
        
        // Список выбранных с красивым дизайном
        if (selected.length > 0) {
            const selectedContainer = container.createDiv('selected-plot-lines');
            selectedContainer.style.cssText = `
                background: var(--background-secondary);
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
            `;
            
        selected.forEach((pl, idx) => {
                const itemDiv = selectedContainer.createDiv('plot-line-item');
                itemDiv.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: var(--background-primary);
                    border-radius: 6px;
                    border-left: 3px solid var(--interactive-accent);
                `;
                
                const infoDiv = itemDiv.createDiv('plot-line-info');
                infoDiv.innerHTML = `
                    <div style="font-weight: 600; color: var(--text-accent);">${pl.line}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${pl.degree} • ${pl.description}</div>
                `;
                
                const deleteBtn = itemDiv.createEl('button', { text: '🗑️' });
                deleteBtn.style.cssText = `
                    background: var(--background-modifier-error);
                    color: var(--text-on-accent);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                deleteBtn.onclick = () => {
                    this.state.plotLines.splice(idx, 1);
                this.render();
            };
        });
        }
        
        this.renderNav(el, () => {
            if (!this.state.plotLines.length) {
                new this.Notice('Выберите хотя бы одну сюжетную линию!');
                return;
            }
            try { console.log('[SceneWizardModal] plot lines selected:', this.state.plotLines.length); } catch (_) {}
            this.state.step++;
            this.render();
        }, true);
    }
    renderCharacters(el) {
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">👥 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите персонажей, которые участвуют в этой сцене. Персонажи будут автоматически связаны ссылками в созданном файле сцены.
            </div>
        `;
        
        const list = this.autocompleteData.charactersList;
        const selected = [...this.state.characters];
        const container = el.createDiv();
        el.appendChild(container);
        
        // Контейнер для кнопок
        const buttonContainer = container.createDiv();
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        `;
        
        // Кнопка добавления существующего персонажа
        const addBtn = buttonContainer.createEl('button', { text: '👤 Добавить персонажа' });
        addBtn.addClass('lt-btn', 'lt-btn-primary');
        
        // Кнопка создания нового персонажа
        const createBtn = buttonContainer.createEl('button', { text: '➕ Создать персонажа' });
        createBtn.addClass('lt-btn', 'lt-btn-success');
        
        // Обработчик создания персонажа
        createBtn.onclick = () => {
            this.close();
            if (typeof window.createCharacter === 'function') {
                window.createCharacter(this.plugin);
            } else {
                console.error('[SceneWizardModal] createCharacter: typeof =', typeof window.createCharacter, 'значение:', window.createCharacter);
                console.error('[SceneWizardModal] Функция создания персонажа недоступна. Возможно, не экспортирована в window или не загружена.');
            }
        };
        
        addBtn.onclick = () => {
            try { console.log('[SceneWizardModal] add character clicked'); } catch (_) {}
            const choices = list.filter(c => !selected.includes(c));
            if (choices.length === 0) {
                new this.Notice('Нет доступных персонажей для добавления');
                return;
            }
            new window.SuggesterModal(this.app, this.Modal, this.Setting, this.Notice, choices, choices, 'Выберите персонажа').openAndGetValue().then(choice => {
                if (!choice) return;
                selected.push(choice);
                this.state.characters = selected;
                this.render();
            });
        };
        
        // Список выбранных с красивым дизайном
        if (selected.length > 0) {
            const selectedContainer = container.createDiv('selected-characters');
            selectedContainer.style.cssText = `
                background: var(--background-secondary);
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
            `;
            
            selected.forEach((character, idx) => {
                const itemDiv = selectedContainer.createDiv('character-item');
                itemDiv.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: var(--background-primary);
                    border-radius: 6px;
                    border-left: 3px solid var(--interactive-accent);
                `;
                
                const infoDiv = itemDiv.createDiv('character-info');
                infoDiv.innerHTML = `
                    <div style="font-weight: 600; color: var(--text-accent);">${character}</div>
                `;
                
                const deleteBtn = itemDiv.createEl('button', { text: '🗑️' });
                deleteBtn.style.cssText = `
                    background: var(--background-modifier-error);
                    color: var(--text-on-accent);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                deleteBtn.onclick = () => {
                    this.state.characters.splice(idx, 1);
                this.render();
            };
        });
        }
        
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    renderLocations(el) {
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📍 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите локации, где происходит действие сцены. Локации будут автоматически связаны ссылками в созданном файле сцены.
            </div>
        `;
        
        const list = this.autocompleteData.locationsList;
        const selected = [...this.state.locations];
        const container = el.createDiv();
        el.appendChild(container);
        
        // Контейнер для кнопок (локации)
        const buttonContainerLoc = container.createDiv();
        buttonContainerLoc.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        `;
        // Кнопка добавления существующей локации
        const addBtnLoc = buttonContainerLoc.createEl('button', { text: '📍 Добавить локацию' });
        addBtnLoc.addClass('lt-btn', 'lt-btn-primary');
        // Кнопка создания новой локации
        const createBtnLoc = buttonContainerLoc.createEl('button', { text: '➕ Создать локацию' });
        createBtnLoc.addClass('lt-btn', 'lt-btn-success');
        
        // Обработчик создания локации
        createBtnLoc.onclick = () => {
            this.close();
            if (typeof window.createLocation === 'function') {
                window.createLocation(this.plugin);
            } else {
                console.error('[SceneWizardModal] createLocation: typeof =', typeof window.createLocation, 'значение:', window.createLocation);
                console.error('[SceneWizardModal] Функция создания локации недоступна. Возможно, не экспортирована в window или не загружена.');
            }
        };
        
        addBtnLoc.onclick = () => {
            try { console.log('[SceneWizardModal] add location clicked'); } catch (_) {}
            const choices = list.filter(l => !selected.includes(l));
            if (choices.length === 0) {
                new this.Notice('Нет доступных локаций для добавления');
                return;
            }
            new window.SuggesterModal(this.app, this.Modal, this.Setting, this.Notice, choices, choices, 'Выберите локацию').openAndGetValue().then(choice => {
                if (!choice) return;
                selected.push(choice);
                this.state.locations = selected;
                this.render();
            });
        };
        
        // Список выбранных с красивым дизайном
        if (selected.length > 0) {
            const selectedContainer = container.createDiv('selected-locations');
            selectedContainer.style.cssText = `
                background: var(--background-secondary);
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
            `;
            
            selected.forEach((location, idx) => {
                const itemDiv = selectedContainer.createDiv('location-item');
                itemDiv.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: var(--background-primary);
                    border-radius: 6px;
                    border-left: 3px solid var(--interactive-accent);
                `;
                
                const infoDiv = itemDiv.createDiv('location-info');
                infoDiv.innerHTML = `
                    <div style="font-weight: 600; color: var(--text-accent);">${location}</div>
                `;
                
                const deleteBtn = itemDiv.createEl('button', { text: '🗑️' });
                deleteBtn.style.cssText = `
                    background: var(--background-modifier-error);
                    color: var(--text-on-accent);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                deleteBtn.onclick = () => {
                    this.state.locations.splice(idx, 1);
                this.render();
            };
        });
        }
        
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    renderTags(el) {
        // Справка
        const help = el.createDiv('help-section');
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
                Введите теги для сцены через запятую. Теги помогут классифицировать сцену и найти её в будущем. Например: "экшн", "диалог", "важное событие".
            </div>
        `;
        
        new this.Setting(el)
            .setName('Теги (через запятую)')
            .addText(text => {
                text.setPlaceholder('Введите теги через запятую')
                    .setValue(this.state.tags.join(', '))
                    .onChange(value => {
                        this.state.tags = value.split(',').map(s => s.trim()).filter(Boolean);
                    });
            });
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    renderPreview(el) {
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">👁️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Проверьте всю информацию о сцене перед созданием. Если что-то нужно изменить, вернитесь к предыдущим шагам.
            </div>
        `;
        
        const previewEl = el.createEl('div', { cls: 'preview-section' });
        previewEl.style.cssText = `
            background: var(--background-secondary);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        const previewHeader = previewEl.createEl('h3', { text: 'Предпросмотр сцены' });
        previewHeader.style.cssText = `
            color: var(--text-accent);
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
        `;
        
        const previewContent = previewEl.createDiv('preview-content');
        previewContent.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        `;
        
        // Левая колонка
        const leftCol = previewContent.createDiv('preview-left');
        leftCol.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">🎬 Название:</strong><br>
                <span style="color: var(--text-normal);">${this.state.sceneName}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">📖 Глава:</strong><br>
                <span style="color: var(--text-normal);">${this.state.chapterNum}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">🏷️ Теги:</strong><br>
                <span style="color: var(--text-normal);">${this.state.tags.join(', ') || 'Нет'}</span>
            </div>
        `;
        
        // Правая колонка
        const rightCol = previewContent.createDiv('preview-right');
        rightCol.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">📈 Сюжетные линии:</strong><br>
                <span style="color: var(--text-normal);">${this.state.plotLines.map(pl => pl.line).join(', ') || 'Нет'}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">👥 Персонажи:</strong><br>
                <span style="color: var(--text-normal);">${this.state.characters.join(', ') || 'Нет'}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-accent);">📍 Локации:</strong><br>
                <span style="color: var(--text-normal);">${this.state.locations.join(', ') || 'Нет'}</span>
            </div>
        `;
        
        // Добавляем навигацию с кнопками
        this.renderNav(el, null, true, false);
    }
    renderNav(el, onNext, showBack = false, showOnlyBack = false) {
        const navEl = el.createEl('div', { cls: 'modal-nav' });
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
        if (this.state.step > 0) {
            const prevBtn = leftButtons.createEl('button', { text: '← Назад' });
            prevBtn.classList.add('lt-btn', 'lt-btn-outline');
            prevBtn.addEventListener('mouseenter', () => {
                prevBtn.style.background = 'var(--background-modifier-hover)';
            });
            prevBtn.addEventListener('mouseleave', () => {
                prevBtn.style.background = 'var(--background-secondary)';
            });
            prevBtn.onclick = () => {
                this.state.step--;
                this.render();
            };
        }
        
        // Кнопка "Далее" или "Создать сцену"
        if (this.state.step < this.steps.length - 1) {
            const nextBtn = rightButtons.createEl('button', { text: 'Далее →' });
            nextBtn.classList.add('lt-btn', 'lt-btn-primary');
            nextBtn.addEventListener('mouseenter', () => {
                nextBtn.style.background = 'var(--interactive-accent-hover)';
            });
            nextBtn.addEventListener('mouseleave', () => {
                nextBtn.style.background = 'var(--interactive-accent)';
            });
            nextBtn.onclick = () => {
            if (this.validateCurrentStep()) {
                this.state.step++;
                this.render();
            }
            };
        } else {
            const finishBtn = rightButtons.createEl('button', { text: '✓ Создать сцену' });
            finishBtn.classList.add('lt-btn', 'lt-btn-success');
            finishBtn.addEventListener('mouseenter', () => {
                finishBtn.style.background = 'var(--interactive-accent-hover)';
            });
            finishBtn.addEventListener('mouseleave', () => {
                finishBtn.style.background = 'var(--interactive-accent)';
            });
            finishBtn.onclick = () => {
                try { console.log('[SceneWizardModal] finish clicked, state =', this.state); } catch (_) {}
                new this.Notice('Создание сцены...');
                try {
                    this.onFinish(this.state);
                } catch (e) {
                    try { console.error('[SceneWizardModal] onFinish error', e); } catch (_) {}
                    new this.Notice('Ошибка при создании сцены: ' + e.message);
                }
                this.close();
            };
        }
    }
    validateCurrentStep() {
        switch (this.state.step) {
            case 0: // Scene Name
                if (!this.state.sceneName.trim()) {
                    new this.Notice('Название сцены обязательно!');
                    return false;
                }
                break;
            case 1: // Chapter Number (обязательно из списка)
                if (!this.state.chapterNum.trim()) {
                    new this.Notice('Пожалуйста, выберите главу из списка.');
                    return false;
                }
                break;
            case 2: // Plot Lines (необязательно)
            case 3: // Characters (необязательно)
            case 4: // Locations (необязательно)
            case 5: // Tags (необязательно)
                // Эти поля теперь необязательны
                break;
            case 6: // Preview
                // Для предпросмотра не требуется валидация
                break;
        }
        return true;
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = SceneWizardModal;
