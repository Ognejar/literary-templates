/**
 * @file       createPotion.js
 * @description Функция создания зелья для плагина Literary Templates
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies PotionWizardModal, ensureEntityInfrastructure, findProjectRoot, generateFromTemplate
 * @created    2025-01-09
 * @updated    2025-08-12
 * @docs       docs/Карточка функционала.md
 */

// Классы Obsidian доступны глобально

/**
 * Создает новое зелье в указанном проекте
 * @param {Object} plugin - Экземпляр плагина
 * @param {string} startPath - Начальный путь для поиска проекта (может быть корнем проекта)
 * @param {Object} [options] - Доп. опции: { targetFile?: TFile, prefillName?: string }
 */
async function createPotion(plugin, startPath = '', options = {}) {
    try {
        await plugin.logDebug('=== createPotion вызвана ===');
        await plugin.logDebug('startPath: ' + startPath);

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
                await plugin.logDebug('Проекты не найдены!');
                return;
            }
            project = await plugin.selectProject(projects);
            if (!project) return;
        }
        await plugin.logDebug('project: ' + project);

        const modal = new PotionWizardModal(plugin.app, Modal, Setting, Notice, project, async (potionData) => {
            const cleanName = potionData.potionName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
            
            // Подготавливаем данные для шаблона
            const ingredients = [];
            for (let i = 1; i <= 3; i++) {
                const rawName = potionData[`ingredient${i}Name`];
                const name = rawName === 'manual' ? (potionData[`ingredient${i}Manual`] || '').trim() : (rawName || '').trim();
                if (name) {
                    const amount = (potionData[`ingredient${i}Amount`] || '').trim();
                    const source = (potionData[`ingredient${i}Source`] || '').trim();
                    const notes = (potionData[`ingredient${i}Notes`] || '').trim();
                    ingredients.push(`- **${name}** (${amount || 'Не указано'}) - ${source || 'Не указан'}${notes ? ` — ${notes}` : ''}`);
                }
            }

            const effects = [];
            for (let i = 1; i <= 3; i++) {
                const rawEffect = potionData[`effect${i}Name`];
                const effectName = rawEffect === 'manual' ? (potionData[`effect${i}Manual`] || '').trim() : (rawEffect || '').trim();
                if (effectName) {
                    const duration = (potionData[`effect${i}Duration`] || '').trim();
                    const desc = (potionData[`effect${i}Description`] || '').trim();
                    effects.push(`- **${effectName}** (${duration || 'Не указано'}) - ${desc || 'Не указано'}`);
                }
            }

            const tags = [1,2,3]
                .map(i => potionData[`tag${i}`] === 'manual' ? (potionData[`tag${i}Manual`] || '').trim() : (potionData[`tag${i}`] || '').trim())
                .filter(Boolean);
            const locations = [1,2]
                .map(i => potionData[`location${i}`] === 'manual' ? (potionData[`location${i}Manual`] || '').trim() : (potionData[`location${i}`] || '').trim())
                .filter(Boolean);

            // Подбираем картинку (по первому тегу, иначе по типу «Зелье»)
            let tagImage = '';
            try {
                if (typeof window !== 'undefined' && window.litSettingsService) {
                    if (tags && tags.length > 0) {
                        tagImage = window.litSettingsService.findTagImage(plugin.app, project, tags[0]);
                    }
                    if (!tagImage) {
                        tagImage = window.litSettingsService.findTagImage(plugin.app, project, 'Зелье');
                    }
                }
            } catch {}

            // Формируем данные для шаблона
            const data = {
                ...potionData,
                cleanName: cleanName,
                date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
                ingredientsContent: ingredients.join('\n') || 'Не указаны',
                effectsContent: effects.join('\n') || 'Не указаны',
                tagsContent: tags.join(', '),
                locationsContent: locations.map(l => `"${l}"`).join(', '),
                tagImage,
                // Подмена manual значений для сложности/времени
                preparationTime: potionData.preparationTime === 'manual' ? (potionData.preparationTimeManual || '') : potionData.preparationTime,
                complexity: potionData.complexity === 'manual' ? (potionData.complexityManual || '') : potionData.complexity,
                risksLimitationsContent: [
                    potionData.limitation1 ? `- **Ограничение:** ${potionData.limitation1}` : '',
                    potionData.risk1 ? `- **Риск:** ${potionData.risk1}` : '',
                    potionData.precaution1 ? `- **Меры предосторожности:** ${potionData.precaution1}` : '',
                    potionData.limitation2 ? `- **Ограничение:** ${potionData.limitation2}` : '',
                    potionData.risk2 ? `- **Риск:** ${potionData.risk2}` : '',
                    potionData.precaution2 ? `- **Меры предосторожности:** ${potionData.precaution2}` : '',
                    potionData.limitation3 ? `- **Ограничение:** ${potionData.limitation3}` : '',
                    potionData.risk3 ? `- **Риск:** ${potionData.risk3}` : '',
                    potionData.precaution3 ? `- **Меры предосторожности:** ${potionData.precaution3}` : ''
                ].filter(Boolean).join('\n')
            };

            // Генерируем контент из шаблона
            const content = await generateFromTemplate('Новое_зелье', data, plugin);
            
            // Если передан существующий пустой файл — записываем в него
            if (options && options.targetFile instanceof TFile) {
                await plugin.app.vault.modify(options.targetFile, content);
                await plugin.app.workspace.getLeaf(true).openFile(options.targetFile);
            } else {
                const fileName = cleanName;
                const targetFolder = `${project}/Магия/Зелья`;
                await ensureEntityInfrastructure(targetFolder, fileName, plugin.app);
                const targetPath = `${targetFolder}/${fileName}.md`;
                await safeCreateFile(targetPath, content, plugin.app);
                const file = plugin.app.vault.getAbstractFileByPath(targetPath);
                if (file instanceof TFile) {
                    await plugin.app.workspace.getLeaf(true).openFile(file);
                }
            }
            // Автодобавление ингредиентов/эффектов/тегов/локаций/инструментов в справочники при необходимости
            try {
                if (potionData.addToReference) {
                    const base = `${project}/Магия/Справочники`;
                    const refFilePath = `${base}/Ингредиенты_зелий.md`;
                    // Собираем названия ингредиентов (учитываем ручной ввод)
                    const ingredientNames = [];
                    for (let i = 1; i <= 3; i++) {
                        const name = (potionData[`ingredient${i}Name`] === 'manual')
                            ? (potionData[`ingredient${i}Manual`] || '').trim()
                            : (potionData[`ingredient${i}Name`] || '').trim();
                        if (name) ingredientNames.push(name);
                    }
                    if (ingredientNames.length > 0) {
                        // Читаем текущее содержимое справочника (если есть)
                        let current = '';
                        try {
                            const f = plugin.app.vault.getAbstractFileByPath(refFilePath);
                            if (f) current = await plugin.app.vault.read(f);
                        } catch {}
                        const existing = new Set(current.split('\n').map(s => s.trim()).filter(Boolean));
                        let added = false;
                        ingredientNames.forEach(n => {
                            if (!existing.has(n)) {
                                existing.add(n);
                                added = true;
                            }
                        });
                        if (added) {
                            const lines = Array.from(existing).sort((a, b) => a.localeCompare(b, 'ru'));
                            if (plugin.app.vault.getAbstractFileByPath(refFilePath)) {
                                await plugin.app.vault.adapter.write(refFilePath, lines.join('\n'));
                            } else {
                                // Убедимся, что папка существует
                                try { await plugin.app.vault.createFolder(base); } catch {}
                                await plugin.app.vault.create(refFilePath, lines.join('\n'));
                            }
                        }
                    }

                    // Эффекты
                    const effectNames = [];
                    for (let i = 1; i <= 3; i++) {
                        const rawEffect = potionData[`effect${i}Name`];
                        const eff = rawEffect === 'manual' ? (potionData[`effect${i}Manual`] || '').trim() : (rawEffect || '').trim();
                        if (eff) effectNames.push(eff);
                    }
                    await updateReference(plugin, `${base}/Эффекты_зелий.md`, effectNames);

                    // Теги
                    const tagNames = [1,2,3]
                        .map(i => potionData[`tag${i}`] === 'manual' ? (potionData[`tag${i}Manual`] || '').trim() : (potionData[`tag${i}`] || '').trim())
                        .filter(Boolean);
                    await updateReference(plugin, `${base}/Теги_зелий.md`, tagNames);

                    // Локации
                    const locationNames = [1,2]
                        .map(i => potionData[`location${i}`] === 'manual' ? (potionData[`location${i}Manual`] || '').trim() : (potionData[`location${i}`] || '').trim())
                        .filter(Boolean);
                    await updateReference(plugin, `${base}/Локации_зелий.md`, locationNames);

                    // Инструменты (из собранной строки tools)
                    const instruments = (potionData.tools || '').split(',').map(s => s.trim()).filter(Boolean);
                    await updateReference(plugin, `${base}/Инструменты_зельеварения.md`, instruments);

                    // Сложность, Время — тоже фиксируем, если ручной ввод
                    const complexity = potionData.complexity === 'manual' ? (potionData.complexityManual || '').trim() : '';
                    if (complexity) await updateReference(plugin, `${base}/Сложности_зелий.md`, [complexity]);
                    const prepTime = potionData.preparationTime === 'manual' ? (potionData.preparationTimeManual || '').trim() : '';
                    if (prepTime) await updateReference(plugin, `${base}/Время_приготовления_зелий.md`, [prepTime]);
                }
            } catch (e) {
                await plugin.logDebug('Не удалось обновить справочник ингредиентов: ' + e.message);
            }

            new Notice(`Создано зелье: ${fileName}`);
        }, options);
        modal.open();
    } catch (error) {
        new Notice('Ошибка при создании зелья: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
    }
}

module.exports = { createPotion };

async function updateReference(plugin, filePath, names) {
  try {
    const app = plugin.app;
    const base = filePath.split('/').slice(0, -1).join('/');
    const clean = (names || []).map(s => String(s || '').trim()).filter(Boolean);
    if (clean.length === 0) return;
    let current = '';
    try {
      const f = app.vault.getAbstractFileByPath(filePath);
      if (f) current = await app.vault.read(f);
    } catch {}
    const existing = new Set(current.split('\n').map(s => s.trim()).filter(Boolean));
    let added = false;
    clean.forEach(n => {
      if (!existing.has(n)) { existing.add(n); added = true; }
    });
    if (!added) return;
    const lines = Array.from(existing).sort((a, b) => a.localeCompare(b, 'ru'));
    if (app.vault.getAbstractFileByPath(filePath)) {
      await app.vault.adapter.write(filePath, lines.join('\n'));
    } else {
      try { await app.vault.createFolder(base); } catch {}
      await app.vault.create(filePath, lines.join('\n'));
    }
  } catch (e) {
    await plugin.logDebug('updateReference error: ' + e.message);
  }
}
