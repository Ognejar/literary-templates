/**
 * @file       WorldWizardModal.js
 * @description Модальное окно мастера для создания нового мира/проекта
 * @author     AI Assistant
 * @version    2.0.0
 * @license    MIT
 * @dependencies obsidian, HtmlWizardModal
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class WorldWizardModal extends HtmlWizardModal {
    constructor(app, plugin, parentFolder = '') {
        super(app, Modal, Notice);
        this.plugin = plugin;
        this.parentFolder = parentFolder;
        this.state = {
            step: 0,
            projectName: '',
            worldType: '',
            genre: '',
            description: '',
            mainTheme: '',
            secondaryThemes: [],
            author: plugin.settings && plugin.settings.author ? plugin.settings.author : '', // автоподстановка
            status: 'в разработке'
        };
        this.steps = [
            'Название мира',
            'Тип и жанр',
            'Описание',
            'Темы',
            'Автор',
            'Предпросмотр'
        ];
    }

    async onOpen() {
        this.render();
    }

    async render() {
        const step = this.state.step;
        const stepName = this.steps[step];
        
        let content = `
            <div class="world-wizard">
                <div class="wizard-header">
                    <h2>Создание нового мира</h2>
                    <div class="step-indicator">
                        Шаг ${step + 1} из ${this.steps.length}: ${stepName}
                    </div>
                </div>
                
                <div class="wizard-content">
                    ${this.renderStep(step)}
                </div>
                
                <div class="wizard-navigation">
                    ${this.renderNavigation()}
                </div>
            </div>
        `;

        this.contentEl.innerHTML = content;
        this.attachEventListeners();
    }

    renderStep(step) {
        switch (step) {
            case 0: return this.renderProjectName();
            case 1: return this.renderWorldType();
            case 2: return this.renderDescription();
            case 3: return this.renderThemes();
            case 4: return this.renderAuthor();
            case 5: return this.renderPreview();
            default: return '<p>Неизвестный шаг</p>';
        }
    }

    renderProjectName() {
        return `
            <div class="form-group">
                <label for="project-name">Название мира/проекта:</label>
                <input type="text" id="project-name" value="${this.state.projectName}" 
                       placeholder="Введите название мира" required>
                <small class="form-hint">Это будет основное название вашего мира</small>
            </div>
        `;
    }

    renderWorldType() {
        const worldTypes = [
            { value: 'fantasy', label: 'Фэнтези' },
            { value: 'scifi', label: 'Научная фантастика' },
            { value: 'historical', label: 'Исторический' },
            { value: 'modern', label: 'Современный' },
            { value: 'postapocalyptic', label: 'Постапокалипсис' },
            { value: 'steampunk', label: 'Стимпанк' },
            { value: 'cyberpunk', label: 'Киберпанк' },
            { value: 'other', label: 'Другое' }
        ];

        const genres = [
            // Sci-Fi жанры
            { value: 'space-opera', label: 'Космическая опера' },
            { value: 'hard-scifi', label: 'Жёсткая научная фантастика' },
            { value: 'cyberpunk', label: 'Киберпанк' },
            { value: 'post-apocalyptic', label: 'Постапокалипсис' },
            { value: 'military-scifi', label: 'Военная фантастика' },
            { value: 'steampunk', label: 'Стимпанк' },
            
            // Fantasy жанры
            { value: 'epic-fantasy', label: 'Эпическое фэнтези' },
            { value: 'urban-fantasy', label: 'Городское фэнтези' },
            { value: 'dark-fantasy', label: 'Тёмное фэнтези' },
            { value: 'high-fantasy', label: 'Высокое фэнтези' },
            { value: 'low-fantasy', label: 'Низкое фэнтези' },
            
            // Другие жанры
            { value: 'historical', label: 'Исторический' },
            { value: 'alternate-history', label: 'Альтернативная история' },
            { value: 'detective', label: 'Детектив' },
            { value: 'romance', label: 'Романтика' },
            { value: 'adventure', label: 'Приключения' },
            { value: 'thriller', label: 'Триллер' },
            { value: 'horror', label: 'Ужасы' },
            { value: 'other', label: 'Другое' }
        ];

        return `
            <div class="form-group">
                <label for="world-type">Тип мира:</label>
                <select id="world-type" required>
                    <option value="">Выберите тип мира</option>
                    ${worldTypes.map(type => 
                        `<option value="${type.value}" ${this.state.worldType === type.value ? 'selected' : ''}>
                            ${type.label}
                        </option>`
                    ).join('')}
                </select>
                <small class="form-hint">Тип мира определяет общую структуру и технологии (sci-fi — космические станции, fantasy — магия и замки)</small>
            </div>
            
            <div class="form-group">
                <label for="genre">Жанр произведения:</label>
                <select id="genre" required>
                    <option value="">Выберите жанр</option>
                    ${genres.map(genre => 
                        `<option value="${genre.value}" ${this.state.genre === genre.value ? 'selected' : ''}>
                            ${genre.label}
                        </option>`
                    ).join('')}
                </select>
                <small class="form-hint">Жанр определяет стиль шаблонов (космическая опера, жёсткая НФ, киберпанк и т.д.)</small>
            </div>
        `;
    }

    renderDescription() {
        return `
            <div class="form-group">
                <label for="description">Описание мира:</label>
                <textarea id="description" rows="6" 
                          placeholder="Опишите ваш мир, его особенности, историю, магию или технологии...">${this.state.description}</textarea>
                <small class="form-hint">Краткое описание мира для понимания его сути</small>
            </div>
        `;
    }

    renderThemes() {
        return `
            <div class="form-group">
                <label for="main-theme">Главная тема:</label>
                <input type="text" id="main-theme" value="${this.state.mainTheme}" 
                       placeholder="Основная тема произведения">
                <small class="form-hint">Например: борьба добра и зла, поиск себя, любовь и предательство</small>
            </div>
            
            <div class="form-group">
                <label for="secondary-themes">Второстепенные темы (через запятую):</label>
                <input type="text" id="secondary-themes" 
                       value="${this.state.secondaryThemes.join(', ')}" 
                       placeholder="Дружба, семья, справедливость">
                <small class="form-hint">Дополнительные темы, которые будут раскрыты в произведении</small>
            </div>
        `;
    }

    renderAuthor() {
        return `
            <div class="form-group">
                <label for="author">Автор:</label>
                <input type="text" id="author" value="${this.state.author}" 
                       placeholder="Ваше имя">
                <small class="form-hint">Имя автора произведения</small>
            </div>
            
            <div class="form-group">
                <label for="status">Статус проекта:</label>
                <select id="status">
                    <option value="в разработке" ${this.state.status === 'в разработке' ? 'selected' : ''}>В разработке</option>
                    <option value="черновик" ${this.state.status === 'черновик' ? 'selected' : ''}>Черновик</option>
                    <option value="редакция" ${this.state.status === 'редакция' ? 'selected' : ''}>Редакция</option>
                    <option value="готово" ${this.state.status === 'готово' ? 'selected' : ''}>Готово</option>
                </select>
            </div>
        `;
    }

    renderPreview() {
        const safeName = this.state.projectName.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').replace(/\s+/g, '_');
        const currentDate = new Date().toLocaleDateString('ru-RU');
        
        return `
            <div class="preview-content">
                <h3>Предпросмотр создаваемого мира</h3>
                
                <div class="preview-section">
                    <h4>Основная информация</h4>
                    <p><strong>Название:</strong> ${this.state.projectName || 'Не указано'}</p>
                    <p><strong>Тип мира:</strong> ${this.state.worldType || 'Не указан'}</p>
                    <p><strong>Жанр:</strong> ${this.state.genre || 'Не указан'}</p>
                    <p><strong>Автор:</strong> ${this.state.author || 'Не указан'}</p>
                    <p><strong>Статус:</strong> ${this.state.status}</p>
                    <p><strong>Дата создания:</strong> ${currentDate}</p>
                </div>
                
                <div class="preview-section">
                    <h4>Описание</h4>
                    <p>${this.state.description || 'Описание не указано'}</p>
                </div>
                
                <div class="preview-section">
                    <h4>Темы</h4>
                    <p><strong>Главная тема:</strong> ${this.state.mainTheme || 'Не указана'}</p>
                    <p><strong>Второстепенные темы:</strong> ${this.state.secondaryThemes.length > 0 ? this.state.secondaryThemes.join(', ') : 'Не указаны'}</p>
                </div>
                
                <div class="preview-section">
                    <h4>Создаваемые файлы</h4>
                    <ul>
                        <li>${safeName}.md - Основной файл проекта</li>
                        <li>Настройки_мира.md - Настройки мира</li>
                        <li>Локации/ - Папка для локаций</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderNavigation() {
        const step = this.state.step;
        const isLastStep = step === this.steps.length - 1;
        
        return `
            <div class="modal-nav" style="display: flex; justify-content: space-between; margin-top: 32px; gap: 16px;">
                <div>
                    ${step > 0 ? '<button class="mod-cta prev-btn">← Назад</button>' : ''}
                </div>
                <div>
                    ${isLastStep 
                        ? '<button class="mod-cta create-btn">✓ Создать мир</button>' 
                        : '<button class="mod-cta next-btn">Далее →</button>'
                    }
                    <button class="mod-cta cancel-btn" style="margin-left: 8px;">Отмена</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Кнопка "Назад"
        const prevBtn = this.contentEl.querySelector('.prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        // Кнопка "Далее"
        const nextBtn = this.contentEl.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        // Кнопка "Создать мир"
        const createBtn = this.contentEl.querySelector('.create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createWorld());
        }

        // Кнопка "Отмена"
        const cancelBtn = this.contentEl.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
    }

    async nextStep() {
        if (this.validateCurrentStep()) {
            this.state.step++;
            await this.render();
        }
    }

    prevStep() {
        if (this.state.step > 0) {
            this.state.step--;
            this.render();
        }
    }

    validateCurrentStep() {
        const step = this.state.step;
        
        switch (step) {
            case 0: // Название проекта
                const projectName = this.contentEl.querySelector('#project-name').value.trim();
                if (!projectName) {
                    console.error('Название мира обязательно');
                    return false;
                }
                this.state.projectName = projectName;
                break;
                
            case 1: // Тип и жанр
                const worldType = this.contentEl.querySelector('#world-type').value;
                const genre = this.contentEl.querySelector('#genre').value.trim();
                if (!worldType) {
                    console.error('Тип мира обязателен');
                    return false;
                }
                if (!genre) {
                    console.error('Жанр обязателен');
                    return false;
                }
                this.state.worldType = worldType;
                this.state.genre = genre;
                break;
                
            case 2: // Описание
                this.state.description = this.contentEl.querySelector('#description').value.trim();
                break;
                
            case 3: // Темы
                this.state.mainTheme = this.contentEl.querySelector('#main-theme').value.trim();
                const secondaryThemes = this.contentEl.querySelector('#secondary-themes').value.trim();
                this.state.secondaryThemes = secondaryThemes ? 
                    secondaryThemes.split(',').map(t => t.trim()).filter(t => t) : [];
                break;
                
            case 4: // Автор
                this.state.author = this.contentEl.querySelector('#author').value.trim();
                this.state.status = this.contentEl.querySelector('#status').value;
                break;
        }
        
        return true;
    }

    async createWorld() {
        try {
            // Собираем все данные
            this.validateCurrentStep();
            
            // Создаём мир
            const result = await createWorld(this.plugin, this.state, this.parentFolder);
            
            if (result.success) {
                console.log('Мир успешно создан:', result.worldPath);
                new Notice(result.message);
                this.close();
            } else {
                console.error('Ошибка создания мира:', result.error);
                new Notice('Ошибка создания мира: ' + result.error);
            }
            
        } catch (error) {
            console.error('Ошибка при создании мира:', error);
            new Notice('Ошибка при создании мира: ' + error.message);
        }
    }
}

module.exports = { WorldWizardModal };

if (typeof window !== 'undefined') {
    window.WorldWizardModal = WorldWizardModal;
}
