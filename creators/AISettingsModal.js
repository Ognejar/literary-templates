/**
 * @file       creators/AISettingsModal.js
 * @description Модальное окно для настройки AI сервисов, провайдеров, моделей и ключей
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies Modal, Setting, Notice, AIProviderService, KeyRotationService
 * @created    2025-08-17
 * @updated    2025-08-17
 * @docs       docs/Карточка функционала.md
 */

const { AIProviderService } = require('../src/AIProviderService.js');
const { KeyRotationService } = require('../src/KeyRotationService.js');

var AISettingsModal = class extends Modal {
    constructor(app, Modal, Setting, Notice, plugin) {
        super(app);
        this.Modal = Modal;
        this.Setting = Setting;
        this.Notice = Notice;
        this.plugin = plugin;
        this.aiService = new AIProviderService(plugin);
        this.keyService = new KeyRotationService(plugin);
        
        // Настройки по умолчанию
        this.settings = {
            defaultProvider: 'openrouter',
            defaultModel: 'deepseek/deepseek-chat-v3-0324:free',
            maxTokens: 2000,
            temperature: 0.7,
            retries: 3,
            autoRotateKeys: true
        };
        
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const saved = this.plugin.settings.aiSettings || {};
            this.settings = { ...this.settings, ...saved };
        } catch (error) {
            console.error('Ошибка загрузки настроек AI:', error);
        }
    }

    async saveSettings() {
        try {
            this.plugin.settings.aiSettings = this.settings;
            await this.plugin.saveSettings();
            new this.Notice('Настройки AI сохранены');
        } catch (error) {
            console.error('Ошибка сохранения настроек AI:', error);
            new this.Notice('Ошибка сохранения настроек');
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('ai-settings-modal');

        // Заголовок
        contentEl.createEl('h2', { text: 'Настройки AI сервисов' });

        // Основные настройки
        this.createGeneralSettings(contentEl);
        
        // Настройки ключей
        this.createKeySettings(contentEl);
        
        // Настройки провайдеров
        this.createProviderSettings(contentEl);
        
        // Настройки моделей
        this.createModelSettings(contentEl);
        
        // Кнопки действий
        this.createActionButtons(contentEl);
    }

    createGeneralSettings(container) {
        container.createEl('h3', { text: 'Основные настройки' });

        // Провайдер по умолчанию
        new this.Setting(container)
            .setName('Провайдер по умолчанию')
            .setDesc('Выберите основной AI провайдер')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('openrouter', 'OpenRouter (рекомендуется)')
                    .addOption('ollama', 'Ollama (локальные модели)')
                    .addOption('huggingface', 'HuggingFace (бесплатные модели)')
                    .addOption('local', 'Локальные модели (в разработке)')
                    .setValue(this.settings.defaultProvider)
                    .onChange(async (value) => {
                        this.settings.defaultProvider = value;
                        await this.saveSettings();
                    });
            });

        // Максимальное количество токенов
        new this.Setting(container)
            .setName('Максимум токенов')
            .setDesc('Максимальное количество токенов для генерации')
            .addSlider(slider => {
                slider
                    .setLimits(100, 8000, 100)
                    .setValue(this.settings.maxTokens)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.settings.maxTokens = value;
                        await this.saveSettings();
                    });
            });

        // Температура
        new this.Setting(container)
            .setName('Температура')
            .setDesc('Контролирует креативность ответов (0.0 = детерминированный, 1.0 = очень креативный)')
            .addSlider(slider => {
                slider
                    .setLimits(0.0, 1.0, 0.1)
                    .setValue(this.settings.temperature)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.settings.temperature = value;
                        await this.saveSettings();
                    });
            });

        // Количество попыток
        new this.Setting(container)
            .setName('Количество попыток')
            .setDesc('Сколько раз повторять запрос при ошибке')
            .addSlider(slider => {
                slider
                    .setLimits(1, 5, 1)
                    .setValue(this.settings.retries)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.settings.retries = value;
                        await this.saveSettings();
                    });
            });

        // Автоматическая ротация ключей
        new this.Setting(container)
            .setName('Автоматическая ротация ключей')
            .setDesc('Автоматически переключаться на следующий ключ при исчерпании')
            .addToggle(toggle => {
                toggle
                    .setValue(this.settings.autoRotateKeys)
                    .onChange(async (value) => {
                        this.settings.autoRotateKeys = value;
                        await this.saveSettings();
                    });
            });
    }

    createKeySettings(container) {
        container.createEl('h3', { text: 'Управление ключами API' });

        // Добавление нового ключа
        const addKeyContainer = container.createDiv('add-key-container');
        new this.Setting(addKeyContainer)
            .setName('Добавить новый ключ')
            .setDesc('Введите ключ API для OpenRouter')
            .addText(text => {
                text.setPlaceholder('sk-or-v1-...')
                    .onChange(async (value) => {
                        if (value && value.startsWith('sk-or-')) {
                            try {
                                await this.keyService.addKey(value);
                                text.setValue('');
                                this.refreshKeyList();
                                new this.Notice('Ключ добавлен успешно');
                            } catch (error) {
                                new this.Notice('Ошибка добавления ключа: ' + error.message);
                            }
                        }
                    });
            });

        // Список существующих ключей
        this.createKeyList(container);

        // Статистика использования
        this.createKeyStats(container);
    }

    createKeyList(container) {
        const keyListContainer = container.createDiv('key-list-container');
        keyListContainer.createEl('h4', { text: 'Настроенные ключи' });

        this.refreshKeyList();
    }

    refreshKeyList() {
        const keyListContainer = this.contentEl.querySelector('.key-list-container');
        if (!keyListContainer) return;

        // Очищаем список ключей (кроме заголовка)
        const existingList = keyListContainer.querySelector('.key-list');
        if (existingList) existingList.remove();

        const keyList = keyListContainer.createDiv('key-list');
        const stats = this.keyService.getKeyStats();

        if (stats.length === 0) {
            keyList.createEl('p', { text: 'Нет настроенных ключей', cls: 'no-keys' });
            return;
        }

        stats.forEach((keyStat, index) => {
            const keyItem = keyList.createDiv('key-item');
            
            // Информация о ключе
            const keyInfo = keyItem.createDiv('key-info');
            keyInfo.createEl('span', { 
                text: `Ключ ${index + 1}: ${keyStat.key}`, 
                cls: keyStat.isActive ? 'active-key' : '' 
            });
            
            if (keyStat.isActive) {
                keyInfo.createEl('span', { text: ' (активный)', cls: 'active-badge' });
            }

            // Прогресс использования
            const progressContainer = keyItem.createDiv('progress-container');
            const progressBar = progressContainer.createDiv('progress-bar');
            progressBar.style.width = `${keyStat.percentage}%`;
            progressBar.addClass(keyStat.isExhausted ? 'exhausted' : keyStat.percentage >= 80 ? 'warning' : 'normal');
            
            progressContainer.createEl('span', { 
                text: `${keyStat.used}/${keyStat.limit} токенов (${keyStat.percentage}%)`,
                cls: 'progress-text'
            });

            // Кнопки управления
            const keyActions = keyItem.createDiv('key-actions');
            
            // Кнопка удаления
            keyActions.createEl('button', { 
                text: 'Удалить', 
                cls: 'mod-warning' 
            }).onclick = async () => {
                try {
                    await this.keyService.removeKey(index);
                    this.refreshKeyList();
                    new this.Notice('Ключ удален');
                } catch (error) {
                    new this.Notice('Ошибка удаления: ' + error.message);
                }
            };

            // Кнопка тестирования
            keyActions.createEl('button', { 
                text: 'Тест', 
                cls: 'mod-success' 
            }).onclick = async () => {
                try {
                    const result = await this.keyService.testConnection();
                    if (result.success) {
                        new this.Notice('Ключ работает корректно');
                    } else {
                        new this.Notice('Ошибка ключа: ' + result.message);
                    }
                } catch (error) {
                    new this.Notice('Ошибка тестирования: ' + error.message);
                }
            };
        });
    }

    createKeyStats(container) {
        const statsContainer = container.createDiv('key-stats-container');
        statsContainer.createEl('h4', { text: 'Статистика и предупреждения' });

        const warnings = this.keyService.getWarnings();
        if (warnings.length > 0) {
            warnings.forEach(warning => {
                statsContainer.createEl('p', { 
                    text: `⚠️ ${warning}`, 
                    cls: 'warning-text' 
                });
            });
        } else {
            statsContainer.createEl('p', { 
                text: '✅ Все ключи работают корректно', 
                cls: 'success-text' 
            });
        }
    }

    createProviderSettings(container) {
        container.createEl('h3', { text: 'Настройки провайдеров' });

        // OpenRouter настройки
        new this.Setting(container)
            .setName('OpenRouter API')
            .setDesc('Настройки для OpenRouter провайдера')
            .addButton(button => {
                button
                    .setButtonText('Тестировать соединение')
                    .onClick(async () => {
                        try {
                            const result = await this.aiService.testProvider('openrouter');
                            if (result.success) {
                                new this.Notice('OpenRouter доступен: ' + result.message);
                            } else {
                                new this.Notice('Ошибка OpenRouter: ' + result.message);
                            }
                        } catch (error) {
                            new this.Notice('Ошибка тестирования: ' + error.message);
                        }
                    });
            });

        // Ollama настройки
        new this.Setting(container)
            .setName('Ollama (локальные модели)')
            .setDesc('Тестирование подключения к Ollama (должен быть запущен на localhost:11434)')
            .addButton(button => {
                button
                    .setButtonText('Тестировать Ollama')
                    .onClick(async () => {
                        try {
                            const result = await this.aiService.testProvider('ollama');
                            if (result.success) {
                                new this.Notice('Ollama доступен: ' + result.message);
                            } else {
                                new this.Notice('Ошибка Ollama: ' + result.message);
                            }
                        } catch (error) {
                            new this.Notice('Ошибка тестирования Ollama: ' + error.message);
                        }
                    });
            });

        // HuggingFace настройки
        new this.Setting(container)
            .setName('HuggingFace Inference API')
            .setDesc('Тестирование подключения к HuggingFace (требует API ключ)')
            .addButton(button => {
                button
                    .setButtonText('Тестировать HuggingFace')
                    .onClick(async () => {
                        try {
                            const result = await this.aiService.testProvider('huggingface');
                            if (result.success) {
                                new this.Notice('HuggingFace доступен: ' + result.message);
                            } else {
                                new this.Notice('Ошибка HuggingFace: ' + result.message);
                            }
                        } catch (error) {
                            new this.Notice('Ошибка тестирования HuggingFace: ' + error.message);
                        }
                    });
            });

        // Локальные модели (заглушка)
        new this.Setting(container)
            .setName('Локальные модели')
            .setDesc('Интеграция с LM Studio и другими локальными провайдерами')
            .addButton(button => {
                button
                    .setButtonText('В разработке')
                    .setDisabled(true);
            });
    }

    async createModelSettings(container) {
        container.createEl('h3', { text: 'Настройки моделей' });

        // Контейнер для autocomplete
        const modelSetting = new this.Setting(container)
            .setName('Модель по умолчанию')
            .setDesc('Начните вводить название или вставьте ID модели. Бесплатные модели помечены 🆓.');

        // Поле ввода
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Загрузка моделей...';
        input.style.width = '100%';
        input.value = this.settings.defaultModel || '';
        modelSetting.controlEl.appendChild(input);

        // Кнопка тестирования модели
        const testButton = document.createElement('button');
        testButton.textContent = 'Тест модели';
        testButton.className = 'mod-success';
        testButton.style.marginLeft = '8px';
        testButton.style.padding = '4px 8px';
        testButton.style.fontSize = '12px';
        testButton.onclick = async () => {
            const modelId = input.value.trim();
            if (!modelId) {
                new this.Notice('Введите ID модели для тестирования');
                return;
            }
            
            testButton.disabled = true;
            testButton.textContent = 'Тестирование...';
            
            try {
                const result = await this.aiService.testModel(modelId);
                if (result.success) {
                    new this.Notice(`✅ Модель ${modelId} работает корректно`);
                } else {
                    new this.Notice(`❌ Ошибка модели ${modelId}: ${result.message}`);
                }
            } catch (error) {
                new this.Notice(`❌ Ошибка тестирования: ${error.message}`);
            } finally {
                testButton.disabled = false;
                testButton.textContent = 'Тест модели';
            }
        };
        modelSetting.controlEl.appendChild(testButton);

        // Контейнер для выпадающего списка
        const dropdown = document.createElement('div');
        dropdown.className = 'ai-models-autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.zIndex = '9999';
        dropdown.style.background = 'var(--background-primary)';
        dropdown.style.border = '1px solid var(--background-modifier-border)';
        dropdown.style.borderRadius = '8px';
        dropdown.style.maxHeight = '250px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.display = 'none';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.right = '0';
        dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        // Делаем контейнер relative для правильного позиционирования dropdown
        modelSetting.controlEl.style.position = 'relative';
        modelSetting.controlEl.appendChild(dropdown);

        // Список моделей (загружается через API)
        let allModels = [];
        let filteredModels = [];
        let freeModels = new Set();
        let lastQuery = '';
        let modelsLoaded = false;

        // Функция для загрузки моделей
        const loadModels = async () => {
            try {
                allModels = await this.aiService.getAvailableModels();
                // Улучшенная логика определения бесплатных моделей
                freeModels = new Set();
                allModels.forEach(m => {
                    if (m.id) {
                        // Проверяем различные признаки бесплатных моделей
                        const isFree = 
                            m.id.endsWith(':free') ||
                            m.id.includes('phi') ||
                            m.id.includes('nous') ||
                            m.id.includes('deepseek') ||
                            m.id.includes('mistral') ||
                            m.id.includes('llama') ||
                            (m.pricing && m.pricing.input === '0' && m.pricing.output === '0') ||
                            (m.pricing && m.pricing.input === 0 && m.pricing.output === 0) ||
                            (m.description && m.description.toLowerCase().includes('free')) ||
                            (m.name && m.name.toLowerCase().includes('free'));
                        
                        if (isFree) {
                            freeModels.add(m.id);
                        }
                    }
                });
                filteredModels = allModels;
                modelsLoaded = true;
                // Обновляем placeholder после загрузки
                input.placeholder = 'Начните вводить название или ID модели. Бесплатные модели помечены 🆓.';
            } catch (e) {
                console.error('Ошибка загрузки моделей:', e);
                input.placeholder = 'Ошибка загрузки моделей. Попробуйте обновить список.';
            }
        };

        // Фильтрация моделей по подстроке
        const filterModels = (query) => {
            if (!query) return allModels.slice(0, 30); // первые 30
            const q = query.toLowerCase();
            return allModels.filter(m => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q))).slice(0, 30);
        };

        // Рендер выпадающего списка
        const renderDropdown = () => {
            dropdown.innerHTML = '';
            if (!filteredModels.length) {
                dropdown.innerHTML = '<div style="padding:8px;">Нет совпадений</div>';
                return;
            }
            filteredModels.forEach(m => {
                const option = document.createElement('div');
                option.className = 'ai-models-autocomplete-option';
                option.style.padding = '8px';
                option.style.cursor = 'pointer';
                option.style.display = 'flex';
                option.style.alignItems = 'center';
                option.style.gap = '8px';
                option.onmouseenter = () => option.style.background = 'var(--background-secondary)';
                option.onmouseleave = () => option.style.background = '';
                option.onclick = () => {
                    input.value = m.id;
                    this.settings.defaultModel = m.id;
                    this.saveSettings();
                    dropdown.style.display = 'none';
                };
                if (freeModels.has(m.id)) {
                    const free = document.createElement('span');
                    free.textContent = '🆓';
                    free.title = 'Бесплатная модель';
                    option.appendChild(free);
                }
                const label = document.createElement('span');
                label.textContent = m.id + (m.name ? ` (${m.name})` : '');
                option.appendChild(label);
                dropdown.appendChild(option);
            });
        };

        // События для input
        input.addEventListener('focus', () => {
            if (modelsLoaded) {
                filteredModels = filterModels(input.value);
                renderDropdown();
                dropdown.style.display = 'block';
            } else {
                // Если модели еще не загружены, показываем сообщение
                dropdown.innerHTML = '<div style="padding:8px;">Загрузка моделей...</div>';
                dropdown.style.display = 'block';
            }
        });
        input.addEventListener('input', () => {
            if (modelsLoaded) {
                filteredModels = filterModels(input.value);
                renderDropdown();
                dropdown.style.display = 'block';
            }
        });
        input.addEventListener('blur', () => {
            // Увеличиваем задержку, чтобы пользователь успел кликнуть на опцию
            setTimeout(() => { 
                dropdown.style.display = 'none'; 
            }, 300);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.settings.defaultModel = input.value;
                this.saveSettings();
                dropdown.style.display = 'none';
            }
        });

        // Кнопка обновления списка моделей
        new this.Setting(container)
            .setName('Обновить список моделей')
            .setDesc('Получить актуальный список доступных моделей от OpenRouter')
            .addButton(button => {
                button
                    .setButtonText('Обновить')
                    .onClick(async () => {
                        modelsLoaded = false;
                        input.placeholder = 'Обновление списка моделей...';
                        await loadModels();
                        new this.Notice('Список моделей обновлён');
                    });
            });

        // Загрузить модели при открытии
        await loadModels();
    }

    createActionButtons(container) {
        const buttonContainer = container.createDiv('action-buttons');
        
        // Кнопка сохранения
        buttonContainer.createEl('button', { 
            text: 'Сохранить настройки', 
            cls: 'mod-cta' 
        }).onclick = async () => {
            await this.saveSettings();
        };

        // Кнопка закрытия
        buttonContainer.createEl('button', { 
            text: 'Закрыть', 
            cls: 'mod-warning' 
        }).onclick = () => {
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
};

module.exports = { AISettingsModal };
