/**
 * @file       HtmlWizardModal.js
 * @description Базовый класс модалей-мастеров с полноценным HTML и унифицированными стилями/кнопками
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       /docs/project.md
 */

class HtmlWizardModal extends Modal {
    constructor(app, ModalClass, NoticeClass) {
        super(app);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this._stylesInjected = false;
    }

    applyBaseStyles() {
        if (this._stylesInjected) return;
        this._stylesInjected = true;
        const style = document.createElement('style');
        style.setAttribute('data-lt-wizard-styles', '');
        style.textContent = `
            .lt-wizard { padding: 20px; max-width: 900px; }
            .lt-progress { width: 100%; height: 4px; background: var(--background-modifier-border); border-radius: 2px; margin-bottom: 20px; }
            .lt-progress__fill { height: 100%; background: var(--interactive-accent); border-radius: 2px; transition: width .3s ease; }
            .lt-header { margin-bottom: 20px; color: var(--text-accent); }
            .lt-subtle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; }
            .lt-card { background: var(--background-secondary); padding: 16px; border-radius: 8px; }
            .lt-nav { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border); }
            .lt-btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
            .lt-btn--primary { background: var(--interactive-accent); color: var(--text-on-accent); }
            .lt-btn--primary:hover { background: var(--interactive-accent-hover); }
            .lt-btn--secondary { background: var(--background-secondary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); }
            .lt-btn--secondary:hover { background: var(--background-modifier-hover); }
        `;
        (this.modalEl || document.head).appendChild(style);
    }

    createButton(variant, text) {
        const btn = document.createElement('button');
        btn.className = `lt-btn ${variant === 'primary' ? 'lt-btn--primary' : 'lt-btn--secondary'}`;
        btn.textContent = text;
        return btn;
    }

    renderNavigation() {
        const nav = this.contentEl.createEl('div', { cls: 'lt-nav' });
        
        // Кнопка "Назад"
        if (this.step > 0) {
            const backBtn = this.createButton('secondary', '← Назад');
            backBtn.onclick = () => {
                this.step--;
                this.render();
            };
            nav.appendChild(backBtn);
        } else {
            nav.appendChild(document.createElement('div')); // Пустой элемент для выравнивания
        }
        
        // Кнопка "Далее" или "Завершить"
        if (this.step < this.steps.length - 1) {
            const nextBtn = this.createButton('primary', 'Далее →');
            nextBtn.onclick = () => {
                this.step++;
                this.render();
            };
            nav.appendChild(nextBtn);
        } else {
            const finishBtn = this.createButton('primary', 'Завершить');
            finishBtn.onclick = () => {
                this.finish();
            };
            nav.appendChild(finishBtn);
        }
    }

    finish() {
        // Базовый метод завершения - переопределяется в наследниках
        this.close();
    }
}

module.exports = { HtmlWizardModal };

// Делаем класс доступным глобально
if (typeof window !== 'undefined') {
    window.HtmlWizardModal = HtmlWizardModal;
}


