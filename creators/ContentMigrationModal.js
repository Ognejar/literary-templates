/**
 * @file       ContentMigrationModal.js
 * @description Модальное окно для миграции существующего контента
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, HtmlWizardModal
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class ContentMigrationModal extends HtmlWizardModal {
    constructor(app, plugin, options) {
        super(app, plugin);
        this.projectRoot = options.projectRoot;
        this.epochs = options.epochs;
        this.existingChapters = options.existingChapters;
        this.onMigrationComplete = options.onMigrationComplete;
        this.state = {
            workId: '',
            workTitle: '',
            epochId: '',
            chapters: this.existingChapters.map(chapter => ({
                ...chapter,
                migrate: true,
                deleteOriginal: false
            }))
        };
    }

    async render() {
        const content = `
            <div class="content-migration">
                <h2>Миграция существующего контента</h2>
                
                <div class="migration-info">
                    <p>Найдено ${this.existingChapters.length} глав для миграции в новую систему эпох.</p>
                </div>
                
                <div class="form-group">
                    <label for="work-id">ID произведения:</label>
                    <input type="text" id="work-id" value="${this.state.workId}" placeholder="Краткий идентификатор">
                    <small>Используется для папки произведения</small>
                </div>
                
                <div class="form-group">
                    <label for="work-title">Название произведения:</label>
                    <input type="text" id="work-title" value="${this.state.workTitle}" placeholder="Название произведения">
                </div>
                
                <div class="form-group">
                    <label for="migration-epoch">Эпоха:</label>
                    <select id="migration-epoch">
                        <option value="">Выберите эпоху</option>
                        ${this.epochs.map(epoch => `
                            <option value="${epoch.id}" ${this.state.epochId === epoch.id ? 'selected' : ''}>
                                ${epoch.name} (${epoch.startYear}-${epoch.endYear})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="chapters-section">
                    <h3>Главы для миграции</h3>
                    <div class="chapters-list">
                        ${this.state.chapters.map((chapter, index) => `
                            <div class="chapter-item">
                                <div class="chapter-header">
                                    <label>
                                        <input type="checkbox" class="migrate-chapter" 
                                               data-index="${index}" ${chapter.migrate ? 'checked' : ''}>
                                        <strong>Глава ${chapter.chapter}: ${chapter.title}</strong>
                                    </label>
                                </div>
                                <div class="chapter-details">
                                    <p><small>Файл: ${chapter.path}</small></p>
                                    <div class="chapter-options">
                                        <label>
                                            <input type="checkbox" class="delete-original" 
                                                   data-index="${index}" ${chapter.deleteOriginal ? 'checked' : ''}>
                                            Удалить оригинал после миграции
                                        </label>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="migration-actions">
                    <button class="select-all-btn">Выбрать все</button>
                    <button class="deselect-all-btn">Снять выбор</button>
                </div>
                
                <div class="form-actions">
                    <button class="start-migration-btn" ${this.isFormValid() ? '' : 'disabled'}>
                        Начать миграцию
                    </button>
                    <button class="cancel-migration-btn">Отмена</button>
                </div>
                
                <div class="migration-preview" style="display: none;">
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
        this.contentEl.querySelector('#work-id').addEventListener('input', (e) => {
            this.state.workId = e.target.value;
            this.updatePreview();
        });

        this.contentEl.querySelector('#work-title').addEventListener('input', (e) => {
            this.state.workTitle = e.target.value;
            this.updatePreview();
        });

        this.contentEl.querySelector('#migration-epoch').addEventListener('change', (e) => {
            this.state.epochId = e.target.value;
            this.updatePreview();
        });

        // Обработчики глав
        this.contentEl.querySelectorAll('.migrate-chapter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.state.chapters[index].migrate = e.target.checked;
                this.updatePreview();
            });
        });

        this.contentEl.querySelectorAll('.delete-original').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.state.chapters[index].deleteOriginal = e.target.checked;
            });
        });

        // Кнопки выбора
        this.contentEl.querySelector('.select-all-btn').addEventListener('click', () => {
            this.selectAllChapters();
        });

        this.contentEl.querySelector('.deselect-all-btn').addEventListener('click', () => {
            this.deselectAllChapters();
        });

        // Кнопки действий
        this.contentEl.querySelector('.start-migration-btn').addEventListener('click', async () => {
            await this.startMigration();
        });

        this.contentEl.querySelector('.cancel-migration-btn').addEventListener('click', () => {
            this.close();
        });
    }

    selectAllChapters() {
        this.state.chapters.forEach(chapter => {
            chapter.migrate = true;
        });
        this.updateChapterCheckboxes();
        this.updatePreview();
    }

    deselectAllChapters() {
        this.state.chapters.forEach(chapter => {
            chapter.migrate = false;
        });
        this.updateChapterCheckboxes();
        this.updatePreview();
    }

    updateChapterCheckboxes() {
        this.contentEl.querySelectorAll('.migrate-chapter').forEach((checkbox, index) => {
            checkbox.checked = this.state.chapters[index].migrate;
        });
    }

    updatePreview() {
        const previewEl = this.contentEl.querySelector('.migration-preview');
        const previewContent = this.contentEl.querySelector('.preview-content');
        
        if (this.isFormValid()) {
            const selectedEpoch = this.epochs.find(e => e.id === this.state.epochId);
            const selectedChapters = this.state.chapters.filter(c => c.migrate);
            
            const preview = `
                <div class="preview-item">
                    <strong>Произведение:</strong> ${this.state.workTitle}
                </div>
                <div class="preview-item">
                    <strong>ID:</strong> ${this.state.workId}
                </div>
                <div class="preview-item">
                    <strong>Эпоха:</strong> ${selectedEpoch ? selectedEpoch.name : ''}
                </div>
                <div class="preview-item">
                    <strong>Глав для миграции:</strong> ${selectedChapters.length} из ${this.state.chapters.length}
                </div>
                <div class="preview-item">
                    <strong>Папка назначения:</strong> 1_Рукопись/Произведения/${this.state.workId}/Главы/
                </div>
                <div class="preview-item">
                    <strong>Главы:</strong>
                    <ul>
                        ${selectedChapters.map(chapter => `
                            <li>Глава ${chapter.chapter}: ${chapter.title}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
            
            previewContent.innerHTML = preview;
            previewEl.style.display = 'block';
        } else {
            previewEl.style.display = 'none';
        }
    }

    isFormValid() {
        return this.state.workId.trim() !== '' &&
               this.state.workTitle.trim() !== '' &&
               this.state.epochId !== '' &&
               this.state.chapters.some(c => c.migrate);
    }

    async startMigration() {
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

            const migrationData = {
                workId: this.state.workId.trim(),
                workTitle: this.state.workTitle.trim(),
                epochId: this.state.epochId,
                epoch: selectedEpoch.name,
                chapters: this.state.chapters.filter(c => c.migrate)
            };

            console.log('Начало миграции:', migrationData);

            if (this.onMigrationComplete) {
                await this.onMigrationComplete(migrationData);
            }

            this.close();
            
        } catch (error) {
            console.error('Ошибка при начале миграции:', error);
        }
    }
}

module.exports = { ContentMigrationModal };
