/**
 * @file       ProjectManager.js
 * @description Менеджер проектов для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, TemplateManager
 * @created    2025-01-27
 * @updated    2025-01-27
 * @docs       docs/project.md
 */

class ProjectManager {
    constructor(plugin) {
        this.plugin = plugin;
        this.templateManager = new window.TemplateManager(plugin);
    }

    /**
     * Создает новый мир/проект
     */
    async createWorld(worldName, author, plugin) {
        try {
            const safeName = worldName.replace(/[^a-zA-Z0-9а-яА-Я\s]/g, '').replace(/\s+/g, '_');
            const worldPath = `Мир/${safeName}`;
            
            // Создаем основную структуру папок
            await this.ensureEntityInfrastructure(worldPath, 'Настройки_мира.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации`, 'Локации.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Государства`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Провинции`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Города`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Деревни`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Замки`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Порты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Фермы`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Шахты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Заводы`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Мёртвые_зоны`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Локации/Прочие_локации`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Персонажи`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Сюжетные_линии`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Произведения`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Задачи`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Сцены`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Главы`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Организации`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Религии`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Фракции`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Квесты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/События`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Конфликты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Магия`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Магия/Заклинания`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Магия/Зелья`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Магия/Артефакты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Магия/Алхимические_рецепты`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Экономика`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Экономика/Торговые_пути`, 'Index.md', plugin.app);
            await this.ensureEntityInfrastructure(`${worldPath}/Экономика/Социальные_объекты`, 'Index.md', plugin.app);

            // Создаем файл настроек мира
            const settingsContent = await this.templateManager.generateFromTemplate('Настройки_мира', {
                worldName: safeName,
                author: author,
                projectName: safeName
            }, plugin);

            const settingsFile = plugin.app.vault.getAbstractFileByPath(`${worldPath}/Настройки_мира.md`);
            if (settingsFile) {
                await plugin.app.vault.modify(settingsFile, settingsContent);
            } else {
                await plugin.app.vault.create(`${worldPath}/Настройки_мира.md`, settingsContent);
            }

            // Создаем индексные файлы
            await this.createIndexFiles(worldPath, safeName, plugin);

            new Notice(`Мир "${safeName}" успешно создан!`);
            return worldPath;
        } catch (error) {
            console.error('Ошибка создания мира:', error);
            new Notice(`Ошибка создания мира: ${error.message}`);
            throw error;
        }
    }

    /**
     * Создает индексные файлы для мира
     */
    async createIndexFiles(worldPath, worldName, plugin) {
        const indexFiles = [
            { template: 'Локации', path: `${worldPath}/Локации/Локации.md` },
            { template: 'Персонажи', path: `${worldPath}/Персонажи/Персонажи.md` },
            { template: 'Сюжетные_линии', path: `${worldPath}/Сюжетные_линии/Сюжетные_линии.md` }
        ];

        for (const indexFile of indexFiles) {
            try {
                const content = await this.templateManager.generateFromTemplate(indexFile.template, {
                    projectName: worldName
                }, plugin);

                const file = plugin.app.vault.getAbstractFileByPath(indexFile.path);
                if (file) {
                    await plugin.app.vault.modify(file, content);
                } else {
                    await plugin.app.vault.create(indexFile.path, content);
                }
            } catch (error) {
                console.error(`Ошибка создания индексного файла ${indexFile.path}:`, error);
            }
        }
    }

    /**
     * Обеспечивает существование инфраструктуры сущности
     */
    async ensureEntityInfrastructure(folder, fileName, app) {
        try {
            // Создаем папку если не существует
            const folderObj = app.vault.getAbstractFileByPath(folder);
            if (!folderObj) {
                await app.vault.createFolder(folder);
            }

            // Создаем файл если не существует
            const filePath = `${folder}/${fileName}`;
            const fileObj = app.vault.getAbstractFileByPath(filePath);
            if (!fileObj) {
                const content = `# ${fileName.replace('.md', '')}\n\n*Файл создан автоматически*`;
                await app.vault.create(filePath, content);
            }
        } catch (error) {
            console.error(`Ошибка создания инфраструктуры ${folder}/${fileName}:`, error);
        }
    }

    /**
     * Получает список всех проектов
     */
    async getAllProjects(app) {
        try {
            const projects = [];
            const root = app.vault.getRoot();
            
            if (root && root.children) {
                for (const child of root.children) {
                    if (child instanceof TFolder) {
                        const settingsFile = child.children.find(f => f.name === 'Настройки_мира.md');
                        if (settingsFile) {
                            projects.push({
                                name: child.name,
                                path: child.path,
                                settingsFile: settingsFile
                            });
                        }
                    }
                }
            }
            
            return projects;
        } catch (error) {
            console.error('Ошибка получения списка проектов:', error);
            return [];
        }
    }

    /**
     * Получает текущий проект
     */
    async getCurrentProject(app) {
        try {
            const activeFile = app.workspace.getActiveFile();
            if (!activeFile) {
                return null;
            }

            return window.findProjectRoot(app, activeFile.path);
        } catch (error) {
            console.error('Ошибка получения текущего проекта:', error);
            return null;
        }
    }

    /**
     * Проверяет, является ли папка проектом
     */
    isProjectFolder(folder) {
        if (!folder || !folder.children) {
            return false;
        }

        return folder.children.some(child => child.name === 'Настройки_мира.md');
    }

    /**
     * Получает настройки проекта
     */
    async getProjectSettings(projectPath, app) {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(`${projectPath}/Настройки_мира.md`);
            if (!settingsFile) {
                return null;
            }

            const content = await app.vault.read(settingsFile);
            return this.parseProjectSettings(content);
        } catch (error) {
            console.error(`Ошибка получения настроек проекта ${projectPath}:`, error);
            return null;
        }
    }

    /**
     * Парсит настройки проекта из YAML
     */
    parseProjectSettings(content) {
        try {
            const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
            if (!yamlMatch) {
                return {};
            }

            const yamlContent = yamlMatch[1];
            const settings = {};
            
            yamlContent.split('\n').forEach(line => {
                const match = line.match(/^([^:]+):\s*(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();
                    
                    // Обрабатываем массивы
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
                    }
                    // Обрабатываем строки в кавычках
                    else if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    settings[key] = value;
                }
            });

            return settings;
        } catch (error) {
            console.error('Ошибка парсинга настроек проекта:', error);
            return {};
        }
    }

    /**
     * Сохраняет настройки проекта
     */
    async saveProjectSettings(projectPath, settings, app) {
        try {
            const settingsFile = app.vault.getAbstractFileByPath(`${projectPath}/Настройки_мира.md`);
            if (!settingsFile) {
                throw new Error('Файл настроек проекта не найден');
            }

            const content = await app.vault.read(settingsFile);
            const yamlContent = this.settingsToYaml(settings);
            const newContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, `---\n${yamlContent}\n---\n`);
            
            await app.vault.modify(settingsFile, newContent);
            return true;
        } catch (error) {
            console.error(`Ошибка сохранения настроек проекта ${projectPath}:`, error);
            return false;
        }
    }

    /**
     * Конвертирует настройки в YAML
     */
    settingsToYaml(settings) {
        let yaml = '';
        for (const [key, value] of Object.entries(settings)) {
            if (Array.isArray(value)) {
                yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
            } else {
                yaml += `${key}: "${value}"\n`;
            }
        }
        return yaml;
    }

    /**
     * Создает резервную копию проекта
     */
    async backupProject(projectPath, app) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `Backups/${projectPath}_${timestamp}`;
            
            // Создаем папку для бэкапа
            await app.vault.createFolder(backupPath);
            
            // Копируем все файлы проекта
            const projectFolder = app.vault.getAbstractFileByPath(projectPath);
            if (projectFolder && projectFolder.children) {
                for (const child of projectFolder.children) {
                    await this.copyFileRecursive(child, backupPath, app);
                }
            }
            
            new Notice(`Резервная копия создана: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error(`Ошибка создания резервной копии ${projectPath}:`, error);
            new Notice(`Ошибка создания резервной копии: ${error.message}`);
            return null;
        }
    }

    /**
     * Рекурсивно копирует файл или папку
     */
    async copyFileRecursive(source, destPath, app) {
        try {
            if (source instanceof TFile) {
                const content = await app.vault.read(source);
                const newPath = `${destPath}/${source.name}`;
                await app.vault.create(newPath, content);
            } else if (source instanceof TFolder) {
                const newFolderPath = `${destPath}/${source.name}`;
                await app.vault.createFolder(newFolderPath);
                
                if (source.children) {
                    for (const child of source.children) {
                        await this.copyFileRecursive(child, newFolderPath, app);
                    }
                }
            }
        } catch (error) {
            console.error(`Ошибка копирования ${source.path}:`, error);
        }
    }
}

// Экспортируем класс
module.exports = { ProjectManager };

// Глобализируем для использования в main.js
if (typeof window !== 'undefined') {
    window.ProjectManager = ProjectManager;
}
