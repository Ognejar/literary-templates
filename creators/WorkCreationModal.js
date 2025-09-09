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
        super(app);
        this.plugin = plugin;
        this.projectRoot = options.projectRoot;
        this.epochs = options.epochs;
        this.onWorkCreated = options.onWorkCreated;
        this._idEditedManually = false;
        this.state = {
            title: '',
            id: '',
            description: '',
            epochId: '',
            year: '',
            context: '',
            workType: '',
            author: plugin.settings && plugin.settings.author ? plugin.settings.author : '' // автоподстановка
        };
    }

    onOpen() {
        try {
            if (typeof this.applyBaseStyles === 'function') this.applyBaseStyles();
            this.render();
        } catch (e) {
            console.error('WorkCreationModal onOpen error:', e);
        }
    }

    async render() {
        console.log('=== WorkCreationModal.render() вызван ===');
        console.log('this.contentEl:', this.contentEl);
        console.log('this.epochs:', this.epochs);
        console.log('this.state:', this.state);
        
        const types = ['Рассказ','Повесть','Роман','Стихотворение','Пьеса','Новелла','Эссе','Поэма','Цикл'];
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
                    <small>Используется для папок и файлов (можно кириллицей)</small>
                </div>
                
                <div class="form-group">
                    <label for="work-type">Тип произведения:</label>
                    <select id="work-type">
                        <option value="">Выберите тип</option>
                        ${types.map(t => `<option value="${t}" ${this.state.workType === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
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
                
                <div class="form-group">
                    <label for="work-author">Автор:</label>
                    <input type="text" id="work-author" value="${this.state.author}" placeholder="Имя автора">
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
        this.updateSubmitState();
        this.updateYearRange();
    }

    attachEventListeners() {
        // Обработчики полей формы
        this.contentEl.querySelector('#work-title').addEventListener('input', (e) => {
            this.state.title = e.target.value;
            this.updateIdFromTitle(true);
            this.updatePreview();
            this.updateSubmitState();
        });

        this.contentEl.querySelector('#work-id').addEventListener('input', (e) => {
            this._idEditedManually = true;
            this.state.id = this.normalizeId(e.target.value);
            e.target.value = this.state.id;
            this.updatePreview();
            this.updateSubmitState();
        });

        this.contentEl.querySelector('#work-description').addEventListener('input', (e) => {
            this.state.description = e.target.value;
            this.updatePreview();
            this.updateSubmitState();
        });

        const typeSelect = this.contentEl.querySelector('#work-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.state.workType = e.target.value;
                this.updatePreview();
                this.updateSubmitState();
            });
        }

        this.contentEl.querySelector('#work-epoch').addEventListener('change', (e) => {
            this.state.epochId = e.target.value;
            this.updateYearRange();
            this.updatePreview();
            this.updateSubmitState();
        });

        this.contentEl.querySelector('#work-year').addEventListener('input', (e) => {
            this.state.year = e.target.value;
            this.updatePreview();
            this.updateSubmitState();
        });

        this.contentEl.querySelector('#work-context').addEventListener('input', (e) => {
            this.state.context = e.target.value;
            this.updatePreview();
            this.updateSubmitState();
        });

        this.contentEl.querySelector('#work-author').addEventListener('input', (e) => {
            this.state.author = e.target.value;
            this.updatePreview();
            this.updateSubmitState();
        });

        // Кнопки
        this.contentEl.querySelector('.create-work-btn').addEventListener('click', async () => {
            await this.createWork();
        });

        this.contentEl.querySelector('.cancel-work-btn').addEventListener('click', () => {
            this.close();
        });
    }

    updateSubmitState() {
        try {
            const btn = this.contentEl.querySelector('.create-work-btn');
            if (btn) btn.disabled = !this.isFormValid();
        } catch (e) {
            console.error('WorkCreationModal updateSubmitState error:', e);
        }
    }

    normalizeId(raw) {
        try {
            let s = String(raw || '')
                .toLowerCase()
                .replace(/[^\p{L}\p{N}\s_-]/gu, '')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .substring(0, 64);
            return s;
        } catch (e) {
            console.error('WorkCreationModal normalizeId error:', e);
            // Fallback без Unicode property escapes
            let s = String(raw || '')
                .toLowerCase()
                .replace(/[^a-zа-яё0-9_\-\s]/gi, '')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .substring(0, 64);
            return s;
        }
    }

    updateIdFromTitle(force = false) {
        if (!this._idEditedManually || force) {
            const generated = this.normalizeId(this.state.title);
            this.state.id = generated;
            const idInput = this.contentEl.querySelector('#work-id');
            if (idInput) idInput.value = generated;
        }
    }

    updateYearRange() {
        const yearInput = this.contentEl.querySelector('#work-year');
        if (!yearInput) return;
        const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);
        if (selectedEpoch) {
            yearInput.min = selectedEpoch.startYear;
            yearInput.max = selectedEpoch.endYear;
            yearInput.placeholder = `${selectedEpoch.startYear}-${selectedEpoch.endYear}`;
        } else {
            yearInput.removeAttribute('min');
            yearInput.removeAttribute('max');
            yearInput.placeholder = 'Год (опционально)';
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
                    <strong>Тип:</strong> ${this.state.workType || '—'}
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
                    <strong>Автор:</strong> ${this.state.author || '—'}
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
        // Минимально требуем только название (ID генерируется из него)
        return this.state.title.trim() !== '' && this.state.id.trim() !== '';
    }

    async createWork() {
        try {
            if (!this.isFormValid()) {
                console.error('Форма не заполнена полностью');
                return;
            }

            const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);

            // Показываем индикатор загрузки
            const createBtn = this.contentEl.querySelector('.create-work-btn');
            const cancelBtn = this.contentEl.querySelector('.cancel-work-btn');
            const originalCreateText = createBtn.textContent;
            
            createBtn.textContent = 'Создание...';
            createBtn.disabled = true;
            cancelBtn.disabled = true;
            
            // Показываем уведомление
            if (typeof Notice !== 'undefined') {
                new Notice('Создание произведения...', 3000);
            }

            const workData = {
                title: this.state.title.trim(),
                id: this.state.id.trim(),
                description: this.state.description.trim(),
                epochId: this.state.epochId || '',
                epoch: selectedEpoch ? selectedEpoch.name : '',
                epochName: selectedEpoch ? selectedEpoch.name : '',
                epochStartYear: selectedEpoch ? selectedEpoch.startYear : '',
                epochEndYear: selectedEpoch ? selectedEpoch.endYear : '',
                year: this.state.year === '' ? '' : parseInt(this.state.year, 10),
                context: this.state.context.trim(),
                workType: this.state.workType.trim(),
                author: this.state.author.trim()
            };

            console.log('Создание произведения:', workData);

            if (this.onWorkCreated) {
                await this.onWorkCreated(workData);
            }

            // Если автор изменён — сохранить в настройки
            try {
                const prevAuthor = (this.plugin.settings && this.plugin.settings.author) ? this.plugin.settings.author : '';
                if (workData.author && workData.author !== prevAuthor) {
                    this.plugin.settings = this.plugin.settings || {};
                    this.plugin.settings.author = workData.author;
                    if (typeof this.plugin.saveSettings === 'function') {
                        await this.plugin.saveSettings();
                    }
                }
            } catch (_) {}

            // Успешное завершение
            if (typeof Notice !== 'undefined') {
                new Notice(`Произведение "${workData.title}" создано!`, 4000);
            }

            this.close();
            
        } catch (error) {
            console.error('Ошибка при создании произведения:', error);
            
            // Восстанавливаем кнопки при ошибке
            const createBtn = this.contentEl.querySelector('.create-work-btn');
            const cancelBtn = this.contentEl.querySelector('.cancel-work-btn');
            if (createBtn) {
                createBtn.textContent = 'Создать произведение';
                createBtn.disabled = false;
            }
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
            
            // Показываем ошибку
            if (typeof Notice !== 'undefined') {
                new Notice(`Ошибка при создании произведения: ${error.message}`, 6000);
            }
        }
    }
}

// Делаем класс доступным глобально
if (typeof window !== 'undefined') {
    window.WorkCreationModal = WorkCreationModal;
}

module.exports = { WorkCreationModal };
