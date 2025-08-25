/**
 * @file       createDeadZone.js
 * @description Функция создания мертвой зоны для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, DeadZoneWizardModal.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

var createDeadZone = async function(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createDeadZone вызвана ===');
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

        const modal = new DeadZoneWizardModal(plugin.app, Modal, Setting, Notice, project, async (deadZoneData) => {
            const cleanName = deadZoneData.zoneName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            const findingsContent = deadZoneData.findings.map(f => `- ${f}`).join('\n');

            const createdDate = window.moment().format('YYYY-MM-DD');
            const projectName = project.split('/').pop();
            
            // Получаем изображение - пробуем разные варианты названий
            let imageBlock = '';
            if (window.litSettingsService) {
                // Сначала пробуем точное название
                imageBlock = window.litSettingsService.getTagImageBlock(plugin.app, project, 'Мёртвая зона');
                // Если не найдено, пробуем без ё
                if (!imageBlock) {
                    imageBlock = window.litSettingsService.getTagImageBlock(plugin.app, project, 'Мертвая зона');
                }
                // Если не найдено, пробуем общие варианты
                if (!imageBlock) {
                    imageBlock = window.litSettingsService.getTagImageBlock(plugin.app, project, 'Локация');
                }
            }
            
            const templateContent = await plugin.readTemplateFile('Новая_мертвая_зона');
            // Формируем секции юрисдикции
            let provinceSection = '';
            if (deadZoneData.province && deadZoneData.province.trim()) {
                provinceSection = `**Провинция:** [[${deadZoneData.province.trim()}]]`;
            }
            let stateSection = '';
            if (deadZoneData.state && deadZoneData.state.trim()) {
                stateSection = `**Государство:** [[${deadZoneData.state.trim()}]]`;
            }

            let content = plugin.applyTemplate(templateContent, {
                date: createdDate,
                zoneName: deadZoneData.zoneName,
                climate: deadZoneData.climate,
                faction: deadZoneData.faction,
                description: deadZoneData.description,
                oldEconomy: deadZoneData.oldEconomy || '',
                currentState: deadZoneData.currentState || '',
                // Статус по умолчанию для мёртвых зон
                status: deadZoneData.status || 'заброшено',
                statusReason: deadZoneData.statusReason || 'Затопление',
                statusLabel: (deadZoneData.status === 'заброшено'
                    ? '🏚️ Заброшено'
                    : (deadZoneData.status === 'разрушено'
                        ? '💥 Разрушено'
                        : '✅ Действует')),
                province: deadZoneData.province || '',
                state: deadZoneData.state || '',
                country: deadZoneData.country || deadZoneData.state || '',
                provinceSection,
                stateSection,
                findingsContent: findingsContent,
                projectName: projectName,
                imageBlock: imageBlock
            });

            // Дополнительная подстраховка замены ключевых плейсхолдеров
            content = content
                .replace(/{{province}}/g, deadZoneData.province || '')
                .replace(/{{state}}/g, (deadZoneData.state || ''))
                .replace(/{{country}}/g, (deadZoneData.country || deadZoneData.state || ''))
                .replace(/{{statusLabel}}/g, (deadZoneData.status === 'заброшено'
                    ? '🏚️ Заброшено'
                    : (deadZoneData.status === 'разрушено'
                        ? '💥 Разрушено'
                        : '✅ Действует')));
            
            const fileName = cleanName;
            const targetFolder = `${project}/Локации`;
            await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
            const targetPath = `${targetFolder}/${fileName}.md`;
            await safeCreateFile(targetPath, content, plugin.app);
            const file = plugin.app.vault.getAbstractFileByPath(targetPath);
            if (file instanceof TFile) {
                await plugin.app.workspace.getLeaf().openFile(file);
            }
            new Notice(`Создана мертвая зона: ${fileName}`);
        });
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании мертвой зоны: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
};

module.exports = { createDeadZone };
