// Миграционный скрипт для обновления структуры папок
// Запускать в Obsidian через Developer Console

(function() {
    'use strict';
    
    // В Developer Console app доступен глобально
    const app = window.app || this.app;
    const vault = app.vault;
    
    if (!app || !vault) {
        console.error('❌ Не удалось получить доступ к Obsidian API. Убедитесь, что скрипт запущен в Developer Console Obsidian.');
        return;
    }
    
    console.log('🚀 Запуск миграции структуры папок...');
    
    // Карта перемещений: старый_путь -> новый_путь
    const migrations = [
        // Перемещение в Локации/
        { from: 'Государства', to: 'Локации/Государства' },
        { from: 'Провинции', to: 'Локации/Провинции' },
        { from: 'Фракции', to: 'Локации/Фракции' },
        { from: 'Торговые_пути', to: 'Локации/Торговые_пути' },
        
        // Перемещение в Рукопись/
        { from: 'Главы', to: '1_Рукопись/Главы' },
        { from: 'События', to: '1_Рукопись/События' },
        { from: 'Конфликты', to: '1_Рукопись/Конфликты' },
        { from: 'Квесты', to: '1_Рукопись/Квесты' }
    ];
    
    // Создание новых папок
    const newFolders = [
        '1_Рукопись',
        'Локации',
        'Локации/Государства',
        'Локации/Провинции', 
        'Локации/Фракции',
        'Локации/Торговые_пути',
        'Локации/Города',
        'Локации/Деревни',
        'Локации/Замки',
        'Локации/Порты',
        'Локации/Шахты',
        'Локации/Фермы',
        'Локации/Заводы',
        'Локации/Мёртвые_зоны',
        '1_Рукопись/Главы',
        '1_Рукопись/События',
        '1_Рукопись/Конфликты',
        '1_Рукопись/Квесты'
    ];
    
    async function createFolders() {
        console.log('📁 Создание новых папок...');
        
        for (const folderPath of newFolders) {
            try {
                const folder = vault.getAbstractFileByPath(folderPath);
                if (!folder) {
                    await vault.createFolder(folderPath);
                    console.log(`✅ Создана папка: ${folderPath}`);
                } else {
                    console.log(`ℹ️ Папка уже существует: ${folderPath}`);
                }
            } catch (error) {
                console.warn(`⚠️ Ошибка создания папки ${folderPath}:`, error);
            }
        }
    }
    
    async function migrateFiles() {
        console.log('📦 Перемещение файлов...');
        
        for (const migration of migrations) {
            try {
                const sourceFolder = vault.getAbstractFileByPath(migration.from);
                if (!sourceFolder || !sourceFolder.children) {
                    console.log(`ℹ️ Папка не найдена: ${migration.from}`);
                    continue;
                }
                
                console.log(`🔄 Перемещение из ${migration.from} в ${migration.to}...`);
                
                for (const file of sourceFolder.children) {
                    if (file.extension === 'md') {
                        const newPath = `${migration.to}/${file.name}`;
                        
                        try {
                            // Проверяем, не существует ли уже файл в новой папке
                            const existingFile = vault.getAbstractFileByPath(newPath);
                            if (existingFile) {
                                console.warn(`⚠️ Файл уже существует: ${newPath}`);
                                continue;
                            }
                            
                            // Перемещаем файл
                            await vault.rename(file, newPath);
                            console.log(`✅ Перемещён: ${file.path} → ${newPath}`);
                            
                        } catch (error) {
                            console.error(`❌ Ошибка перемещения ${file.path}:`, error);
                        }
                    }
                }
                
                // Удаляем пустую исходную папку
                if (sourceFolder.children.length === 0) {
                    await vault.delete(sourceFolder);
                    console.log(`🗑️ Удалена пустая папка: ${migration.from}`);
                }
                
            } catch (error) {
                console.error(`❌ Ошибка миграции ${migration.from}:`, error);
            }
        }
    }
    
    async function migrateScenes() {
        console.log('🎭 Миграция сцен в главы...');
        
        try {
            const scenesFolder = vault.getAbstractFileByPath('Сцены');
            if (!scenesFolder || !scenesFolder.children) {
                console.log('ℹ️ Папка Сцены не найдена');
                return;
            }
            
            // Получаем список глав
            const chaptersFolder = vault.getAbstractFileByPath('1_Рукопись/Главы');
            if (!chaptersFolder || !chaptersFolder.children) {
                console.log('ℹ️ Папка глав не найдена');
                return;
            }
            
            const chapters = chaptersFolder.children.filter(f => f.extension === 'md' && f.basename !== 'Главы');
            
            for (const scene of scenesFolder.children) {
                if (scene.extension !== 'md') continue;
                
                // Ищем главу по тегу или названию
                let targetChapter = null;
                
                try {
                    const sceneContent = await vault.read(scene);
                    const chapterMatch = sceneContent.match(/#глава[:\s]+([^\n\r]+)/);
                    
                    if (chapterMatch) {
                        const chapterName = chapterMatch[1].trim();
                        targetChapter = chapters.find(c => c.basename.includes(chapterName));
                    }
                } catch (error) {
                    console.warn(`⚠️ Ошибка чтения сцены ${scene.path}:`, error);
                }
                
                if (!targetChapter) {
                    // Если не нашли по тегу, используем первую главу
                    targetChapter = chapters[0];
                }
                
                if (targetChapter) {
                    const newPath = `${targetChapter.parent.path}/Сцены/${scene.name}`;
                    
                    try {
                        // Создаём папку Сцены в главе, если её нет
                        const scenesInChapter = vault.getAbstractFileByPath(`${targetChapter.parent.path}/Сцены`);
                        if (!scenesInChapter) {
                            await vault.createFolder(`${targetChapter.parent.path}/Сцены`);
                        }
                        
                        await vault.rename(scene, newPath);
                        console.log(`✅ Сцена перемещена: ${scene.path} → ${newPath}`);
                        
                    } catch (error) {
                        console.error(`❌ Ошибка перемещения сцены ${scene.path}:`, error);
                    }
                }
            }
            
            // Удаляем пустую папку Сцены
            if (scenesFolder.children.length === 0) {
                await vault.delete(scenesFolder);
                console.log('🗑️ Удалена пустая папка: Сцены');
            }
            
        } catch (error) {
            console.error('❌ Ошибка миграции сцен:', error);
        }
    }
    
    async function updateTags() {
        console.log('🏷️ Обновление тегов...');
        
        // Получаем все markdown файлы
        const files = vault.getMarkdownFiles();
        
        for (const file of files) {
            try {
                const content = await vault.read(file);
                let updated = false;
                let newContent = content;
                
                // Обновляем теги согласно новой структуре
                const tagUpdates = [
                    { old: '#государство', new: '#государство #локация' },
                    { old: '#провинция', new: '#провинция #локация' },
                    { old: '#фракция', new: '#фракция #локация' },
                    { old: '#торговый_путь', new: '#торговый_путь #локация' },
                    { old: '#глава', new: '#глава #1_рукопись' },
                    { old: '#сцена', new: '#сцена #1_рукопись' },
                    { old: '#событие', new: '#событие #1_рукопись' },
                    { old: '#конфликт', new: '#конфликт #1_рукопись' },
                    { old: '#квест', new: '#квест #1_рукопись' }
                ];
                
                for (const update of tagUpdates) {
                    if (newContent.includes(update.old) && !newContent.includes(update.new)) {
                        newContent = newContent.replace(update.old, update.new);
                        updated = true;
                    }
                }
                
                if (updated) {
                    await vault.modify(file, newContent);
                    console.log(`✅ Обновлены теги: ${file.path}`);
                }
                
            } catch (error) {
                console.warn(`⚠️ Ошибка обновления тегов ${file.path}:`, error);
            }
        }
    }
    
    async function runMigration() {
        try {
            await createFolders();
            await migrateFiles();
            await migrateScenes();
            await updateTags();
            
            console.log('🎉 Миграция завершена успешно!');
            new Notice('Миграция структуры папок завершена');
            
        } catch (error) {
            console.error('❌ Ошибка миграции:', error);
            new Notice('Ошибка миграции: ' + error.message);
        }
    }
    
    // Запускаем миграцию
    runMigration();
    
})();
