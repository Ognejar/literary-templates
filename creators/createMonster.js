/**
 * @file       createMonster.js
 * @description Создание монстра в папке проекта `Монстры` с использованием внутреннего шаблонизатора
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies generateFromTemplate, safeCreateFile
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/Карточка функционала.md
 */

var createMonster = async function(plugin, startPath = '', options = {}) {
    try {
        plugin.logDebug('=== createMonster вызвана ===');

        // Используем резолвер контекста из настроек
        let projectRoot = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, startPath);
            projectRoot = ctx.projectRoot || '';
        }
        
        // Fallback: старый способ
        if (!projectRoot) {
            if (startPath) {
                try {
                    projectRoot = (typeof findProjectRoot === 'function')
                        ? findProjectRoot(plugin.app, startPath)
                        : '';
                } catch (e) {}
            }
            if (!projectRoot) {
                const activeFile = plugin.app.workspace.getActiveFile();
                if (activeFile) {
                    try {
                        projectRoot = (typeof findProjectRoot === 'function')
                            ? findProjectRoot(plugin.app, activeFile.parent.path)
                            : '';
                    } catch (e) {}
                }
            }
            if (!projectRoot) {
                const roots = (typeof getAllProjectRoots === 'function')
                    ? await getAllProjectRoots(plugin.app)
                    : [];
                if (!roots || roots.length === 0) {
                    new Notice('Проект не найден: отсутствует файл "Настройки_мира.md"');
                    return;
                }
                projectRoot = roots[0];
            }
        }

        // 2) Сбор данных
        const name = await plugin.prompt('Название монстра:');
        if (!name || !name.trim()) {
            new Notice('Название обязательно');
            return;
        }

        const typeItems = ['Дракон', 'Гоблин', 'Орк', 'Тролль', 'Вампир', 'Оборотень', 'Призрак', 'Зомби', 'Демон', 'Элементаль', 'Другое'];
        const type = await plugin.suggester(typeItems, typeItems, 'Тип монстра');

        const sizeItems = ['Крошечный', 'Маленький', 'Средний', 'Большой', 'Огромный', 'Гигантский'];
        const size = await plugin.suggester(sizeItems, sizeItems, 'Размер');

        const intelligenceItems = ['Животное', 'Примитивное', 'Среднее', 'Высокое', 'Гениальное'];
        const intelligence = await plugin.suggester(intelligenceItems, intelligenceItems, 'Интеллект');

        const alignmentItems = ['Добрый', 'Нейтральный', 'Злой', 'Хаотичный', 'Законопослушный'];
        const alignment = await plugin.suggester(alignmentItems, alignmentItems, 'Мировоззрение');

        const habitat = await plugin.prompt('Место обитания:');
        const description = await plugin.prompt('Описание монстра:');
        const abilitiesCsv = await plugin.prompt('Способности (через запятую):');
        const weaknessesCsv = await plugin.prompt('Слабости (через запятую):');
        const behavior = await plugin.prompt('Поведение:');
        const featuresCsv = await plugin.prompt('Особенности (через запятую):');

        function csvToList(csvText) {
            if (!csvText) return '';
            return csvText
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .map(s => `- ${s}`)
                .join('\n');
        }

        const abilitiesContent = csvToList(abilitiesCsv);
        const weaknessesContent = csvToList(weaknessesCsv);
        const featuresContent = csvToList(featuresCsv);

        // 3) Данные для шаблона
        const created = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        const typeLower = (type || '').toString().toLowerCase();

        // Поиск изображения для шапки (необязательный)
        let tagImage = '';
        try {
            const candidates = [
                `${projectRoot}/Теговые_картинки/Монстр.webp`,
                `${projectRoot}/Теговые_картинки/Монстр.jpg`,
                `${projectRoot}/Теговые_картинки/${type}.webp`,
                `${projectRoot}/Теговые_картинки/${type}.jpg`
            ];
            for (const p of candidates) {
                const f = plugin.app.vault.getAbstractFileByPath(p);
                if (f) { tagImage = p; break; }
            }
        } catch (e) {}

        const data = {
            created,
            name: name.trim(),
            type: type || '',
            size: size || '',
            intelligence: intelligence || '',
            alignment: alignment || '',
            habitat: habitat || '',
            description: description || '',
            abilitiesContent,
            weaknessesContent,
            featuresContent,
            behavior: behavior || '',
            typeLower,
            tagImage
        };

        // 4) Генерация содержимого по шаблону
        const md = await generateFromTemplate('Новый_монстр', data, plugin);

        // 5) Создание файла в {projectRoot}/Монстры/{Имя}.md с авто-нумерацией
        const monstersFolderPath = `${projectRoot}/Монстры`;
        let folder = plugin.app.vault.getAbstractFileByPath(monstersFolderPath);
        if (!folder) {
            folder = await plugin.app.vault.createFolder(monstersFolderPath);
        }

        const baseFileName = name.trim().replace(/\s+/g, '_').replace(/[^а-яА-ЯёЁ\w_.-]/g, '');
        let targetPath = `${monstersFolderPath}/${baseFileName}.md`;
        if (plugin.app.vault.getAbstractFileByPath(targetPath)) {
            let counter = 2;
            while (plugin.app.vault.getAbstractFileByPath(`${monstersFolderPath}/${baseFileName}_${counter}.md`)) {
                counter++;
            }
            targetPath = `${monstersFolderPath}/${baseFileName}_${counter}.md`;
        }

		const newFile = await plugin.app.vault.create(targetPath, md);
		new Notice('Монстр создан: ' + targetPath);
		try {
			await plugin.app.workspace.getLeaf(true).openFile(newFile);
		} catch (e) {}

    } catch (error) {
        new Notice('Ошибка при создании монстра: ' + error.message);
        try { plugin.logDebug('createMonster error: ' + error.message); } catch (e) {}
    }
};

module.exports = { createMonster };


