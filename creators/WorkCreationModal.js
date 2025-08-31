/**
 * @file       WorkCreationModal.js
 * @description Модальное окно для создания нового произведения
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, HtmlWizardModal
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class WorkCreationModal extends HtmlWizardModal {
    constructor(app, plugin, options) {
        super(app, plugin);
        this.projectRoot = options.projectRoot;
        this.epochs = options.epochs;
        this.onWorkCreated = options.onWorkCreated;
        this.state = {
            title: '',
            id: '',
            description: '',
            epochId: '',
            year: '',
            context: ''
        };
    }

    async render() {
        console.log('=== WorkCreationModal.render() вызван ===');
        console.log('this.contentEl:', this.contentEl);
        console.log('this.epochs:', this.epochs);
        console.log('this.state:', this.state);
        
        const content = `
            <div class="work-creation">
                <h2>Создание нового произведения</h2>
                
                <div class="form-group">
                    <label for="work-title">Название произведения:</label>
                    <input type="text" id="work-title" value="${this.state.title}" placeholder="Введите название">
                </div>
                
                <div class="form-group">
                    <label for="work-id">ID произведения:</label>
                    <input type="text" id="work-id" value="${this.state.id}" placeholder="Краткий идентификатор">
                    <small>Используется для папок и файлов (латиница, без пробелов)</small>
                </div>
                
                <div class="form-group">
                    <label for="work-description">Описание:</label>
                    <textarea id="work-description" placeholder="Краткое описание произведения">${this.state.description}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="work-epoch">Эпоха:</label>
                    <select id="work-epoch">
                        <option value="">Выберите эпоху</option>
                        ${this.epochs.map(epoch => `
                            <option value="${epoch.id}" ${this.state.epochId === epoch.id ? 'selected' : ''}>
                                ${epoch.name} (${epoch.startYear}-${epoch.endYear})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="work-year">Год действия:</label>
                    <input type="number" id="work-year" value="${this.state.year}" placeholder="Год в рамках эпохи">
                </div>
                
                <div class="form-group">
                    <label for="work-context">Временной контекст:</label>
                    <textarea id="work-context" placeholder="Описание временного контекста произведения">${this.state.context}</textarea>
                    <small>Что происходит в мире в это время?</small>
                </div>
                
                <div class="form-actions">
                    <button class="create-work-btn" ${this.isFormValid() ? '' : 'disabled'}>Создать произведение</button>
                    <button class="cancel-work-btn">Отмена</button>
                </div>
                
                <div class="preview" style="display: none;">
                    <h3>Предварительный просмотр</h3>
                    <div class="preview-content"></div>
                </div>
            </div>
        `;

        this.contentEl.innerHTML = content;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Обработчики полей формы
        this.contentEl.querySelector('#work-title').addEventListener('input', (e) => {
            this.state.title = e.target.value;
            this.updateIdFromTitle();
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-id').addEventListener('input', (e) => {
            this.state.id = e.target.value;
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-description').addEventListener('input', (e) => {
            this.state.description = e.target.value;
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-epoch').addEventListener('change', (e) => {
            this.state.epochId = e.target.value;
            this.updateYearRange();
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-year').addEventListener('input', (e) => {
            this.state.year = e.target.value;
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-context').addEventListener('input', (e) => {
            this.state.context = e.target.value;
            this.updatePreview();
        });

        // Кнопки
        this.contentEl.querySelector('.create-work-btn').addEventListener('click', async () => {
            await this.createWork();
        });

        this.contentEl.querySelector('.cancel-work-btn').addEventListener('click', () => {
            this.close();
        });
    }

    updateIdFromTitle() {
        if (!this.state.id) {
            this.state.id = this.state.title
                .toLowerCase()
                .replace(/[^a-zа-я0-9\s]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);
            
            const idInput = this.contentEl.querySelector('#work-id');
            if (idInput) {
                idInput.value = this.state.id;
            }
        }
    }

    updateYearRange() {
        const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);
        if (selectedEpoch) {
            const yearInput = this.contentEl.querySelector('#work-year');
            yearInput.min = selectedEpoch.startYear;
            yearInput.max = selectedEpoch.endYear;
            yearInput.placeholder = `${selectedEpoch.startYear}-${selectedEpoch.endYear}`;
        }
    }

    updatePreview() {
        const previewEl = this.contentEl.querySelector('.preview');
        const previewContent = this.contentEl.querySelector('.preview-content');
        
        if (this.isFormValid()) {
            const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);
            const preview = `
                <div class="preview-item">
                    <strong>Название:</strong> ${this.state.title}
                </div>
                <div class="preview-item">
                    <strong>ID:</strong> ${this.state.id}
                </div>
                <div class="preview-item">
                    <strong>Эпоха:</strong> ${selectedEpoch ? selectedEpoch.name : ''}
                </div>
                <div class="preview-item">
                    <strong>Год:</strong> ${this.state.year}
                </div>
                <div class="preview-item">
                    <strong>Описание:</strong> ${this.state.description}
                </div>
                <div class="preview-item">
                    <strong>Контекст:</strong> ${this.state.context}
                </div>
                <div class="preview-item">
                    <strong>Папка:</strong> 1_Рукопись/Произведения/${this.state.id}/
                </div>
            `;
            
            previewContent.innerHTML = preview;
            previewEl.style.display = 'block';
        } else {
            previewEl.style.display = 'none';
        }
    }

    isFormValid() {
        return this.state.title.trim() !== '' &&
               this.state.id.trim() !== '' &&
               this.state.description.trim() !== '' &&
               this.state.epochId !== '' &&
               this.state.year !== '' &&
               this.state.context.trim() !== '';
    }

    async createWork() {
        try {
            if (!this.isFormValid()) {
                console.error('Форма не заполнена полностью');
                return;
            }

            const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);
            if (!selectedEpoch) {
                console.error('Эпоха не найдена');
                return;
            }

            const workData = {
                title: this.state.title.trim(),
                id: this.state.id.trim(),
                description: this.state.description.trim(),
                epochId: this.state.epochId,
                epoch: selectedEpoch.name,
                epochName: selectedEpoch.name,
                epochStartYear: selectedEpoch.startYear,
                epochEndYear: selectedEpoch.endYear,
                year: parseInt(this.state.year),
                context: this.state.context.trim()
            };

            console.log('Создание произведения:', workData);

            if (this.onWorkCreated) {
                await this.onWorkCreated(workData);
            }

            this.close();
            
        } catch (error) {
            console.error('Ошибка при создании произведения:', error);
        }
    }
}

// Делаем класс доступным глобально
if (typeof window !== 'undefined') {
    window.WorkCreationModal = WorkCreationModal;
}

module.exports = { WorkCreationModal };
