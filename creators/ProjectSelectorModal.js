/**
 * @file       ProjectSelectorModal.js
 * @description Модальное окно для выбора проекта с красивым UI
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

class ProjectSelectorModal extends Modal {
    constructor(app, ModalClass, SettingClass, NoticeClass, projects, onSelect) {
        super(app);
        this.Modal = ModalClass;
        this.Setting = SettingClass;
        this.Notice = NoticeClass;
        this.projects = projects;
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
        const header = contentEl.createEl('h2', { text: 'Выберите проект' });
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
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📁 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите проект, в котором будет создан новый элемент. Проект определяется наличием файла "Настройки_мира.md" в папке.
            </div>
        `;
        
        // Контейнер для проектов
        const container = contentEl.createDiv('projects-container');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-height: 50vh;
            overflow-y: auto;
            padding-right: 10px;
        `;
        
        if (this.projects.length === 0) {
            const noProjectsDiv = container.createDiv();
            noProjectsDiv.style.cssText = `
                padding: 30px;
                text-align: center;
                color: var(--text-muted);
                background: var(--background-secondary);
                border-radius: 8px;
                border: 2px dashed var(--background-modifier-border);
            `;
            noProjectsDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 10px;">📁</div>
                <div style="font-size: 16px; margin-bottom: 5px;">Проекты не найдены</div>
                <div style="font-size: 12px;">Создайте папку с файлом "Настройки_мира.md" для создания проекта</div>
            `;
        } else {
                         // Создаем строки для каждого проекта
             this.projects.forEach(project => {
                 const projectRow = container.createDiv('project-row');
                 projectRow.style.cssText = `
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
                 
                 // Добавляем иконку папки
                 const icon = projectRow.createEl('span', { text: '📁 ' });
                 icon.style.cssText = `
                     margin-right: 12px;
                     font-size: 18px;
                 `;
                 
                 // Добавляем текст проекта
                 const text = projectRow.createEl('span', { text: project });
                 text.style.cssText = `
                     flex: 1;
                     font-size: 16px;
                 `;
                 
                 projectRow.addEventListener('mouseenter', () => {
                     projectRow.style.background = 'var(--background-modifier-hover)';
                     projectRow.style.borderColor = 'var(--interactive-accent)';
                 });
                 
                 projectRow.addEventListener('mouseleave', () => {
                     projectRow.style.background = 'var(--background-secondary)';
                     projectRow.style.borderColor = 'var(--background-modifier-border)';
                 });
                 
                 projectRow.onclick = () => {
                     this.onSelect(project);
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

module.exports = ProjectSelectorModal;

if (typeof window !== 'undefined') {
    window.ProjectSelectorModal = ProjectSelectorModal;
}