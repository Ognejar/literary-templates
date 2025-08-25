/**
 * @file       LoreAnalysisModal.js
 * @description Модальное окно для отображения результатов анализа лор-контекста
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-15
 * @updated    2025-08-15
 * @docs       docs/Карточка функционала.md
 */

var LoreAnalysisModal = class extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, analysis) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.analysis = analysis;
    }

    onOpen() {
        this.modalEl.style.cssText = `
            max-width: 800px !important;
            width: 800px !important;
        `;
        this.contentEl.style.cssText = `
            padding: 20px;
            max-width: 800px !important;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        this.render();
    }

    render() {
        this.contentEl.empty();
        
        // Заголовок
        const header = this.contentEl.createEl('h2', { text: 'Анализ лор-контекста' });
        header.style.cssText = 'margin-bottom: 20px; color: #var(--text-accent);';
        
        // Общая полнота
        this.renderCompleteness();
        
        // Секции
        this.renderSections();
        
        // Недостающее
        this.renderMissing();
        
        // Рекомендации
        this.renderRecommendations();
        
        // Лор-контекст
        this.renderLoreContext();
        
        // Кнопки
        this.renderButtons();
    }

    renderCompleteness() {
        const completenessContainer = this.contentEl.createEl('div', { cls: 'completeness-section' });
        completenessContainer.style.cssText = `
            background: #var(--background-secondary);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        `;
        
        const completeness = this.analysis.completeness;
        const percentage = completenessContainer.createEl('div', { cls: 'completeness-percentage' });
        percentage.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
            color: ${this.getCompletenessColor(completeness)};
        `;
        percentage.textContent = `${completeness}%`;
        
        const label = completenessContainer.createEl('div', { cls: 'completeness-label' });
        label.style.cssText = 'font-size: 16px; color: #var(--text-muted);';
        label.textContent = this.getCompletenessLabel(completeness);
    }

    renderSections() {
        const sectionsContainer = this.contentEl.createEl('div', { cls: 'sections-section' });
        sectionsContainer.style.cssText = 'margin-bottom: 20px;';
        
        const title = sectionsContainer.createEl('h3', { text: 'Анализ секций' });
        title.style.cssText = 'margin-bottom: 15px; color: #var(--text-accent);';
        
        Object.keys(this.analysis.sections).forEach(sectionName => {
            const section = this.analysis.sections[sectionName];
            const sectionEl = sectionsContainer.createEl('div', { cls: 'section-item' });
            sectionEl.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin-bottom: 5px;
                background: #var(--background-secondary);
                border-radius: 4px;
            `;
            
            const nameEl = sectionEl.createEl('div', { cls: 'section-name' });
            nameEl.style.cssText = 'font-weight: 500;';
            nameEl.textContent = this.getSectionDisplayName(sectionName);
            
            const statusEl = sectionEl.createEl('div', { cls: 'section-status' });
            if (section.present) {
                statusEl.style.cssText = 'color: #4CAF50; font-weight: 500;';
                statusEl.textContent = `✅ ${section.quality}%`;
            } else {
                statusEl.style.cssText = 'color: #f44336; font-weight: 500;';
                statusEl.textContent = '❌ Отсутствует';
            }
        });
    }

    renderMissing() {
        if (this.analysis.missing.length === 0) return;
        
        const missingContainer = this.contentEl.createEl('div', { cls: 'missing-section' });
        missingContainer.style.cssText = 'margin-bottom: 20px;';
        
        const title = missingContainer.createEl('h3', { text: 'Отсутствующие элементы' });
        title.style.cssText = 'margin-bottom: 15px; color: #f44336;';
        
        const list = missingContainer.createEl('ul', { cls: 'missing-list' });
        list.style.cssText = 'margin: 0; padding-left: 20px;';
        
        this.analysis.missing.forEach(item => {
            const li = list.createEl('li');
            li.style.cssText = 'margin-bottom: 5px; color: #var(--text-normal);';
            li.textContent = item;
        });
    }

    renderRecommendations() {
        if (this.analysis.recommendations.length === 0) return;
        
        const recommendationsContainer = this.contentEl.createEl('div', { cls: 'recommendations-section' });
        recommendationsContainer.style.cssText = 'margin-bottom: 20px;';
        
        const title = recommendationsContainer.createEl('h3', { text: 'Рекомендации для улучшения' });
        title.style.cssText = 'margin-bottom: 15px; color: #2196F3;';
        
        const list = recommendationsContainer.createEl('ul', { cls: 'recommendations-list' });
        list.style.cssText = 'margin: 0; padding-left: 20px;';
        
        this.analysis.recommendations.forEach(recommendation => {
            const li = list.createEl('li');
            li.style.cssText = 'margin-bottom: 8px; color: #var(--text-normal); line-height: 1.4;';
            li.textContent = recommendation;
        });
    }

    renderLoreContext() {
        if (!this.analysis.loreContext || Object.keys(this.analysis.loreContext).length === 0) return;
        
        const contextContainer = this.contentEl.createEl('div', { cls: 'lore-context-section' });
        contextContainer.style.cssText = 'margin-bottom: 20px;';
        
        const title = contextContainer.createEl('h3', { text: 'Лор-контекст' });
        title.style.cssText = 'margin-bottom: 15px; color: #var(--text-accent);';
        
        if (this.analysis.loreContext.worldInfo && Object.keys(this.analysis.loreContext.worldInfo).length > 0) {
            const worldInfo = contextContainer.createEl('div', { cls: 'world-info' });
            worldInfo.style.cssText = 'margin-bottom: 15px;';
            
            const worldTitle = worldInfo.createEl('h4', { text: 'Информация о мире' });
            worldTitle.style.cssText = 'margin-bottom: 10px; color: #var(--text-accent);';
            
            Object.keys(this.analysis.loreContext.worldInfo).forEach(key => {
                const infoEl = worldInfo.createEl('div', { cls: 'world-info-item' });
                infoEl.style.cssText = 'margin-bottom: 5px;';
                infoEl.innerHTML = `<strong>${this.getWorldInfoDisplayName(key)}:</strong> ${this.analysis.loreContext.worldInfo[key]}`;
            });
        }
        
        if (this.analysis.loreContext.relatedFiles && this.analysis.loreContext.relatedFiles.length > 0) {
            const relatedFiles = contextContainer.createEl('div', { cls: 'related-files' });
            relatedFiles.style.cssText = 'margin-bottom: 15px;';
            
            const filesTitle = relatedFiles.createEl('h4', { text: 'Связанные файлы' });
            filesTitle.style.cssText = 'margin-bottom: 10px; color: #var(--text-accent);';
            
            const filesList = relatedFiles.createEl('ul', { cls: 'files-list' });
            filesList.style.cssText = 'margin: 0; padding-left: 20px;';
            
            this.analysis.loreContext.relatedFiles.slice(0, 5).forEach(file => {
                const li = filesList.createEl('li');
                li.style.cssText = 'margin-bottom: 3px; color: #var(--text-muted); font-size: 14px;';
                li.textContent = file.basename;
            });
            
            if (this.analysis.loreContext.relatedFiles.length > 5) {
                const moreEl = relatedFiles.createEl('div', { cls: 'more-files' });
                moreEl.style.cssText = 'color: #var(--text-muted); font-size: 14px; margin-top: 5px;';
                moreEl.textContent = `... и еще ${this.analysis.loreContext.relatedFiles.length - 5} файлов`;
            }
        }
    }

    renderButtons() {
        const buttonsContainer = this.contentEl.createEl('div', { cls: 'buttons-section' });
        buttonsContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #var(--background-modifier-border);
        `;
        
        const closeBtn = buttonsContainer.createEl('button', { text: 'Закрыть' });
        closeBtn.style.cssText = `
            padding: 8px 16px;
            background: #var(--background-secondary);
            color: #var(--text-normal);
            border: 1px solid #var(--background-modifier-border);
            border-radius: 4px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => this.close();
        
        if (this.analysis.recommendations.length > 0) {
            const improveBtn = buttonsContainer.createEl('button', { text: 'Улучшить с AI' });
            improveBtn.style.cssText = `
                padding: 8px 16px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            improveBtn.onclick = () => this.improveWithAI();
        }
    }

    getCompletenessColor(completeness) {
        if (completeness >= 80) return '#4CAF50';
        if (completeness >= 60) return '#FF9800';
        if (completeness >= 40) return '#FF5722';
        return '#f44336';
    }

    getCompletenessLabel(completeness) {
        if (completeness >= 80) return 'Отличная полнота';
        if (completeness >= 60) return 'Хорошая полнота';
        if (completeness >= 40) return 'Средняя полнота';
        if (completeness >= 20) return 'Низкая полнота';
        return 'Очень низкая полнота';
    }

    getSectionDisplayName(sectionName) {
        const names = {
            name: 'Название',
            description: 'Описание',
            ingredients: 'Ингредиенты',
            effects: 'Эффекты',
            process: 'Процесс',
            risks: 'Риски',
            history: 'История',
            properties: 'Свойства',
            owner: 'Владелец',
            location: 'Местоположение',
            creation: 'Создание',
            background: 'Прошлое',
            personality: 'Личность',
            abilities: 'Способности',
            relationships: 'Отношения',
            goals: 'Цели'
        };
        
        return names[sectionName] || sectionName;
    }

    getWorldInfoDisplayName(key) {
        const names = {
            name: 'Название мира',
            era: 'Эпоха',
            magic: 'Магия',
            technology: 'Технологии'
        };
        
        return names[key] || key;
    }

    async improveWithAI() {
        // TODO: Реализовать улучшение с помощью AI
        new this.Notice('Функция улучшения с AI будет добавлена в следующей версии');
    }
}

module.exports = { LoreAnalysisModal };
