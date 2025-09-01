/**
 * @file       EntityWizardBase.js
 * @description Базовый класс мастеров сущностей: стили, безопасные статусы, утилиты для полей
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies HtmlWizardModal
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

const { HtmlWizardModal } = require('./HtmlWizardModal');
const { TFile } = require('obsidian');

/**
 * Базовый класс для мастеров создания сущностей
 * Предоставляет общие методы для работы с UI, фильтрации и анализа контента
 */
class EntityWizardBase extends HtmlWizardModal {
    
    /**
     * Конструктор базового класса
     * @param {Object} app - экземпляр приложения Obsidian
     * @param {Function} ModalClass - класс модального окна
     * @param {Function} SettingClass - класс настройки
     * @param {Function} NoticeClass - класс уведомлений
     */
    constructor(app, ModalClass, SettingClass, NoticeClass) {
        super(app, ModalClass, NoticeClass);
        this.Setting = SettingClass;
    }

    /**
     * Применяет базовые стили UI к модальному окну
     */
    applyBaseUI() {
        try { 
            this.applyBaseStyles(); 
        } catch (error) {
            console.warn('Не удалось применить базовые стили:', error);
        }
    }

    /**
     * Обеспечивает наличие стандартных статусов, если не предоставлены свои
     * @param {Array} statuses - массив статусов для проверки
     * @returns {Array} - массив статусов (стандартные или предоставленные)
     */
    ensureStatuses(statuses) {
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ];
        }
        return statuses;
    }

    /**
     * Добавляет опции в выпадающий список
     * @param {Object} dropdown - объект выпадающего списка
     * @param {Array} options - массив опций (строки или объекты {value, label, icon})
     */
    addDropdownOptions(dropdown, options) {
        (options || []).forEach(opt => {
            if (typeof opt === 'string') {
                dropdown.addOption(opt, opt);
            } else if (opt && typeof opt === 'object' && opt.value !== undefined) {
                const displayText = `${opt.icon ? opt.icon + ' ' : ''}${opt.label || opt.value}`;
                dropdown.addOption(opt.value, displayText);
            }
        });
    }

    /**
     * Создает текстовое поле ввода
     * @param {HTMLElement} container - контейнер для поля
     * @param {string} name - название поля
     * @param {string} value - начальное значение
     * @param {Function} onChange - обработчик изменения
     */
    addTextInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addText(text => {
                text.setValue(value || '');
                text.onChange(onChange);
            });
    }

    /**
     * Создает многострочное текстовое поле
     * @param {HTMLElement} container - контейнер для поля
     * @param {string} name - название поля
     * @param {string} value - начальное значение
     * @param {Function} onChange - обработчик изменения
     */
    addTextAreaInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addTextArea(textArea => {
                textArea.setValue(value || '');
                textArea.onChange(onChange);
            });
    }

    /**
     * Создает выпадающий список
     * @param {HTMLElement} container - контейнер для списка
     * @param {string} name - название списка
     * @param {string} value - выбранное значение
     * @param {Array} options - массив опций
     * @param {Function} onChange - обработчик изменения
     */
    addDropdownInput(container, name, value, options, onChange) {
        new this.Setting(container)
            .setName(name)
            .addDropdown(dropdown => {
                options.forEach(opt => dropdown.addOption(opt, opt));
                dropdown.setValue(value || '');
                dropdown.onChange(onChange);
            });
    }

    /**
     * Загружает файлы из папки, исключая файлы-управляющие
     * @param {string} folderPath - путь к папке
     * @param {string} excludeName - имя файла для исключения (обычно совпадает с именем папки)
     * @returns {string[]} - массив имён файлов
     */
    loadFilesFromFolder(folderPath, excludeName = null) {
        const folderObj = this.app.vault.getAbstractFileByPath(folderPath);
        let files = [];
        
        // Основной способ — напрямую из детей папки
        if (folderObj && Array.isArray(folderObj.children) && folderObj.children.length > 0) {
            for (const child of folderObj.children) {
                if (child.extension === 'md' &&
                    !child.basename.startsWith('.') &&
                    (!excludeName || child.basename !== excludeName)) {
                    files.push(child.basename);
                }
            }
        }
        
        // Фолбэк — скан всех markdown-файлов по точному пути родителя
        if (files.length === 0) {
            const allMd = this.app.vault.getMarkdownFiles() || [];
            for (const f of allMd) {
                if (f.parent && f.parent.path === folderPath) {
                    if (!excludeName || f.basename !== excludeName) {
                        files.push(f.basename);
                    }
                }
            }
        }
        
        return files;
    }

    /**
     * Экранирует специальные символы для использования в регулярных выражениях
     * @param {string} string - строка для экранирования
     * @returns {string} - экранированная строка
     */
    escapeRegex(string) {
        return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

/**
 * Фильтрует провинции по принадлежности к государству
 * Ищет совпадения в фронтматтере (поля state/country) и wiki-ссылках
 * @param {string} stateName - название государства
 * @param {string} projectRoot - корневая папка проекта
 * @param {string[]} allProvinces - массив всех провинций
 * @returns {Promise<string[]>} - отфильтрованный массив провинций
 */
async filterProvincesByState(stateName, projectRoot, allProvinces) {
    // Валидация входных параметров
    if (!stateName || !projectRoot || !Array.isArray(allProvinces)) {
        console.warn('Неверные параметры для фильтрации провинций');
        return [];
    }

    console.log('🔍 Поиск провинций для государства:', stateName);
    console.log('📁 Путь проекта:', projectRoot);
    console.log('📊 Всего провинций для проверки:', allProvinces.length);

    // Создаем различные варианты имени государства для поиска
    const variants = [
        stateName, // оригинальное имя
        stateName.replace(/\s+/g, '_'), // с подчеркиваниями
        stateName.replace(/\s+/g, '-'), // с дефисами
        stateName.toLowerCase(), // в нижнем регистре
        stateName.replace(/\s+/g, '_').toLowerCase(), // с подчеркиваниями в нижнем регистре
        // Добавляем варианты с пробелами и подчеркиваниями в разных комбинациях
        stateName.replace(/_/g, ' '), // подчеркивания -> пробелы
        stateName.replace(/_/g, ' ').toLowerCase(), // подчеркивания -> пробелы + нижний регистр
    ];

    // Удаляем дубликаты и пустые значения
    const uniqueVariants = [...new Set(variants.filter(v => v && v.trim()))];

    console.log('🔤 Варианты поиска:', uniqueVariants);

    try {
        const filteredProvinces = [];
        let processedCount = 0;
        
        // Перебираем все провинции для проверки
        for (const provinceName of allProvinces) {
            processedCount++;
            const filePath = `${projectRoot}/Локации/Провинции/${provinceName}.md`;
            const provinceFile = this.app.vault.getAbstractFileByPath(filePath);
            
            // Пропускаем если файл не найден
            if (!provinceFile) {
                console.log(`❌ Файл не найден: ${filePath}`);
                continue;
            }
            
            try {
                const content = await this.app.vault.read(provinceFile);
                // console.log(`📄 Содержимое файла ${provinceName}:`, content.substring(0, 200) + '...');
                
                // Ищем фронтматтер в начале файла
                const fmMatch = content.match(/^---[\s\S]*?---/m);
                
                if (fmMatch) {
                    const frontmatter = fmMatch[0];
                    // console.log(`📋 Фронтматтер ${provinceName}:`, frontmatter);
                    
                    // Упрощенный поиск - ищем просто наличие значения в полях state и country
                    const stateFieldMatch = frontmatter.match(/state\s*:\s*(.*)/i);
                    const countryFieldMatch = frontmatter.match(/country\s*:\s*(.*)/i);
                    
                    // console.log(`🏛️ State поле:`, stateFieldMatch ? stateFieldMatch[1] : 'не найдено');
                    // console.log(`🇺🇳 Country поле:`, countryFieldMatch ? countryFieldMatch[1] : 'не найдено');
                    
                    // Проверяем значения полей на совпадение с любым вариантом
                    const checkFieldValue = (fieldValue) => {
                        if (!fieldValue) return false;
                        
                        // Очищаем значение от кавычек и пробелов
                        const cleanValue = fieldValue.trim().replace(/['"]/g, '');
                        
                        // Проверяем все варианты
                        return uniqueVariants.some(variant => {
                            const normalizedVariant = variant.trim();
                            const normalizedValue = cleanValue.trim();
                            
                            // console.log(`🔍 Сравниваем: "${normalizedValue}" с "${normalizedVariant}"`);
                            
                            return normalizedValue === normalizedVariant ||
                                   normalizedValue.toLowerCase() === normalizedVariant.toLowerCase();
                        });
                    };
                    
                    if (stateFieldMatch && checkFieldValue(stateFieldMatch[1])) {
                        // console.log(`✅ Провинция "${provinceName}" найдена по полю state`);
                        filteredProvinces.push(provinceName);
                        continue;
                    }
                    
                    if (countryFieldMatch && checkFieldValue(countryFieldMatch[1])) {
                        // console.log(`✅ Провинция "${provinceName}" найдена по полю country`);
                        filteredProvinces.push(provinceName);
                        continue;
                    }
                }
                
                // Дополнительно: ищем wiki-ссылки в основном контенте
                const wikiLinks = content.match(/\[\[(.*?)\]\]/g) || [];
                const hasWikiLink = wikiLinks.some(link => {
                    const linkContent = link.replace(/\[\[|\]\]/g, '');
                    return uniqueVariants.some(variant => {
                        const normalizedVariant = variant.trim();
                        const normalizedLink = linkContent.split('|')[0].trim(); // Берем только часть до |
                        
                        // console.log(`🔗 Сравниваем wiki: "${normalizedLink}" с "${normalizedVariant}"`);
                        
                        return normalizedLink === normalizedVariant ||
                               normalizedLink.toLowerCase() === normalizedVariant.toLowerCase();
                    });
                });
                
                if (hasWikiLink) {
                    // console.log(`✅ Провинция "${provinceName}" найдена по wiki-ссылке`);
                    filteredProvinces.push(provinceName);
                } else {
                    // console.log(`❌ Провинция "${provinceName}" не принадлежит государству "${stateName}"`);
                }
                
            } catch (readError) {
                console.error(`📖 Ошибка чтения файла "${provinceName}":`, readError);
            }
            
            // Логируем прогресс
            if (processedCount % 10 === 0) {
                // console.log(`📊 Обработано ${processedCount}/${allProvinces.length} провинций`);
            }
        }
        
        //console.log(`🎯 Найдено провинций: ${filteredProvinces.length}`, filteredProvinces);
        return filteredProvinces;
        
    } catch (error) {
        console.error('💥 Ошибка фильтрации провинций:', error);
        return [];
    }
}

    /**
     * Анализирует лор-контекст текущего контента
     * @param {string} contentType - тип контента (potion, artifact, character, etc.)
     * @param {string} projectRoot - корневая папка проекта
     * @returns {Promise<Object>} - результат анализа
     */
    async analyzeLoreContext(contentType, projectRoot) {
        try {
            // Проверяем, доступен ли сервис анализа
            if (!window.loreAnalyzerService) {
                throw new Error('Сервис анализа лор-контекста не доступен');
            }

            // Получаем текущий контент из данных мастера
            const content = this.getCurrentContent();
            
            // Выполняем анализ
            const analysis = await window.loreAnalyzerService.analyzeContent(content, contentType, projectRoot);
            
            return analysis;
        } catch (error) {
            console.error('Ошибка анализа лор-контекста:', error);
            throw error;
        }
    }

    /**
     * Получает текущий контент из данных мастера
     * @returns {string} - текущий контент
     */
    getCurrentContent() {
        // Базовая реализация - наследники могут переопределить
        return JSON.stringify(this.data || {}, null, 2);
    }

    /**
     * Создает кнопку анализа лор-контекста
     * @param {HTMLElement} container - контейнер для кнопки
     * @param {string} contentType - тип контента
     * @param {string} projectRoot - корневая папка проекта
     * @returns {HTMLElement} - созданная кнопка
     */
    createLoreAnalysisButton(container, contentType, projectRoot) {
        const button = container.createEl('button', { text: '📊 Анализ лора' });
        
        // Стилизация кнопки
        button.style.cssText = `
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
            transition: background-color 0.2s ease;
        `;
        
        // Эффект при наведении
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#1976D2';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#2196F3';
        });
        
        // Обработчик клика - исправлено: добавлен async
        button.onclick = async () => {
            try {
                button.disabled = true;
                button.textContent = 'Анализирую...';
                button.style.opacity = '0.7';
                
                const analysis = await this.analyzeLoreContext(contentType, projectRoot);
                
                // Открываем модальное окно с результатами
                // Исправлено: убрано await из require
                const LoreAnalysisModal = require('./LoreAnalysisModal.js').LoreAnalysisModal;
                const modal = new LoreAnalysisModal(this.app, this.Modal, this.Setting, this.Notice, analysis);
                modal.open();
                
            } catch (error) {
                if (this.Notice) {
                    new this.Notice(`Ошибка анализа: ${error.message}`);
                }
                console.error('Ошибка анализа лора:', error);
            } finally {
                button.disabled = false;
                button.textContent = '📊 Анализ лора';
                button.style.opacity = '1';
            }
        };
        
        return button;
    }

    /**
     * Создает информационную панель с подсказками
     * @param {HTMLElement} container - контейнер для панели
     * @param {string} title - заголовок панели
     * @param {string} content - содержимое подсказки
     * @returns {HTMLElement} - созданная панель
     */
    createInfoPanel(container, title, content) {
        const panel = container.createEl('div', { cls: 'entity-wizard-info-panel' });
        
        panel.style.cssText = `
            background: #f5f5f5;
            border-left: 4px solid #2196F3;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 14px;
        `;
        
        if (title) {
            const titleEl = panel.createEl('strong', { text: title });
            titleEl.style.display = 'block';
            titleEl.style.marginBottom = '8px';
            titleEl.style.color = '#2196F3';
        }
        
        if (content) {
            panel.createEl('div', { text: content });
        }
        
        return panel;
    }

    /**
     * Создает разделитель между секциями
     * @param {HTMLElement} container - контейнер для разделителя
     * @returns {HTMLElement} - созданный разделитель
     */
    createDivider(container) {
        const divider = container.createEl('hr');
        divider.style.cssText = `
            margin: 20px 0;
            border: none;
            border-top: 1px solid #e0e0e0;
        `;
        return divider;
    }

    /**
     * Безопасная асинхронная загрузка модуля
     * @param {string} modulePath - путь к модулю
     * @returns {Promise<Object>} - загруженный модуль
     */
    async safeRequire(modulePath) {
        try {
            // Для Obsidian плагинов используем app.plugins
            if (this.app && this.app.plugins) {
                const plugin = this.app.plugins.getPlugin('literary-templates');
                if (plugin && plugin.require) {
                    return plugin.require(modulePath);
                }
            }
            // Фолбэк: обычный require
            return require(modulePath);
        } catch (error) {
            console.error(`Ошибка загрузки модуля ${modulePath}:`, error);
            throw error;
        }
    }
}

// Экспорт класса
module.exports = { EntityWizardBase };

// Делаем класс доступным глобально
if (typeof window !== 'undefined') {
    window.EntityWizardBase = EntityWizardBase;
}