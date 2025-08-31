/**
 * @file       EpochSelectorModal.js
 * @description Модальное окно для выбора и управления эпохами
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, HtmlWizardModal
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class EpochSelectorModal extends HtmlWizardModal {
    constructor(app, plugin) {
        super(app, Modal, Notice);
        this.plugin = plugin;
        this.epochs = [];
        this.activeEpoch = null;
        this.onEpochSelect = null;
    }

    async onOpen() {
        await this.loadEpochs();
        this.render();
    }

    async loadEpochs() {
        try {
            // Проверяем, что plugin доступен
            if (!this.plugin) {
                console.warn('Plugin not available');
                this.epochs = [];
                return;
            }

            // Автоматически определяем корень проекта, как это делают другие визарды
            let projectRoot = '';
            
            // Сначала пробуем получить из настроек
            if (this.plugin.settings && this.plugin.settings.projectRoot) {
                projectRoot = this.plugin.settings.projectRoot;
            }
            
            // Если не найден в настройках, ищем автоматически
            if (!projectRoot) {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (activeFile) {
                    projectRoot = findProjectRoot(this.plugin.app, activeFile.parent.path);
                }
            }
            
            // Если всё ещё не найден, берём первый доступный проект
            if (!projectRoot) {
                const allFiles = this.plugin.app.vault.getMarkdownFiles();
                const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
                const projects = projectFiles.map(f => f.parent.path);
                if (projects.length > 0) {
                    projectRoot = projects[0];
                }
            }

            if (!projectRoot) {
                console.warn('Project root not found');
                this.epochs = [];
                this.showNoProjectMessage();
                return;
            }

            // Создаём TimelineService с правильным projectRoot
            const timelineService = new (require('../src/TimelineService').TimelineService)(this.plugin);
            const originalProjectRoot = this.plugin.settings.projectRoot; // Сохраняем оригинальный projectRoot
            this.plugin.settings.projectRoot = projectRoot; // Временно устанавливаем projectRoot
            
            try {
                this.epochs = await timelineService.getEpochs(projectRoot);
                
                // Если эпох нет (файл не существует), создаём дефолтные
                if (this.epochs.length === 0) {
                    console.log('No epochs found, creating default timeline...');
                    const defaultEpochs = [
                        {
                            id: 'default-epoch',
                            name: 'Основная эпоха',
                            startYear: 0,
                            endYear: 1000,
                            description: 'Основная эпоха мира',
                            active: true
                        }
                    ];
                    
                    // Сохраняем дефолтные эпохи
                    const result = await timelineService.saveEpochs(defaultEpochs, projectRoot);
                    if (result.success) {
                        this.epochs = defaultEpochs;
                        console.log('Default epochs created successfully');
                    } else {
                        console.error('Failed to create default epochs:', result.error);
                    }
                }
            } finally {
                // Восстанавливаем оригинальный projectRoot
                this.plugin.settings.projectRoot = originalProjectRoot;
            }
            
            // Найти активную эпоху
            this.activeEpoch = this.epochs.find(epoch => epoch.active) || this.epochs[0];
            
        } catch (error) {
            console.error('Error loading epochs:', error);
            this.epochs = [];
        }
    }

    showNoProjectMessage() {
        const content = `
            <div class="epoch-selector">
                <h2>Выбор эпохи</h2>
                <div class="no-project-message">
                    <p><strong>Проект не найден</strong></p>
                    <p>Для работы с эпохами необходимо найти папку с файлом "Настройки_мира.md".</p>
                    <p>Убедитесь, что вы находитесь в папке проекта или откройте файл из проекта.</p>
                    <button class="close-modal-btn">Закрыть</button>
                </div>
            </div>
        `;
        this.contentEl.innerHTML = content;
        
        // Добавляем обработчик для кнопки закрытия
        this.contentEl.querySelector('.close-modal-btn').addEventListener('click', () => {
            this.close();
        });
    }

    async render() {
        const content = `
            <div class="epoch-selector">
                <h2>Выбор эпохи</h2>
                
                ${this.epochs.length === 0 ? `
                    <div class="no-epochs-message">
                        <p><strong>Эпохи не найдены</strong></p>
                        <p>Создайте первую эпоху для вашего мира.</p>
                    </div>
                ` : `
                    <div class="epoch-list">
                        ${this.epochs.map(epoch => `
                            <div class="epoch-item ${epoch.id === this.activeEpoch?.id ? 'active' : ''}" 
                                 data-epoch-id="${epoch.id}">
                                <div class="epoch-header">
                                    <h3>${epoch.name}</h3>
                                    ${epoch.active ? '<span class="active-badge">Активна</span>' : ''}
                                </div>
                                <div class="epoch-details">
                                    <p><strong>Период:</strong> ${epoch.startYear} - ${epoch.endYear}</p>
                                    <p>${epoch.description}</p>
                                </div>
                                <div class="epoch-actions">
                                    <button class="select-epoch-btn" data-epoch-id="${epoch.id}">
                                        Выбрать
                                    </button>
                                    <button class="edit-epoch-btn" data-epoch-id="${epoch.id}">
                                        Редактировать
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                
                <div class="epoch-actions-global">
                    <button class="create-epoch-btn">${this.epochs.length === 0 ? 'Создать первую эпоху' : 'Создать новую эпоху'}</button>
                    <button class="close-modal-btn">Закрыть</button>
                </div>
            </div>
        `;

        this.contentEl.innerHTML = content;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Выбор эпохи
        this.contentEl.querySelectorAll('.select-epoch-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const epochId = e.target.dataset.epochId;
                await this.selectEpoch(epochId);
            });
        });

        // Редактирование эпохи
        this.contentEl.querySelectorAll('.edit-epoch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const epochId = e.target.dataset.epochId;
                this.editEpoch(epochId);
            });
        });

        // Создание новой эпохи
        this.contentEl.querySelector('.create-epoch-btn').addEventListener('click', () => {
            this.createNewEpoch();
        });

        // Закрытие модального окна
        this.contentEl.querySelector('.close-modal-btn').addEventListener('click', () => {
            this.close();
        });
    }

    async selectEpoch(epochId) {
        try {
            const epoch = this.epochs.find(e => e.id === epochId);
            if (!epoch) {
                console.error('Epoch not found:', epochId);
                return;
            }

            // Обновить активную эпоху
            const timelineService = new (require('../src/TimelineService').TimelineService)(this.plugin);
            
            // Сделать все эпохи неактивными
            for (const e of this.epochs) {
                e.active = false;
            }
            
            // Сделать выбранную эпоху активной
            epoch.active = true;
            
            // Сохранить изменения
            await timelineService.saveEpochs(this.epochs);
            
            this.activeEpoch = epoch;
            
            // Вызвать callback если есть
            if (this.onEpochSelect) {
                this.onEpochSelect(epoch);
            }
            
            // Обновить UI
            await this.render();
            
            console.log('Epoch selected:', epoch.name);
            
        } catch (error) {
            console.error('Error selecting epoch:', error);
        }
    }

    editEpoch(epochId) {
        const epoch = this.epochs.find(e => e.id === epochId);
        if (!epoch) {
            console.error('Epoch not found:', epochId);
            return;
        }

        // Открыть модальное окно редактирования
        const editModal = new EpochEditModal(this.app, this.plugin, epoch, async (updatedEpoch) => {
            // Обновить эпоху в списке
            const index = this.epochs.findIndex(e => e.id === epochId);
            if (index !== -1) {
                this.epochs[index] = updatedEpoch;
                await this.render();
            }
        });
        editModal.open();
    }

    createNewEpoch() {
        const newEpoch = {
            id: '',
            name: '',
            startYear: 0,
            endYear: 0,
            description: '',
            active: false
        };

        const createModal = new EpochEditModal(this.app, this.plugin, newEpoch, async (createdEpoch) => {
            // Добавить новую эпоху в список
            this.epochs.push(createdEpoch);
            await this.render();
        });
        createModal.open();
    }
}

class EpochEditModal extends HtmlWizardModal {
    constructor(app, plugin, epoch, onSave) {
        super(app, Modal, Notice);
        this.plugin = plugin;
        this.epoch = { ...epoch };
        this.onSave = onSave;
    }

    onOpen() {
        this.render();
    }

    async render() {
        const isNew = !this.epoch.id;
        const content = `
            <div class="epoch-edit">
                <h2>${isNew ? 'Создание новой эпохи' : 'Редактирование эпохи'}</h2>
                
                <div class="form-group">
                    <label for="epoch-id">ID эпохи:</label>
                    <input type="text" id="epoch-id" value="${this.epoch.id}" ${isNew ? '' : 'readonly'}>
                </div>
                
                <div class="form-group">
                    <label for="epoch-name">Название:</label>
                    <input type="text" id="epoch-name" value="${this.epoch.name}">
                </div>
                
                <div class="form-group">
                    <label for="epoch-start">Начальный год:</label>
                    <input type="number" id="epoch-start" value="${this.epoch.startYear}">
                </div>
                
                <div class="form-group">
                    <label for="epoch-end">Конечный год:</label>
                    <input type="number" id="epoch-end" value="${this.epoch.endYear}">
                </div>
                
                <div class="form-group">
                    <label for="epoch-description">Описание:</label>
                    <textarea id="epoch-description">${this.epoch.description}</textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="epoch-active" ${this.epoch.active ? 'checked' : ''}>
                        Активная эпоха
                    </label>
                </div>
                
                <div class="form-actions">
                    <button class="save-epoch-btn">Сохранить</button>
                    <button class="cancel-epoch-btn">Отмена</button>
                </div>
            </div>
        `;

        this.contentEl.innerHTML = content;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.contentEl.querySelector('.save-epoch-btn').addEventListener('click', async () => {
            await this.saveEpoch();
        });

        this.contentEl.querySelector('.cancel-epoch-btn').addEventListener('click', () => {
            this.close();
        });
    }

    async saveEpoch() {
        try {
            // Собрать данные из формы
            const updatedEpoch = {
                id: this.contentEl.querySelector('#epoch-id').value.trim(),
                name: this.contentEl.querySelector('#epoch-name').value.trim(),
                startYear: parseInt(this.contentEl.querySelector('#epoch-start').value),
                endYear: parseInt(this.contentEl.querySelector('#epoch-end').value),
                description: this.contentEl.querySelector('#epoch-description').value.trim(),
                active: this.contentEl.querySelector('#epoch-active').checked
            };

            console.log('Saving epoch:', updatedEpoch);

            // Валидация
            if (!updatedEpoch.id || !updatedEpoch.name) {
                console.error('ID и название эпохи обязательны');
                return;
            }

            if (updatedEpoch.startYear >= updatedEpoch.endYear) {
                console.error('Начальный год должен быть меньше конечного');
                return;
            }

            // Определить projectRoot так же, как в основном модальном окне
            let projectRoot = '';
            if (this.plugin.settings && this.plugin.settings.projectRoot) {
                projectRoot = this.plugin.settings.projectRoot;
            }
            if (!projectRoot) {
                const activeFile = this.plugin.app.workspace.getActiveFile();
                if (activeFile) {
                    projectRoot = findProjectRoot(this.plugin.app, activeFile.parent.path);
                }
            }
            if (!projectRoot) {
                const allFiles = this.plugin.app.vault.getMarkdownFiles();
                const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
                const projects = projectFiles.map(f => f.parent.path);
                if (projects.length > 0) {
                    projectRoot = projects[0];
                }
            }

            if (!projectRoot) {
                console.error('Project root not found for saving epoch');
                return;
            }

            console.log('Using project root for saving:', projectRoot);

            // Временно установить projectRoot для TimelineService
            const originalProjectRoot = this.plugin.settings.projectRoot;
            this.plugin.settings.projectRoot = projectRoot;
            
            try {
                // Получить текущие эпохи
                const timelineService = new (require('../src/TimelineService').TimelineService)(this.plugin);
                let currentEpochs = await timelineService.getEpochs(projectRoot);
                
                // Если эпох нет, создаём пустой массив
                if (!currentEpochs || currentEpochs.length === 0) {
                    currentEpochs = [];
                }
                
                // Найти существующую эпоху или добавить новую
                const index = currentEpochs.findIndex(e => e.id === updatedEpoch.id);
                if (index !== -1) {
                    currentEpochs[index] = updatedEpoch;
                    console.log('Updating existing epoch at index:', index);
                } else {
                    currentEpochs.push(updatedEpoch);
                    console.log('Adding new epoch to list');
                }
                
                // Сохранить обновлённый список
                const result = await timelineService.saveEpochs(currentEpochs, projectRoot);
                console.log('Save result:', result);
                
                if (result.success) {
                    if (this.onSave) {
                        this.onSave(updatedEpoch);
                    }
                    this.close();
                } else {
                    console.error('Failed to save epoch:', result.error);
                }
            } finally {
                this.plugin.settings.projectRoot = originalProjectRoot;
            }
            
        } catch (error) {
            console.error('Error saving epoch:', error);
        }
    }
}

module.exports = { EpochSelectorModal, EpochEditModal };

if (typeof window !== 'undefined') {
    window.EpochSelectorModal = EpochSelectorModal;
    window.EpochEditModal = EpochEditModal;
}
