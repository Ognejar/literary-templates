/**
 * @file       migrateExistingContent.js
 * @description Миграция существующих глав в новую систему эпох
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, findProjectRoot
 * @created    2025-08-29
 * @updated    2025-08-29
 */

async function migrateExistingContent(plugin, startPath = null) {
    try {
        console.log('=== migrateExistingContent вызвана ===');
        
        // Определить корень проекта
        let projectRoot = '';
        if (startPath) {
            projectRoot = findProjectRoot(plugin.app, startPath);
        } else {
            const activeFile = plugin.app.workspace.getActiveFile();
            if (activeFile) {
                projectRoot = findProjectRoot(plugin.app, activeFile.parent.path);
            }
        }
        
        if (!projectRoot) {
            console.error('Не удалось определить корень проекта');
            return;
        }
        
        console.log('projectRoot:', projectRoot);
        
        // Загрузить доступные эпохи
        const timelineService = new (require('../src/TimelineService').TimelineService)(plugin);
        const epochs = await timelineService.getEpochs(projectRoot);
        
        if (epochs.length === 0) {
            console.warn('Эпохи не найдены. Сначала создайте эпохи.');
            return;
        }
        
        // Найти существующие главы
        const existingChapters = await findExistingChapters(plugin, projectRoot);
        
        if (existingChapters.length === 0) {
            console.log('Существующие главы не найдены');
            return;
        }
        
        // Открыть модальное окно для миграции
        const { ContentMigrationModal } = require('./ContentMigrationModal');
        const modal = new ContentMigrationModal(plugin.app, plugin, {
            projectRoot,
            epochs,
            existingChapters,
            onMigrationComplete: async (migrationData) => {
                await performMigration(plugin, projectRoot, migrationData);
            }
        });
        
        modal.open();
        
    } catch (error) {
        console.error('Ошибка в migrateExistingContent:', error);
    }
}

async function findExistingChapters(plugin, projectRoot) {
    const chapters = [];
    
    try {
        // Поиск в старой структуре
        const oldChapterPaths = [
            `${projectRoot}/1_Рукопись/Главы`,
            `${projectRoot}/Главы`,
            `${projectRoot}/1_Рукопись/Глава`
        ];
        
        for (const path of oldChapterPaths) {
            const folder = plugin.app.vault.getAbstractFileByPath(path);
            if (folder && folder instanceof window.obsidian.TFolder) {
                const files = plugin.app.vault.getMarkdownFiles();
                const chapterFiles = files.filter(file => 
                    file.path.startsWith(path) && 
                    file.path.endsWith('.md')
                );
                
                for (const file of chapterFiles) {
                    try {
                        const content = await plugin.app.vault.read(file);
                        const frontmatter = extractFrontmatter(content);
                        
                        chapters.push({
                            path: file.path,
                            name: file.basename,
                            title: frontmatter.title || file.basename,
                            chapter: frontmatter.chapter || 0,
                            content: content,
                            frontmatter: frontmatter
                        });
                    } catch (error) {
                        console.warn('Ошибка чтения файла:', file.path, error);
                    }
                }
            }
        }
        
        console.log('Найдено глав для миграции:', chapters.length);
        
    } catch (error) {
        console.error('Ошибка поиска глав:', error);
    }
    
    return chapters;
}

function extractFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        try {
            // Простой парсер YAML
            const yaml = frontmatterMatch[1];
            const lines = yaml.split('\n');
            const result = {};
            
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
                    result[key] = value;
                }
            }
            
            return result;
        } catch (error) {
            console.warn('Ошибка парсинга frontmatter:', error);
        }
    }
    
    return {};
}

async function performMigration(plugin, projectRoot, migrationData) {
    try {
        console.log('Выполнение миграции:', migrationData);
        
        const { workId, epochId, chapters } = migrationData;
        
        // Создать структуру произведения если нужно
        const workFolder = `${projectRoot}/1_Рукопись/Произведения/${workId}`;
        await ensureFolder(workFolder, plugin.app);
        await ensureFolder(`${workFolder}/Главы`, plugin.app);
        
        // Мигрировать главы
        for (const chapterData of chapters) {
            if (chapterData.migrate) {
                await migrateChapter(plugin, workFolder, chapterData, epochId);
            }
        }
        
        console.log('Миграция завершена успешно');
        
    } catch (error) {
        console.error('Ошибка при выполнении миграции:', error);
    }
}

async function migrateChapter(plugin, workFolder, chapterData, epochId) {
    try {
        const { chapter, title, content, frontmatter } = chapterData;
        
        // Создать новое имя файла
        const newFileName = `Глава_${chapter.toString().padStart(2, '0')}_${title.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').replace(/\s+/g, '_')}.md`;
        const newPath = `${workFolder}/Главы/${newFileName}`;
        
        // Обновить frontmatter
        const updatedFrontmatter = {
            ...frontmatter,
            title: title,
            chapter: chapter,
            epoch: epochId,
            migrated: true,
            originalPath: chapterData.path
        };
        
        // Создать новый контент
        const newContent = generateMigratedContent(content, updatedFrontmatter);
        
        // Создать файл
        const file = await plugin.app.vault.createNewFile(newPath, newContent);
        
        if (file) {
            console.log('Глава мигрирована:', newPath);
            
            // Опционально: удалить оригинальный файл
            if (chapterData.deleteOriginal) {
                const originalFile = plugin.app.vault.getAbstractFileByPath(chapterData.path);
                if (originalFile) {
                    await plugin.app.vault.delete(originalFile);
                    console.log('Оригинальный файл удален:', chapterData.path);
                }
            }
        }
        
    } catch (error) {
        console.error('Ошибка миграции главы:', error);
    }
}

function generateMigratedContent(originalContent, frontmatter) {
    // Удалить старый frontmatter
    const contentWithoutFrontmatter = originalContent.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // Создать новый frontmatter
    const newFrontmatter = generateYamlFrontmatter(frontmatter);
    
    return `${newFrontmatter}\n\n${contentWithoutFrontmatter}`;
}

function generateYamlFrontmatter(data) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            lines.push(`${key}: "${value}"`);
        } else {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}

async function ensureFolder(folderPath, app) {
    try {
        const existing = app.vault.getAbstractFileByPath(folderPath);
        if (!existing) {
            await app.vault.createFolder(folderPath);
        } else if (!(existing instanceof window.obsidian.TFolder)) {
            throw new Error(`Путь ${folderPath} существует, но не является папкой`);
        }
    } catch (error) {
        if (!error.message.includes('Folder already exists')) {
            console.error('Ошибка при создании папки:', error);
        }
    }
}

module.exports = { migrateExistingContent };
