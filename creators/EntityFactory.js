/**
 * @file       EntityFactory.js
 * @description Универсальная фабрика для создания сущностей мира
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies main.js, modals.js
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

/**
 * Универсальная фабрика для создания сущностей
 * Применяет принципы DRY, KISS, SRP
 */
class EntityFactory {
    constructor(plugin) {
        this.plugin = plugin;
    }

    /**
     * Создает сущность с использованием модального окна
     * @param {string} entityType - Тип сущности (City, State, Province, etc.)
     * @param {string} startPath - Начальный путь для поиска проекта
     * @param {Object} options - Дополнительные опции
     */
    async createEntity(entityType, startPath = '', options = {}) {
        try {
            // 1. Определяем проект (SRP: одна ответственность)
            const project = await this.resolveProject(startPath);
            if (!project) return;

            // 2. Получаем модальное окно (SRP: одна ответственность)
            const ModalClass = this.getModalClass(entityType);
            if (!ModalClass) {
                throw new Error(`Модальное окно для ${entityType} не найдено`);
            }

            // 3. Создаем модальное окно с callback (SRP: одна ответственность)
            const modal = new ModalClass(
                this.plugin.app, 
                Modal, 
                Setting, 
                Notice, 
                project, 
                async (entityData) => {
                    await this.handleEntityCreation(entityType, project, entityData, options);
                }
            );

            modal.open();
        } catch (error) {
            new Notice(`Ошибка при создании ${entityType}: ${error.message}`);
            await this.plugin.logDebug('Ошибка: ' + error.message);
        }
    }

    /**
     * Разрешает проект (SRP: одна ответственность)
     */
    async resolveProject(startPath) {
        // 1. Проверяем, находится ли startPath внутри проекта
        if (startPath) {
            const projectRoot = window.findProjectRoot(this.plugin.app, startPath);
            if (projectRoot) {
                // Проверяем валидность проекта через ensureValidProjectRoot
                const validProjectRoot = await this.ensureValidProjectRoot(projectRoot);
                if (validProjectRoot) {
                    return validProjectRoot;
                }
            }
        }
        
        // 2. Если startPath не в проекте, проверяем текущий проект из настроек
        try {
            if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
                const ctx = await window.litSettingsService.resolveContext(this.plugin.app, startPath);
                const currentProject = ctx.projectRoot || '';
                
                if (currentProject) {
                    // Проверяем валидность текущего проекта через ensureValidProjectRoot
                    const validProjectRoot = await this.ensureValidProjectRoot(currentProject);
                    if (validProjectRoot) {
                        return validProjectRoot;
                    }
                }
            }
        } catch (e) {
            // Игнорируем ошибки контекстного резолвера
        }
        
        // 3. Если нет текущего проекта, запрашиваем выбор
        
        // Ищем все проекты
        const allFiles = this.plugin.app.vault.getMarkdownFiles();
        const projectFiles = allFiles.filter(f => f.basename === 'Настройки_мира');
        const projects = projectFiles.map(f => f.parent.path);
        
        if (projects.length === 0) {
            new Notice('Проекты не найдены!');
            await this.plugin.logDebug('Проекты не найдены!');
            return null;
        }

        // Показываем модальное окно выбора проекта
        return new Promise((resolve) => {
            const modal = new window.ProjectSelectorModal(this.plugin.app, Modal, Setting, Notice, projects, (selectedProject) => {
                resolve(selectedProject);
            });
            modal.open();
        });
    }

    /**
     * Обеспечивает валидность проекта через EntityWizardBase
     * @param {string} projectRoot - путь к проекту для проверки
     * @returns {Promise<string>} - валидный путь к проекту или ''
     */
    async ensureValidProjectRoot(projectRoot) {
        // Создаем временный экземпляр EntityWizardBase для использования метода
        const tempWizard = new window.EntityWizardBase(this.plugin.app, Modal, Setting, Notice);
        return await tempWizard.ensureValidProjectRoot(projectRoot);
    }

    /**
     * Получает класс модального окна по типу сущности (SRP: одна ответственность)
     */
    getModalClass(entityType) {
        const modalMap = {
            'City': window.CityWizardModal,
            'State': window.StateWizardModal,
            'Province': window.ProvinceWizardModal,
            'Village': window.VillageWizardModal,
            'Location': window.LocationWizardModal,
            'Port': window.PortWizardModal,
            'Castle': window.CastleWizardModal,
            'DeadZone': window.DeadZoneWizardModal,
            'Farm': window.FarmWizardModal,
            'Mine': window.MineWizardModal,
            'Factory': window.FactoryWizardModal,
            'Character': window.CharacterWizardModal,
            'Monster': window.MonsterWizardModal,
            'Artifact': window.ArtifactWizardModal,
            'Spell': window.SpellWizardModal,
            'Potion': window.PotionWizardModal,
            'AlchemyRecipe': window.AlchemyRecipeWizardModal,
            'Task': window.TaskWizardModal,
            'Scene': window.SceneWizardModal,
            'Work': window.WorkCreationModal,
            'Conflict': window.ConflictWizardModal,
            'Organization': window.OrganizationWizardModal,
            'Religion': window.ReligionWizardModal,
            'Cult': window.CultWizardModal,
            'TradeRoute': window.TradeRouteWizardModal,
            'SocialInstitution': window.SocialInstitutionWizardModal,
            'Faction': window.FactionWizardModal,
            'Quest': window.QuestWizardModal,
            'Event': window.EventWizardModal,
            'People': window.PeopleWizardModal
        };

        return modalMap[entityType];
    }

    /**
     * Обрабатывает создание сущности (SRP: одна ответственность)
     */
    async handleEntityCreation(entityType, project, entityData, options) {
        try {
            await this.plugin.logDebug(`=== Обработка данных ${entityType} ===`);
            await this.plugin.logDebug('entityData: ' + JSON.stringify(entityData));

            // 1. Подготавливаем данные для шаблона (SRP: одна ответственность)
            const templateData = await this.prepareTemplateData(entityType, project, entityData, options);

            // 2. Генерируем контент (SRP: одна ответственность)
            const content = await this.generateContent(entityType, templateData);

            // 3. Создаем файл (SRP: одна ответственность)
            const file = await this.createEntityFile(entityType, project, entityData, content);

            // 4. Открываем файл (SRP: одна ответственность)
            if (file) {
                await this.plugin.app.workspace.getLeaf().openFile(file);
                new Notice(`Создан ${this.getEntityDisplayName(entityType)}: ${file.basename}`);
            }
        } catch (error) {
            await this.plugin.logDebug(`Ошибка в обработке данных ${entityType}: ${error.message}`);
            new Notice(`Ошибка при создании ${entityType}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Подготавливает данные для шаблона (SRP: одна ответственность)
     */
    async prepareTemplateData(entityType, project, entityData, options) {
        const baseData = {
            ...entityData,
            date: window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10),
            project: project,
            projectName: project.split('/').pop()
        };

        // Вместо длинного switch-case:
        const methodName = `prepare${entityType}Data`;
        if (typeof this[methodName] === 'function') {
            return this[methodName](project, entityData, baseData);
        }
        return baseData;
    }

    /**
     * Утилита для маппинга полей с поддержкой fallback-ключей
     * @param {object} source - объект-источник (обычно entityData)
     * @param {Record<string, string|string[]>} mapping - маппинг {targetField: sourceKey | [sourceKey1, sourceKey2]}
     * @param {Record<string, any>} defaults - значения по умолчанию для целевых полей
     */
    mapFields(source, mapping, defaults = {}) {
        const result = {};
        for (const [target, src] of Object.entries(mapping)) {
            let value = '';
            if (Array.isArray(src)) {
                for (const key of src) {
                    if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== '') {
                        value = source[key];
                        break;
                    }
                }
            } else {
                value = source[src];
            }
            if (value === undefined || value === null || String(value).trim() === '') {
                value = (defaults[target] !== undefined) ? defaults[target] : '';
            }
            result[target] = value;
        }
        return result;
    }

    /**
     * Подготавливает данные для города (SRP: одна ответственность)
     */
    prepareCityData(project, entityData, baseData) {
        const mainIndustriesContent = entityData.mainIndustries ? entityData.mainIndustries.map(i => `- ${i}`).join('\n') : '';
        const districtsContent = entityData.districts ? entityData.districts.map(d => `- ${d}`).join('\n') : '';
        const uniqueFeaturesContent = entityData.uniqueFeatures ? entityData.uniqueFeatures.map(f => `- ${f}`).join('\n') : '';

        return {
            ...baseData,
            name: entityData.cityName, // Единое поле name для всех локаций
            state: entityData.state || '', // Прямо используем state из entityData
            province: entityData.province || '', // Добавляем поле province
            typeLower: (entityData.type || 'Город').toLowerCase(), // Добавляем typeLower
            dominantFaction: entityData.dominantFaction || '', // Единое поле для всех локаций
            mainIndustriesSection: mainIndustriesContent || 'Не указаны',
            districtsSection: districtsContent || 'Не указаны',
            uniqueFeaturesSection: uniqueFeaturesContent || 'Не указаны',
            imageBlock: this.findTagImage(project, 'Город')
        };
    }

    /**
     * Подготавливает данные для государства (SRP: одна ответственность)
     */
    prepareStateData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['stateName', 'name'],
            dominantFaction: ['dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Государство').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Государство')
        };
    }

    /**
     * Подготавливает данные для провинции (SRP: одна ответственность)
     */
    prepareProvinceData(project, entityData, baseData) {
        const minorFactionsContent = entityData.minorFactions ? entityData.minorFactions.map(f => `- ${f}`).join('\n') : '';
        const citiesContent = entityData.cities ? entityData.cities.map(c => `- [[${c}]]`).join('\n') : '';
        const villagesContent = entityData.villages ? entityData.villages.map(v => `- [[${v}]]`).join('\n') : '';

        return {
            ...baseData,
            name: entityData.provinceName || entityData.name || '', // Единое поле name
            typeLower: (entityData.type || 'Провинция').toLowerCase(), // Добавляем typeLower
            dominantFaction: entityData.dominantFaction || '', // Единое поле для всех локаций
            minorFactionsSection: minorFactionsContent || 'Не указаны',
            citiesSection: citiesContent || 'Не указаны',
            villagesSection: villagesContent || 'Не указаны',
            imageBlock: this.findTagImage(project, 'Провинция')
        };
    }

    /**
     * Подготавливает данные для деревни (SRP: одна ответственность)
     */
    prepareVillageData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['villageName', 'name'],
            dominantFaction: ['faction', 'dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Деревня').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Деревня')
        };
    }

    /**
     * Ищет изображение для тега (SRP: одна ответственность)
     */
    findTagImage(project, baseName) {
        const tagFolder = `${project}/Теговые_картинки`;
        const exts = ['jpg', 'jpeg', 'png', 'webp'];
        
        for (const ext of exts) {
            const path = `${tagFolder}/${baseName}.${ext}`;
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (file && file.extension) { // Проверяем наличие extension вместо instanceof
                return `![[${path}]]`;
            }
        }
        return '';
    }

    /**
     * Подготавливает данные для замка (SRP: одна ответственность)
     */
    prepareCastleData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['castleName', 'name'],
            dominantFaction: ['dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Замок').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Замок')
        };
    }

    /**
     * Подготавливает данные для порта (SRP: одна ответственность)
     */
    preparePortData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['portName', 'name'],
            dominantFaction: ['dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Порт').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Порт')
        };
    }

    /**
     * Подготавливает данные для фермы (SRP: одна ответственность)
     */
    prepareFarmData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['farmName', 'name'],
            dominantFaction: ['dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Ферма').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Ферма')
        };
    }

    /**
     * Подготавливает данные для шахты (SRP: одна ответственность)
     */
    prepareMineData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['mineName', 'name'],
            dominantFaction: ['dominantFaction'],
            resources: ['resources'],
            methods: ['methods'],
            features: ['features']
        });
        // Секция производства: только ресурсы и методы (без стволов)
        const productionParts = [];
        if (Array.isArray(mapped.resources) && mapped.resources.length) {
            productionParts.push(`### Ресурсы\n` + mapped.resources.map(r => `- ${r}`).join('\n'));
        }
        if (Array.isArray(mapped.methods) && mapped.methods.length) {
            productionParts.push(`### Методы добычи\n` + mapped.methods.map(m => `- ${m}`).join('\n'));
        }
        return {
            ...baseData,
            ...mapped,
            type: 'Шахта',
            typeLower: (entityData.type || 'Шахта').toLowerCase(),
            production: productionParts.join('\n\n'),
            imageBlock: this.findTagImage(project, 'Шахта')
        };
    }

    /**
     * Подготавливает данные для завода (SRP: одна ответственность)
     */
    prepareFactoryData(project, entityData, baseData) {
        const mapped = this.mapFields(entityData, {
            name: ['factoryName', 'name'],
            dominantFaction: ['dominantFaction']
        });
        return {
            ...baseData,
            ...mapped,
            typeLower: (entityData.type || 'Завод').toLowerCase(),
            imageBlock: this.findTagImage(project, 'Завод')
        };
    }

    /**
     * Подготавливает данные для локации (SRP: одна ответственность)
     */
    prepareLocationData(project, entityData, baseData) {
        return {
            ...baseData,
            name: entityData.locationName || entityData.name || '', // Единое поле name
            type: entityData.type || '', // Тип локации
            climate: entityData.climate || '', // Климат
            typeLower: (entityData.type || 'локация').toLowerCase(), // Добавляем typeLower
            province: entityData.province || '', // Провинция
            state: entityData.state || '', // Государство
            status: entityData.status || 'действует', // Статус
            statusReason: entityData.statusReason || '', // Причина статуса
            description: entityData.description || '', // Описание
            imageBlock: this.findTagImage(project, 'Локация')
        };
    }

    /**
     * Подготавливает данные для мёртвой зоны (SRP: одна ответственность)
     */
    prepareDeadZoneData(project, entityData, baseData) {
        return {
            ...baseData,
            name: entityData.zoneName || entityData.name || '',
            type: 'Мёртвая зона',
            climate: entityData.climate || '',
            province: entityData.province || '',
            state: entityData.state || '',
            status: entityData.status || 'заброшено',
            statusReason: entityData.statusReason || '',
            description: entityData.description || '',
            oldEconomy: entityData.oldEconomy || '',
            currentState: entityData.currentState || '',
            findingsContent: (entityData.findings || []).map(f => `- ${f}`).join('\n'),
            imageBlock: this.findTagImage(project, 'Мёртвая зона')
        };
    }

    /**
     * Генерирует контент из шаблона (SRP: одна ответственность)
     */
    async generateContent(entityType, templateData) {
        const templateName = this.getTemplateName(entityType);
        try {
            if (this.plugin && typeof this.plugin.logDebug === 'function') {
                await this.plugin.logDebug(`[Factory] generateContent: ${entityType} -> ${templateName}`);
            }
            // Используем TemplateManager напрямую, чтобы гарантировать include и секции
            const manager = new window.TemplateManager(this.plugin);
            const content = await manager.generateFromTemplate(templateName, templateData, this.plugin);
            if (this.plugin && typeof this.plugin.logDebug === 'function') {
                await this.plugin.logDebug(`[Factory] generated length: ${content ? content.length : 0}`);
                await this.plugin.logDebug(`[Factory] templateData keys: ${Object.keys(templateData).join(',')}`);
            }
            return content;
        } catch (e) {
            if (this.plugin && typeof this.plugin.logDebug === 'function') {
                await this.plugin.logDebug(`[Factory] generateContent error: ${e.message}`);
            }
            // Фолбэк на старый маршрут
            return await window.generateFromTemplate(templateName, templateData, this.plugin);
        }
    }

    /**
     * Получает имя шаблона по типу сущности (SRP: одна ответственность)
     */
    getTemplateName(entityType) {
        const templateMap = {
            'City': 'Новый_город',
            'State': 'Новое_государство',
            'Province': 'Новая_провинция',
            'Village': 'Новая_деревня',
            'Location': 'Новая_локация',
            'Port': 'Новый_порт',
            'Castle': 'Новый_замок',
            'DeadZone': 'Новая_мертвая_зона',
            'Farm': 'Новая_ферма',
            'Mine': 'Новая_шахта',
            'Factory': 'Новый_завод',
            'Character': 'Новый_персонаж',
            'Monster': 'Новый_монстр',
            'Artifact': 'Новый_артефакт',
            'Spell': 'Новое_заклинание',
            'Potion': 'Новое_зелье',
            'AlchemyRecipe': 'Новый_рецепт_алхимии',
            'Task': 'Новая_задача',
            'Scene': 'Новая_сцена',
            'Chapter': 'Новая_глава',
            'Work': 'Новое_произведение',
            'Conflict': 'Новый_конфликт',
            'Organization': 'Новая_организация',
            'Religion': 'Новая_религия',
            'Cult': 'Новый_культ',
            'TradeRoute': 'Новый_торговый_путь',
            'SocialInstitution': 'Новое_социальное_учреждение',
            'Faction': 'Новая_фракция',
            'Quest': 'Новый_квест',
            'Event': 'Новое_событие',
            'People': 'Новый_народ'
        };

        return templateMap[entityType] || `Новый_${entityType.toLowerCase()}`;
    }

    /**
     * Создает файл сущности (SRP: одна ответственность)
     */
    async createEntityFile(entityType, project, entityData, content) {
        const cleanName = this.getCleanFileName(entityType, entityData);
        const targetFolder = this.getTargetFolder(entityType, project);
        
        // Готовим только инфраструктуру папки (и индекс), не создаём файл с именем сущности заранее
        await window.ensureEntityInfrastructure(targetFolder, 'Шахты.md', this.plugin.app);
        
        const fileName = await this.getUniqueFileName(targetFolder, cleanName);
        const targetPath = `${targetFolder}/${fileName}.md`;
        
        return await window.safeCreateFile(targetPath, content, this.plugin.app);
    }

    /**
     * Получает чистое имя файла (SRP: одна ответственность)
     */
    getCleanFileName(entityType, entityData) {
        const nameField = this.getNameField(entityType);
        const name = entityData[nameField] || entityData.name || 'Без_названия';
        return name.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
    }

    /**
     * Получает поле имени для типа сущности (SRP: одна ответственность)
     */
    getNameField(entityType) {
        const nameFieldMap = {
            'City': 'cityName',
            'State': 'stateName',
            'Province': 'provinceName',
            'Village': 'villageName',
            'Location': 'locationName',
            'Port': 'portName',
            'Castle': 'castleName',
            'DeadZone': 'zoneName',
            'Farm': 'farmName',
            'Mine': 'mineName',
            'Factory': 'factoryName',
            'Character': 'characterName',
            'Monster': 'monsterName',
            'Artifact': 'artifactName',
            'Spell': 'spellName',
            'Potion': 'potionName',
            'AlchemyRecipe': 'recipeName',
            'Task': 'taskName',
            'Scene': 'sceneName',
            'Chapter': 'chapterName',
            'Work': 'title',
            'Conflict': 'conflictName',
            'Organization': 'organizationName',
            'Religion': 'religionName',
            'Cult': 'cultName',
            'TradeRoute': 'routeName',
            'SocialInstitution': 'institutionName',
            'Faction': 'factionName',
            'Quest': 'questName',
            'Event': 'eventName',
            'People': 'peopleName'
        };

        return nameFieldMap[entityType] || 'name';
    }

    /**
     * Получает целевую папку для типа сущности (SRP: одна ответственность)
     */
    getTargetFolder(entityType, project) {
        const folderMap = {
            'City': `${project}/Локации/Города`,
            'State': `${project}/Локации/Государства`,
            'Province': `${project}/Локации/Провинции`,
            'Village': `${project}/Локации/Деревни`,
            'Location': `${project}/Локации/Локации`,
            'Port': `${project}/Локации/Порты`,
            'Castle': `${project}/Локации/Замки`,
            'DeadZone': `${project}/Локации/Мёртвые_зоны`,
            'Farm': `${project}/Локации/Фермы`,
            'Mine': `${project}/Локации/Шахты`,
            'Factory': `${project}/Локации/Заводы`,
            'Character': `${project}/Персонажи`,
            'Monster': `${project}/Монстры`,
            'Artifact': `${project}/Артефакты`,
            'Spell': `${project}/Магия/Заклинания`,
            'Potion': `${project}/Магия/Зелья`,
            'AlchemyRecipe': `${project}/Магия/Рецепты_алхимии`,
            'Task': `${project}/Задачи`,
            'Scene': `${project}/Сцены`,
            'Chapter': `${project}/Главы`,
            'Work': `${project}/1_Рукопись/Произведения`,
            'Conflict': `${project}/Конфликты`,
            'Organization': `${project}/Организации`,
            'Religion': `${project}/Религии`,
            'Cult': `${project}/Культы`,
            'TradeRoute': `${project}/Торговые_пути`,
            'SocialInstitution': `${project}/Социальные_учреждения`,
            'Faction': `${project}/Фракции`,
            'Quest': `${project}/Квесты`,
            'Event': `${project}/События`,
            'People': `${project}/Народы`
        };

        return folderMap[entityType] || `${project}/Сущности`;
    }

    /**
     * Получает уникальное имя файла (SRP: одна ответственность)
     */
    async getUniqueFileName(targetFolder, cleanName) {
        let fileName = cleanName;
        let attempt = 1;
        
        while (this.plugin.app.vault.getAbstractFileByPath(`${targetFolder}/${fileName}.md`)) {
            attempt += 1;
            fileName = `${cleanName}_${attempt}`;
        }
        
        return fileName;
    }

    /**
     * Получает отображаемое имя типа сущности (SRP: одна ответственность)
     */
    getEntityDisplayName(entityType) {
        const displayNameMap = {
            'City': 'город',
            'State': 'государство',
            'Province': 'провинция',
            'Village': 'деревня',
            'Location': 'локация',
            'Port': 'порт',
            'Castle': 'замок',
            'DeadZone': 'мёртвая зона',
            'Farm': 'ферма',
            'Mine': 'шахта',
            'Factory': 'завод',
            'Character': 'персонаж',
            'Monster': 'монстр',
            'Artifact': 'артефакт',
            'Spell': 'заклинание',
            'Potion': 'зелье',
            'AlchemyRecipe': 'рецепт алхимии',
            'Task': 'задача',
            'Scene': 'сцена',
            'Chapter': 'глава',
            'Work': 'произведение',
            'Conflict': 'конфликт',
            'Organization': 'организация',
            'Religion': 'религия',
            'Cult': 'культ',
            'TradeRoute': 'торговый путь',
            'SocialInstitution': 'социальное учреждение',
            'Faction': 'фракция',
            'Quest': 'квест',
            'Event': 'событие',
            'People': 'народ'
        };

        return displayNameMap[entityType] || entityType.toLowerCase();
    }
}

// Экспортируем фабрику
module.exports = { EntityFactory };

// Глобализируем для использования в других модулях
if (typeof window !== 'undefined') {
    window.EntityFactory = EntityFactory;
}
