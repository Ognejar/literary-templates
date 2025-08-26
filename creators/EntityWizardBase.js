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

class EntityWizardBase extends HtmlWizardModal {
    constructor(app, ModalClass, SettingClass, NoticeClass) {
        super(app, ModalClass, NoticeClass);
        this.Setting = SettingClass;
    }

    applyBaseUI() {
        try { this.applyBaseStyles(); } catch {}
    }

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

    addDropdownOptions(dropdown, options) {
        (options || []).forEach(opt => {
            if (typeof opt === 'string') dropdown.addOption(opt, opt);
            else if (opt && typeof opt === 'object' && opt.value !== undefined) {
                dropdown.addOption(opt.value, opt.label !== undefined ? `${opt.icon ? opt.icon + ' ' : ''}${opt.label}` : String(opt.value));
            }
        });
    }

    addTextInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addText(t => {
                t.setValue(value || '');
                t.onChange(onChange);
            });
    }

    addTextAreaInput(container, name, value, onChange) {
        new this.Setting(container)
            .setName(name)
            .addTextArea(t => {
                t.setValue(value || '');
                t.onChange(onChange);
            });
    }

    addDropdownInput(container, name, value, options, onChange) {
        new this.Setting(container)
            .setName(name)
            .addDropdown(d => {
                options.forEach(opt => d.addOption(opt, opt));
                d.setValue(value || '');
                d.onChange(onChange);
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
     * Универсальная функция фильтрации провинций по государству
     * @param {string} stateName - название государства
     * @param {string} projectRoot - корневая папка проекта
     * @param {string[]} allProvinces - массив всех провинций
     * @returns {Promise<string[]>} - отфильтрованный массив провинций
     */
    async filterProvincesByState(stateName, projectRoot, allProvinces) {
        if (!stateName || !projectRoot || !Array.isArray(allProvinces)) {
            return [];
        }

        // Экранируем имя для безопасного использования в RegExp
        const esc = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const nameRe = esc(stateName);
        // Ищем ключи state или country, допускаем кавычки ' или ", а также отсутствие кавычек
        const yamlKeyRe = new RegExp(`\\b(state|country)\\s*:\\s*['\"]?${nameRe}['\"]?\\b`, 'i');
        // Фолбэк: встреча в тексте wiki-ссылки на государство, либо явной строки "Государство: [[...]]"
        const wikiLinkRe = new RegExp(`\\[\\[${nameRe}(?:\\||\\\\]\\])`, 'i');
        const labelLineRe = new RegExp(`Государство\\s*:\\s*\\[\\[${nameRe}(?:\\||\\\\]\\])`, 'i');

        try {
            const filteredProvinces = [];
            for (const provinceName of allProvinces) {
                const provinceFile = this.app.vault.getAbstractFileByPath(`${projectRoot}/Локации/Провинции/${provinceName}.md`);
                if (!provinceFile) continue;
                try {
                    const content = await this.app.vault.read(provinceFile);
                    // Пытаемся анализировать только фронтматтер, если он есть
                    const fmMatch = content.match(/^---[\s\S]*?---/m);
                    const scope = fmMatch ? fmMatch[0] : content;
                    if (yamlKeyRe.test(scope) || wikiLinkRe.test(content) || labelLineRe.test(content)) {
                        filteredProvinces.push(provinceName);
                    }
                } catch {}
            }
            return filteredProvinces;
        } catch (e) {
            console.error('Ошибка фильтрации провинций:', e);
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
     */
    createLoreAnalysisButton(container, contentType, projectRoot) {
        const button = container.createEl('button', { text: '📊 Анализ лора' });
        button.style.cssText = `
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        `;
        
        button.onclick = async () => {
            try {
                button.disabled = true;
                button.textContent = 'Анализирую...';
                
                const analysis = await this.analyzeLoreContext(contentType, projectRoot);
                
                // Открываем модальное окно с результатами
                const { LoreAnalysisModal } = require('./LoreAnalysisModal.js');
                const modal = new LoreAnalysisModal(this.app, Modal, Setting, Notice, analysis);
                modal.open();
                
            } catch (error) {
                new Notice(`Ошибка анализа: ${error.message}`);
            } finally {
                button.disabled = false;
                button.textContent = '📊 Анализ лора';
            }
        };
        
        return button;
    }
}

module.exports = { EntityWizardBase };


