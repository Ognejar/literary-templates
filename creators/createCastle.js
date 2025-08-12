/**
 * @file       createCastle.js
 * @description Функция создания фортификации (замок/крепость/форт)
 */

const { findProjectRoot, generateFromTemplate, ensureEntityInfrastructure, safeCreateFile } = require('../main.js');

async function createCastle(plugin, startPath = '', quickType = '') {
    try {
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        }
        let project = '';
        if (projectRoot) {
            project = projectRoot;
        } else {
            const allFiles = plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
            const projects = projectFiles.map(f => f.parent.path);
            if (projects.length === 0) {
                new Notice('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;
        }

        const modal = new CastleWizardModal(plugin.app, Modal, Setting, Notice, project, async (castleData) => {
            const cleanName = castleData.castleName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const fortificationsContent = (castleData.fortifications || []).map(f => `- ${f}`).join('\n');
            const garrisonContent = (castleData.garrison || []).map(g => `- ${g}`).join('\n');
            const notableFeaturesContent = (castleData.notableFeatures || []).map(f => `- ${f}`).join('\n');

            // Картинка по типу
            const baseName = castleData.fortificationType || castleData.type || 'Замок';
            const tagImage = window.litSettingsService ? window.litSettingsService.findTagImage(plugin.app, project, baseName) : '';
            const imageBlock = tagImage ? `![[${tagImage}]]` : '';

            // Данные для шаблона
            const data = {
                ...castleData,
                fortificationType: castleData.fortificationType || castleData.type || 'Замок',
                type: castleData.fortificationType || castleData.type || 'Замок',
                cleanName: cleanName,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                projectName: project.split('/').pop(),
                state: castleData.state || '',
                country: castleData.state || '', // Для совместимости с запросами
                // Статус и причина
                status: castleData.status || 'действует',
                statusReason: castleData.statusReason || '',
                statusLabel: (castleData.status === 'заброшено' ? '🏚️ Заброшено' : (castleData.status === 'разрушено' ? '💥 Разрушено' : '✅ Действует')),
                fortificationsContent,
                garrisonContent,
                notableFeaturesContent,
                imageBlock
            };

            const content = await generateFromTemplate('Новая_фортификация', data, plugin);
            const fileName = cleanName;
            const targetFolder = `${project}/Локации/Фортификации`;
            await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
            const targetPath = `${targetFolder}/${fileName}.md`;
            await safeCreateFile(targetPath, content, plugin.app);

            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создана фортификация: ${fileName}`);
        });
        if (quickType) {
            modal.prefillType = quickType;
        }
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании фортификации: ' + error.message);
    }
}

module.exports = { createCastle };
