/**
 * @file       BaseWizardModal.js
 * @description Базовый класс для всех wizard-модалей с унифицированной навигацией и стилями
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       /docs/project.md
 */

class BaseWizardModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, onFinish) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.onFinish = onFinish;
        this.step = 0;
        this.steps = [];
        this.data = {};
    }

    onOpen() {
        // Унифицированные стили для всех модальных окон
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
        
        this.contentEl.empty();
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Унифицированный индикатор прогресса
        this.renderProgressIndicator(contentEl);
        
        // Заголовок шага
        this.renderStepHeader(contentEl);
        
        // Основной контент (должен быть переопределен в наследниках)
        this.renderStepContent(contentEl);
        
        // Унифицированная навигация
        this.renderNavigation(contentEl);
    }

    renderProgressIndicator(contentEl) {
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
                font-weight: ${index === this.step ? '600' : '400'};
                color: ${index === this.step ? 'var(--text-on-accent)' : 'var(--text-muted)'};
                background: ${index === this.step ? 'var(--interactive-accent)' : 'transparent'};
            `;
            stepEl.textContent = step;
        });
    }

    renderStepHeader(contentEl) {
        const header = contentEl.createEl('h2', { text: this.steps[this.step] });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
    }

    renderStepContent(contentEl) {
        // Должно быть переопределено в наследниках
        throw new Error('renderStepContent must be implemented in subclasses');
    }

    renderNavigation(contentEl) {
        const navEl = contentEl.createEl('div', { cls: 'modal-nav' });
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
        if (this.step > 0) {
            const prevBtn = leftButtons.createEl('button', { text: '← Назад' });
            prevBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--background-secondary);
                color: var(--text-muted);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            prevBtn.addEventListener('mouseenter', () => {
                prevBtn.style.background = 'var(--background-modifier-hover)';
            });
            prevBtn.addEventListener('mouseleave', () => {
                prevBtn.style.background = 'var(--background-secondary)';
            });
            prevBtn.onclick = () => {
                this.step--;
                this.render();
            };
        }
        
        // Кнопка "Далее" или "Завершить"
        if (this.step < this.steps.length - 1) {
            const nextBtn = rightButtons.createEl('button', { text: 'Далее →' });
            nextBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            nextBtn.addEventListener('mouseenter', () => {
                nextBtn.style.background = 'var(--interactive-accent-hover)';
            });
            nextBtn.addEventListener('mouseleave', () => {
                nextBtn.style.background = 'var(--interactive-accent)';
            });
            nextBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.step++;
                    this.render();
                }
            };
        } else {
            const finishBtn = rightButtons.createEl('button', { text: '✓ Завершить' });
            finishBtn.style.cssText = `
                padding: 10px 20px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            finishBtn.addEventListener('mouseenter', () => {
                finishBtn.style.background = 'var(--interactive-accent-hover)';
            });
            finishBtn.addEventListener('mouseleave', () => {
                finishBtn.style.background = 'var(--interactive-accent)';
            });
            finishBtn.onclick = () => {
                if (this.validateCurrentStep()) {
                    this.onFinish(this.data);
                    this.close();
                }
            };
        }
    }

    // Унифицированные стили для полей ввода
    applyTextFieldStyles(textField) {
        textField.inputEl.style.width = '100%';
        textField.inputEl.style.fontSize = '16px';
        textField.inputEl.style.padding = '8px';
        textField.inputEl.style.borderRadius = '4px';
        textField.inputEl.style.border = '1px solid var(--background-modifier-border)';
    }

    applyDropdownStyles(dropdown) {
        dropdown.selectEl.style.minWidth = '320px';
        dropdown.selectEl.style.fontSize = '14px';
        dropdown.selectEl.style.padding = '6px';
        dropdown.selectEl.style.borderRadius = '4px';
        dropdown.selectEl.style.border = '1px solid var(--background-modifier-border)';
    }

    applyTextAreaStyles(textArea) {
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.minHeight = '120px';
        textArea.inputEl.style.fontSize = '14px';
        textArea.inputEl.style.lineHeight = '1.4';
        textArea.inputEl.style.padding = '8px';
        textArea.inputEl.style.borderRadius = '4px';
        textArea.inputEl.style.border = '1px solid var(--background-modifier-border)';
        textArea.inputEl.style.resize = 'vertical';
    }

    validateCurrentStep() {
        // Должно быть переопределено в наследниках
        return true;
    }

    onClose() {
        // Базовая реализация
    }
}

module.exports = BaseWizardModal;
