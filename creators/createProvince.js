/**
 * @file       createProvince.js
 * @description Функция создания провинции для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies ProvinceWizardModal, ensureEntityInfrastructure, findProjectRoot
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/Карточка функционала.md
 */

// Классы Obsidian доступны глобально

/**
 * Создает новую провинцию в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта
 */
var createProvince = async function(plugin, startPath = '') {
    try {
        await plugin.logDebug('=== createProvince вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

        let resolvedProjectRoot = '';
        if (startPath) {
            resolvedProjectRoot = findProjectRoot(plugin.app, startPath) || startPath;
        }
        let project = '';
        if (resolvedProjectRoot) {
            project = resolvedProjectRoot;
        } else {
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            if (projects.length === 0) {
                new Notice('Проекты не найдены!');
                await plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;
        }
        await plugin.logDebug('project: ' + project);

        const modal = new ProvinceWizardModal(plugin.app, Modal, Setting, Notice, project, async (provinceData) => {
            const cleanName = provinceData.provinceName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const minorFactionsContent = provinceData.minorFactions.map(f => `- ${f}`).join('\n');
            const citiesContent = provinceData.cities.map(c => `- [[${c}]]`).join('\n');
            const villagesContent = provinceData.villages.map(v => `- [[${v}]]`).join('\n');
            const deadZonesContent = provinceData.deadZones.map(d => `- [[${d}]]`).join('\n');
            const portsContent = provinceData.ports.map(p => `- [[${p}]]`).join('\n');
            const castlesContent = provinceData.castles.map(c => `- [[${c}]]`).join('\n');

            const createdDate = window.moment().format('YYYY-MM-DD');

            // Поиск изображения для провинции
            const tagFolder = `${project}/Теговые_картинки`;
            const baseName = 'Провинция';
            const exts = ['jpg','jpeg','png','webp'];
            let tagImage = '';
            for (const ext of exts) {
                const p = `${tagFolder}/${baseName}.${ext}`;
                const f = plugin.app.vault.getAbstractFileByPath(p);
                if (f && f instanceof TFile) { tagImage = p; break; }
            }
            const imageBlock = tagImage ? `![[${tagImage}]]` : '';

            const templateContent = await plugin.readTemplateFile('Новая_провинция');

            const content = plugin.applyTemplate(templateContent, {
                date: createdDate,
                name: provinceData.provinceName,
                type: 'Провинция',
                typeLower: 'провинция',
                climate: provinceData.climate,
                state: provinceData.state,
                dominantFaction: provinceData.dominantFaction,
                historicalPeriod: provinceData.historicalPeriod,
                description: provinceData.description,
                minorFactionsSection: minorFactionsContent || 'Не указаны',
                population: provinceData.population || 'Не указано',
                economy: provinceData.economy || 'Не указана',
                citiesSection: citiesContent || 'Не указаны',
                villagesSection: villagesContent || 'Не указаны',
                deadZonesSection: deadZonesContent || 'Не указаны',
                portsSection: portsContent || 'Не указаны',
                castlesSection: castlesContent || 'Не указаны',
                imageBlock
            });

            // Гарантируем уникальность имени файла (автонумерация)
            const targetFolder = `${project}/Локации/Провинции`;
            await ensureEntityInfrastructure(targetFolder, cleanName, plugin.app);
            let fileName = cleanName;
            const makePath = (n) => `${targetFolder}/${n}.md`;
            let attempt = 1;
            while (plugin.app.vault.getAbstractFileByPath(makePath(fileName))) {
                attempt += 1;
                fileName = `${cleanName}_${attempt}`;
            }
            const targetPath = makePath(fileName);
            await safeCreateFile(targetPath, content, plugin.app);

            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создана провинция: ${fileName}`);
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании провинции: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createProvince };
