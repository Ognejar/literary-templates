/**
 * @file       ChapterSelectorModal.js
 * @description Модальное окно для выбора главы с красивым UI
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

class ChapterSelectorModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, chapters, onSelect) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.chapters = chapters;
        this.onSelect = onSelect;
    }

    onOpen() {
        // Добавляем общие стили для модального окна
        this.modalEl.style.cssText = `
            max-width: 600px !important;
            width: 600px !important;
        `;
        this.contentEl.style.cssText = `
            padding: 20px;
            max-width: 600px !important;
            max-height: 80vh;
            overflow-y: auto;
            font-size: 16px;
        `;
        
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Заголовок
        const header = contentEl.createEl('h2', { text: 'Выберите главу' });
        header.style.cssText = `
            margin: 0 0 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = contentEl.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📖 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите главу, в которой будет размещен новый элемент. Элемент будет помещен в папку выбранной главы.
            </div>
        `;
        
        // Контейнер для глав
        const container = contentEl.createDiv('chapters-container');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 50vh;
            overflow-y: auto;
            padding-right: 10px;
        `;
        
        if (this.chapters.length === 0) {
            const noChaptersDiv = container.createDiv();
            noChaptersDiv.style.cssText = `
                padding: 30px;
                text-align: center;
                color: var(--text-muted);
                background: var(--background-secondary);
                border-radius: 8px;
                border: 2px dashed var(--background-modifier-border);
            `;
            noChaptersDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 10px;">📚</div>
                <div style="font-size: 16px; margin-bottom: 5px;">Главы не найдены</div>
                <div style="font-size: 12px;">Создайте главы в проекте для продолжения</div>
            `;
        } else {
                         // Создаем строки для каждой главы
             this.chapters.forEach(chapter => {
                 const chapterRow = container.createDiv('chapter-row');
                 chapterRow.style.cssText = `
                     display: flex;
                     align-items: center;
                     width: 100%;
                     padding: 16px 20px;
                     background: var(--background-secondary);
                     color: var(--text-normal);
                     border: 1px solid var(--background-modifier-border);
                     border-radius: 6px;
                     font-size: 16px;
                     font-weight: 500;
                     cursor: pointer;
                     transition: all 0.2s ease;
                     margin-bottom: 0;
                     flex-shrink: 0;
                 `;
                 
                 // Добавляем иконку книги
                 const icon = chapterRow.createEl('span', { text: '📖 ' });
                 icon.style.cssText = `
                     margin-right: 12px;
                     font-size: 18px;
                 `;
                 
                 // Добавляем текст главы
                 const text = chapterRow.createEl('span', { text: `${chapter.num} - ${chapter.name}` });
                 text.style.cssText = `
                     flex: 1;
                     font-size: 16px;
                 `;
                 
                 chapterRow.addEventListener('mouseenter', () => {
                     chapterRow.style.background = 'var(--background-modifier-hover)';
                     chapterRow.style.borderColor = 'var(--interactive-accent)';
                 });
                 
                 chapterRow.addEventListener('mouseleave', () => {
                     chapterRow.style.background = 'var(--background-secondary)';
                     chapterRow.style.borderColor = 'var(--background-modifier-border)';
                 });
                 
                 chapterRow.onclick = () => {
                     this.onSelect(chapter.num);
                     this.close();
                 };
             });
        }
        
        // Кнопка отмены
        const cancelBtn = contentEl.createEl('button', { text: 'Отмена' });
        cancelBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 20px;
            background: var(--background-secondary);
            color: var(--text-muted);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'var(--background-modifier-hover)';
        });
        
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'var(--background-secondary)';
        });
        
        cancelBtn.onclick = () => {
            this.close();
        };
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = ChapterSelectorModal;
