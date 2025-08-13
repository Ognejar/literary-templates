/**
 * @file       createPeople.js
 * @description Создание народа (people/nation) в папке проекта `Народы`
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies ensureEntityInfrastructure, safeCreateFile
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

async function createPeople(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createPeople вызвана ===');

        // Определяем корень проекта
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        } else {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) projectRoot = findProjectRoot(plugin.app, activeFile.parent.path);
        }
        if (!projectRoot) {
            const roots = await getAllProjectRoots(plugin.app);
            if (!roots || roots.length === 0) {
                new Notice('Проект не найден: отсутствует файл "Настройки_мира.md"');
                return;
            }
            projectRoot = roots[0];
        }

        // Сбор данных
        const name = await plugin.prompt('Название народа:');
        if (!name || !name.trim()) {
            new Notice('Название обязательно');
            return;
        }
        const typeItems = ['Человек', 'Гном', 'Эльф', 'Орк', 'Дварф', 'Хоббит', 'Другое'];
        const type = await plugin.suggester(typeItems, typeItems, 'Тип народа');
        const homeland = await plugin.prompt('Родина/основная территория:');
        const population = await plugin.prompt('Численность:');
        const language = await plugin.prompt('Язык:');
        const religion = await plugin.prompt('Основная религия:');
        const description = await plugin.prompt('Краткое описание:');

        const cleanName = name.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');

        // Опциональный tagImage по типу
        let tagImage = '';
        try {
            if (window.litSettingsService) {
                tagImage = window.litSettingsService.findTagImage(plugin.app, projectRoot, 'Народ');
            }
        } catch {}

        const fm = [
            '---',
            `created: "${window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0,10)}"`,
            `name: "${name.trim()}"`,
            `aliases: ["${name.trim()}"]`,
            `type: "${type || ''}"`,
            `homeland: "${homeland || ''}"`,
            `population: "${population || ''}"`,
            `language: "${language || ''}"`,
            `religion: "${religion || ''}"`,
            `tags: [people, nation${type ? `, ${String(type).toLowerCase()}` : ''}]`,
            tagImage ? `image: "${tagImage}"` : 'image: ""',
            '---',
            ''
        ].join('\n');

        const imgBlock = tagImage ? `![[${tagImage}]]\n\n` : '';

        const body = [
            `# ${name.trim()}`,
            '',
            imgBlock,
            `**Тип:** ${type || ''}  `,
            `**Родина:** ${homeland ? `[[${homeland}]]` : ''}  `,
            `**Численность:** ${population || ''}  `,
            `**Язык:** ${language || ''}  `,
            `**Религия:** ${religion ? `[[${religion}]]` : ''}  `,
            '',
            '## Описание',
            description || '',
            '',
            '## История',
            '[История происхождения и развития народа]',
            '',
            '## Культура',
            '### Традиции',
            '',
            '### Ремёсла',
            '',
            '### Искусство',
            '- **Музыка:**',
            '- **Литература:**',
            '- **Архитектура:**',
            '- **Одежда:**',
            '',
            '## Общество',
            '- **Социальная структура:**',
            '- **Семейные отношения:**',
            '- **Воспитание детей:**',
            '- **Статус женщин:**',
            '- **Статус мужчин:**',
            '',
            '## Экономика',
            '- **Основные занятия:**',
            '- **Торговля:**',
            '- **Сельское хозяйство:**',
            '- **Ремёсла:**',
            '',
            '## Религия и верования',
            `- **Основная религия:** ${religion ? `[[${religion}]]` : ''}`,
            '- **Дополнительные верования:**',
            '- **Ритуалы:**',
            '- **Святые места:**',
            '',
            '## Отношения с другими народами',
            '- **Союзники:**',
            '- **Противники:**',
            '- **Нейтральные отношения:**',
            '- **Торговые партнёры:**',
            '',
            '## Современное положение',
            '- **Территории проживания:**',
            '- **Политический статус:**',
            '- **Проблемы:**',
            '- **Перспективы:**',
            '',
            '## Автоматические связи',
            '### Представители народа',
            '```dataview',
            'LIST FROM #people OR #character',
            'WHERE (',
            `    contains(file.outlinks, [[${name.trim()}]]) OR`,
            `    contains(file.tags, "${name.trim()}") OR`,
            `    regexmatch(file.text, "#${name.trim()}") OR`,
            `    regexmatch(file.text, "\\[\\[${name.trim()}(\\||\\]\\])")`,
            ') AND file.name != this.file.name',
            '```',
            '',
            '### Территории проживания',
            '```dataview',
            'LIST FROM #place',
            'WHERE (',
            `    contains(file.outlinks, [[${name.trim()}]]) OR`,
            `    contains(file.tags, "${name.trim()}") OR`,
            `    regexmatch(file.text, "#${name.trim()}") OR`,
            `    regexmatch(file.text, "\\[\\[${name.trim()}(\\||\\]\\])")`,
            ') AND file.name != this.file.name',
            '```',
            '',
            '### Организации народа',
            '```dataview',
            'LIST FROM #organization',
            'WHERE (',
            `    contains(file.outlinks, [[${name.trim()}]]) OR`,
            `    contains(file.tags, "${name.trim()}") OR`,
            `    regexmatch(file.text, "#${name.trim()}") OR`,
            `    regexmatch(file.text, "\\[\\[${name.trim()}(\\||\\]\\])")`,
            ') AND file.name != this.file.name',
            '```',
            '',
            '### Связанные события',
            '```dataview',
            'LIST FROM #event',
            'WHERE (',
            `    contains(file.outlinks, [[${name.trim()}]]) OR`,
            `    contains(file.tags, "${name.trim()}") OR`,
            `    regexmatch(file.text, "#${name.trim()}") OR`,
            `    regexmatch(file.text, "\\[\\[${name.trim()}(\\||\\]\\])")`,
            ') AND file.name != this.file.name',
            '```',
            '',
            '## Особенности',
            '',
        ].join('\n');

        const content = fm + body;
        const targetFolder = `${projectRoot}/Народы`;
        await ensureEntityInfrastructure(targetFolder, cleanName, plugin.app);
        const targetPath = `${targetFolder}/${cleanName}.md`;
        await safeCreateFile(targetPath, content, plugin.app);

        const file = plugin.app.vault.getAbstractFileByPath(targetPath);
        if (file instanceof TFile) {
            await plugin.app.workspace.getLeaf().openFile(file);
        }
        new Notice(`Создан народ: ${name.trim()}`);
    } catch (error) {
        new Notice('Ошибка при создании народа: ' + error.message);
        try { await plugin.logDebug('createPeople error: ' + error.message); } catch {}
    }
}

module.exports = { createPeople };


