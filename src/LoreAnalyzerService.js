/**
 * @file       LoreAnalyzerService.js
 * @description Сервис для анализа лор-контекста и определения недостающей информации
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies AIProviderService
 * @created    2025-08-15
 * @updated    2025-08-15
 * @docs       docs/Карточка функционала.md
 */

var LoreAnalyzerService = class LoreAnalyzerService {
    constructor(plugin) {
        this.plugin = plugin;
        // Отложенная инициализация AI сервиса
        this.aiService = null;
        
        // Маппинг русских названий типов на английские
        this.russianTypeMapping = {
            'замок': 'castle',
            'крепость': 'castle',
            'форт': 'castle',
            'зелье': 'potion',
            'настойка': 'potion',
            'отвар': 'potion',
            'артефакт': 'artifact',
            'реликвия': 'artifact',
            'сокровище': 'artifact',
            'персонаж': 'character',
            'герой': 'character',
            'лицо': 'character',
            'локация': 'location',
            'место': 'location',
            'точка': 'location',
            'событие': 'event',
            'происшествие': 'event',
            'организация': 'organization',
            'группа': 'organization',
            'союз': 'organization',
            'город': 'city',
            'поселение': 'city',
            'деревня': 'village',
            'село': 'village',
            'провинция': 'province',
            'область': 'province',
            'государство': 'state',
            'страна': 'state',
            'заклинание': 'spell',
            'спелл': 'spell',
            'алхимия': 'alchemy',
            'рецепт': 'alchemy',
            'шахта': 'mine',
            'рудник': 'mine',
            'завод': 'factory',
            'фабрика': 'factory',
            'ферма': 'farm',
            'хозяйство': 'farm',
            'порт': 'port',
            'гавань': 'port',
            'народ': 'people',
            'раса': 'people',
            'монстр': 'monster',
            'чудовище': 'monster',
            'задача': 'task',
            'квест': 'task'
        };
        
        // Используем стрелочные функции для сохранения контекста this
        this.contentTypes = {
            castle: async (content, projectRoot) => await this.analyzeCastle(content, projectRoot),
            potion: async (content, projectRoot) => await this.analyzePotion(content, projectRoot),
            artifact: async (content, projectRoot) => await this.analyzeArtifact(content, projectRoot),
            character: async (content, projectRoot) => await this.analyzeCharacter(content, projectRoot),
            location: async (content, projectRoot) => await this.analyzeLocation(content, projectRoot),
            city: async (content, projectRoot) => await this.analyzeCity(content, projectRoot),
            village: async (content, projectRoot) => await this.analyzeVillage(content, projectRoot),
            province: async (content, projectRoot) => await this.analyzeProvince(content, projectRoot),
            state: async (content, projectRoot) => await this.analyzeState(content, projectRoot),
            spell: async (content, projectRoot) => await this.analyzeSpell(content, projectRoot),
            alchemy: async (content, projectRoot) => await this.analyzeAlchemy(content, projectRoot),
            mine: async (content, projectRoot) => await this.analyzeMine(content, projectRoot),
            factory: async (content, projectRoot) => await this.analyzeFactory(content, projectRoot),
            farm: async (content, projectRoot) => await this.analyzeFarm(content, projectRoot),
            port: async (content, projectRoot) => await this.analyzePort(content, projectRoot),
            people: async (content, projectRoot) => await this.analyzePeople(content, projectRoot),
            monster: async (content, projectRoot) => await this.analyzeMonster(content, projectRoot),
            task: async (content, projectRoot) => await this.analyzeTask(content, projectRoot),
            event: async (content, projectRoot) => await this.analyzeEvent(content, projectRoot),
            organization: async (content, projectRoot) => await this.analyzeOrganization(content, projectRoot)
        };
    }

    /**
     * Инициализирует AI сервис при необходимости
     */
    async initializeAIService() {
        if (this.aiService) {
            return this.aiService;
        }
        
        try {
            // Access AIProviderService from global scope
            const AIService = (typeof window !== 'undefined' ? window.AIProviderService : global.AIProviderService);
            
            console.log('[LoreAnalyzerService] Проверяем AIProviderService в window:', window.AIProviderService);
            console.log('[LoreAnalyzerService] typeof window.AIProviderService:', typeof window.AIProviderService);
            console.log('[LoreAnalyzerService] window.aiProviderService:', window.aiProviderService);
            
            if (!AIService) {
                console.warn('[LoreAnalyzerService] AIProviderService недоступен');
                return null;
            }
            
            if (typeof AIService !== 'function') {
                console.warn('[LoreAnalyzerService] AIProviderService не является конструктором:', typeof AIService);
                return null;
            }
            
            this.aiService = new AIService(this.plugin);
            console.log('[LoreAnalyzerService] AI сервис инициализирован');
            return this.aiService;
            
        } catch (error) {
            console.error('[LoreAnalyzerService] Ошибка инициализации AI сервиса:', error);
            return null;
        }
    }

    /**
     * Преобразует русский тип в английский
     */
    normalizeContentType(contentType) {
        const normalized = this.russianTypeMapping[contentType.toLowerCase()];
        if (normalized) {
            this.plugin.logDebug(`Тип "${contentType}" преобразован в "${normalized}"`);
            return normalized;
        }
        return contentType.toLowerCase();
    }

    /**
     * Основной метод анализа контента
     */
    async analyzeContent(content, contentType, projectRoot) {
        try {
            this.plugin.logDebug(`Анализ контента типа: ${contentType}`);
            console.log(`[LoreAnalyzerService] Анализ контента типа: ${contentType}`);
            console.log(`[LoreAnalyzerService] Тип typeof contentType:`, typeof contentType);
            console.log(`[LoreAnalyzerService] contentType.toLowerCase():`, contentType.toLowerCase());
            
            // Нормализуем тип контента (русский -> английский)
            const normalizedType = this.normalizeContentType(contentType);
            this.plugin.logDebug(`Нормализованный тип: ${normalizedType}`);
            console.log(`[LoreAnalyzerService] Нормализованный тип: ${normalizedType}`);
            
            console.log(`[LoreAnalyzerService] Доступные типы:`, Object.keys(this.contentTypes));
            console.log(`[LoreAnalyzerService] Ищем анализатор для типа: ${normalizedType}`);
            
            const analyzer = this.contentTypes[normalizedType];
            console.log(`[LoreAnalyzerService] Найденный анализатор:`, analyzer);
            
            if (!analyzer) {
                console.error(`[LoreAnalyzerService] Анализатор не найден для типа: ${normalizedType}`);
                console.error(`[LoreAnalyzerService] Доступные типы:`, Object.keys(this.contentTypes));
                throw new Error(`Неизвестный тип контента: ${contentType} (нормализованный: ${normalizedType})`);
            }

            console.log(`[LoreAnalyzerService] Вызываем анализатор для типа: ${normalizedType}`);
            const analysis = await analyzer(content, projectRoot);
            console.log(`[LoreAnalyzerService] Анализ завершен успешно:`, analysis);
            
            return analysis;
        } catch (error) {
            this.plugin.logDebug(`Ошибка анализа контента: ${error.message}`);
            console.error(`[LoreAnalyzerService] Ошибка анализа контента:`, error);
            throw error;
        }
    }

    /**
     * Анализ рецепта зелья
     */
    async analyzePotion(content, projectRoot) {
        const analysis = {
            type: 'potion',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        // Анализируем основные секции
        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            ingredients: { weight: 20, found: false },
            effects: { weight: 20, found: false },
            process: { weight: 15, found: false },
            risks: { weight: 10, found: false },
            history: { weight: 10, found: false }
        };

        // Проверяем наличие секций
        Object.keys(sections).forEach(section => {
            const hasContent = this.hasSectionContent(content, section);
            sections[section].found = hasContent;
            analysis.sections[section] = {
                present: hasContent,
                weight: sections[section].weight,
                quality: hasContent ? this.assessContentQuality(content, section) : 0
            };
        });

        // Собираем лор-контекст
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'potion');

        // Определяем недостающее
        Object.keys(sections).forEach(section => {
            if (!sections[section].found) {
                analysis.missing.push(this.getMissingDescription(section, 'potion'));
            }
        });

        // Вычисляем полноту
        analysis.completeness = this.calculateCompleteness(sections);

        // Генерируем рекомендации
        analysis.recommendations = await this.generateRecommendations(analysis, 'potion');

        return analysis;
    }

    /**
     * Анализ артефакта
     */
    async analyzeArtifact(content, projectRoot) {
        const analysis = {
            type: 'artifact',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            properties: { weight: 20, found: false },
            history: { weight: 15, found: false },
            owner: { weight: 10, found: false },
            location: { weight: 10, found: false },
            creation: { weight: 10, found: false },
            risks: { weight: 10, found: false }
        };

        Object.keys(sections).forEach(section => {
            const hasContent = this.hasSectionContent(content, section);
            sections[section].found = hasContent;
            analysis.sections[section] = {
                present: hasContent,
                weight: sections[section].weight,
                quality: hasContent ? this.assessContentQuality(content, section) : 0
            };
        });

        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'artifact');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'artifact');

        return analysis;
    }

    /**
     * Анализ персонажа
     */
    async analyzeCharacter(content, projectRoot) {
        const analysis = {
            type: 'character',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            background: { weight: 20, found: false },
            personality: { weight: 15, found: false },
            abilities: { weight: 15, found: false },
            relationships: { weight: 15, found: false },
            goals: { weight: 10, found: false }
        };

        Object.keys(sections).forEach(section => {
            const hasContent = this.hasSectionContent(content, section);
            sections[section].found = hasContent;
            analysis.sections[section] = {
                present: hasContent,
                weight: sections[section].weight,
                quality: hasContent ? this.assessContentQuality(content, section) : 0
            };
        });

        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'character');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'character');

        return analysis;
    }

    /**
     * Проверяет наличие контента в секции
     */
    hasSectionContent(content, section) {
        const sectionPatterns = {
            name: /название|name|title/i,
            description: /описание|description/i,
            ingredients: /ингредиенты|ingredients/i,
            effects: /эффекты|effects/i,
            process: /процесс|process|приготовление/i,
            risks: /риски|risks|опасности/i,
            history: /история|history/i,
            properties: /свойства|properties/i,
            owner: /владелец|owner/i,
            location: /местоположение|location/i,
            creation: /создание|creation/i,
            background: /прошлое|background/i,
            personality: /личность|personality/i,
            abilities: /способности|abilities/i,
            relationships: /отношения|relationships/i,
            goals: /цели|goals/i,
            
            // Замки/крепости
            architecture: /архитектура|архитектур|укрепления|стены|башни|фортификация/i,
            garrison: /гарнизон|защита|войска|стража|охрана/i,
            strategic: /стратегическое|стратегический|важность|положение/i,
            
            // Города
            geography: /география|географическое|планировка|расположение/i,
            population: /население|демография|жители|народ/i,
            economy: /экономика|экономический|торговля|торговый|финансы/i,
            politics: /политика|политический|управление|власть/i,
            culture: /культура|культурный|религия|религиозный/i,
            
            // Деревни
            occupations: /занятия|профессии|ремесла|сельское хозяйство/i,
            traditions: /традиции|обычаи|праздники|ритуалы/i,
            connections: /связи|дороги|торговля|коммуникации/i,
            problems: /проблемы|нужды|трудности|вызовы/i,
            
            // Провинции
            borders: /границы|территория|площадь|размеры/i,
            administration: /администрация|управление|деление|структура/i,
            resources: /ресурсы|природные|полезные ископаемые/i,
            
            // Государства
            territory: /территория|границы|площадь|размеры/i,
            foreign: /внешняя политика|дипломатия|отношения|союзы/i,
            
            // Заклинания
            school: /школа|магическая|стиль|направление/i,
            components: /компоненты|жесты|слова|материалы/i,
            level: /уровень|сложность|мастерство|сила/i,
            
            // Алхимия
            proportions: /пропорции|соотношения|количество|дозировка/i,
            stability: /стабильность|хранение|срок годности|условия/i,
            
            // Шахты
            depth: /глубина|протяженность|размеры|объемы/i,
            equipment: /оборудование|технологии|машины|инструменты/i,
            productivity: /производительность|добыча|эффективность/i,
            safety: /безопасность|риски|защита|меры/i,
            
            // Заводы
            products: /продукция|изделия|товары|производство/i,
            technology: /технологии|оборудование|процессы/i,
            supplies: /сырье|поставки|материалы|компоненты/i,
            
            // Фермы
            crops: /культуры|растения|урожай|выращивание/i,
            area: /площадь|планировка|размеры|территория/i,
            seasons: /сезоны|времена года|урожайность|циклы/i,
            
            // Порты
            infrastructure: /инфраструктура|оборудование|сооружения/i,
            routes: /маршруты|пути|направления|связи/i,
            security: /безопасность|защита|охрана|контроль/i,
            
            // Народы
            origin: /происхождение|история|корни|предки/i,
            language: /язык|письменность|речь|коммуникация/i,
            society: /общество|социальная структура|классы/i,
            religion: /религия|верования|боги|духовность/i,
            
            // Монстры
            appearance: /внешний вид|размер|форма|облик/i,
            behavior: /поведение|повадки|характер|стиль/i,
            danger: /опасность|угроза|риск|сила/i,
            legends: /легенды|истории|мифы|предания/i,
            
            // Задачи
            goal: /цель|назначение|задача|миссия/i,
            priority: /приоритет|важность|срочность|сложность/i,
            requirements: /требования|ресурсы|условия|нужды/i,
            stages: /этапы|стадии|сроки|временные рамки/i,
            responsible: /ответственные|исполнители|участники/i,
            criteria: /критерии|показатели|результаты|успех/i
        };

        const pattern = sectionPatterns[section];
        if (!pattern) return false;

        return pattern.test(content);
    }

    /**
     * Оценивает качество контента в секции
     */
    assessContentQuality(content, section) {
        // Простая оценка по длине и наличию ключевых слов
        const sectionContent = this.extractSectionContent(content, section);
        if (!sectionContent) return 0;

        let quality = 0;
        
        // Базовая оценка по длине
        if (sectionContent.length > 50) quality += 30;
        if (sectionContent.length > 100) quality += 20;
        if (sectionContent.length > 200) quality += 20;

        // Оценка по детализации
        const details = sectionContent.match(/[.!?]/g)?.length || 0;
        if (details > 2) quality += 15;
        if (details > 5) quality += 15;

        return Math.min(quality, 100);
    }

    /**
     * Извлекает контент секции
     */
    extractSectionContent(content, section) {
        // Упрощенная реализация - можно улучшить
        const lines = content.split('\n');
        let inSection = false;
        let sectionContent = '';

        for (const line of lines) {
            if (this.hasSectionContent(line, section)) {
                inSection = true;
                continue;
            }
            if (inSection && line.trim().startsWith('#')) {
                break;
            }
            if (inSection) {
                sectionContent += line + '\n';
            }
        }

        return sectionContent.trim();
    }

    /**
     * Вычисляет общую полноту контента
     */
    calculateCompleteness(sections) {
        let totalWeight = 0;
        let completedWeight = 0;

        Object.keys(sections).forEach(section => {
            const weight = sections[section].weight;
            totalWeight += weight;
            if (sections[section].found) {
                completedWeight += weight;
            }
        });

        return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    }

    /**
     * Собирает лор-контекст из файлов проекта
     */
    async gatherLoreContext(projectRoot, contentType) {
        const context = {
            relatedFiles: [],
            worldInfo: {},
            magicSystem: {},
            history: {}
        };

        try {
            // Ищем связанные файлы
            const allFiles = this.plugin.app.vault.getMarkdownFiles();
            const projectFiles = allFiles.filter(f => f.path.startsWith(projectRoot));

            // Собираем информацию в зависимости от типа контента
            switch (contentType) {
                case 'potion':
                    context.relatedFiles = projectFiles.filter(f => 
                        f.path.includes('Зелья') || f.path.includes('Алхимия') || f.path.includes('Ингредиенты')
                    );
                    break;
                case 'artifact':
                    context.relatedFiles = projectFiles.filter(f => 
                        f.path.includes('Артефакты') || f.path.includes('Магия') || f.path.includes('История')
                    );
                    break;
                case 'character':
                    context.relatedFiles = projectFiles.filter(f => 
                        f.path.includes('Персонажи') || f.path.includes('Народы') || f.path.includes('Организации')
                    );
                    break;
            }

            // Читаем настройки мира
            const worldSettingsFile = projectFiles.find(f => f.basename === 'Настройки_мира');
            if (worldSettingsFile) {
                const worldContent = await this.plugin.app.vault.read(worldSettingsFile);
                context.worldInfo = this.extractWorldInfo(worldContent);
            }

        } catch (error) {
            this.plugin.logDebug(`Ошибка сбора лор-контекста: ${error.message}`);
        }

        return context;
    }

    /**
     * Извлекает информацию о мире из файла настроек
     */
    extractWorldInfo(content) {
        const info = {};
        
        // Простое извлечение информации - можно улучшить
        const patterns = {
            name: /название[:\s]+(.+)/i,
            era: /эпоха[:\s]+(.+)/i,
            magic: /магия[:\s]+(.+)/i,
            technology: /технологии[:\s]+(.+)/i
        };

        Object.keys(patterns).forEach(key => {
            const match = content.match(patterns[key]);
            if (match) {
                info[key] = match[1].trim();
            }
        });

        return info;
    }

    /**
     * Получает описание недостающей секции
     */
    getMissingDescription(section, contentType) {
        const descriptions = {
            // Общие секции
            name: 'Название',
            description: 'Описание',
            
            // Зелья
            ingredients: 'Ингредиенты',
            effects: 'Эффекты',
            process: 'Процесс приготовления',
            risks: 'Риски и ограничения',
            history: 'История создания',
            
            // Артефакты
            properties: 'Магические свойства',
            owner: 'Владелец',
            location: 'Местоположение',
            creation: 'Способ создания',
            
            // Персонажи
            background: 'Прошлое персонажа',
            personality: 'Личность и характер',
            abilities: 'Способности и навыки',
            relationships: 'Отношения с другими',
            goals: 'Цели и мотивация',
            
            // Замки/крепости
            architecture: 'Архитектура и укрепления',
            garrison: 'Гарнизон и защита',
            strategic: 'Стратегическое значение',
            
            // Города
            geography: 'География и планировка',
            population: 'Население и демография',
            economy: 'Экономика и торговля',
            politics: 'Политика и управление',
            culture: 'Культура и религия',
            
            // Деревни
            occupations: 'Основные занятия',
            traditions: 'Традиции и обычаи',
            connections: 'Связи с внешним миром',
            problems: 'Проблемы и нужды',
            
            // Провинции
            borders: 'Границы и территория',
            administration: 'Административное деление',
            resources: 'Природные ресурсы',
            
            // Государства
            territory: 'Территория и границы',
            foreign: 'Внешняя политика',
            
            // Заклинания
            school: 'Магическая школа',
            components: 'Компоненты и жесты',
            level: 'Уровень сложности',
            
            // Алхимия
            proportions: 'Пропорции ингредиентов',
            stability: 'Хранение и стабильность',
            
            // Шахты
            depth: 'Глубина и протяженность',
            equipment: 'Оборудование и технологии',
            productivity: 'Производительность',
            safety: 'Безопасность и риски',
            
            // Заводы
            products: 'Производимая продукция',
            technology: 'Технологии и оборудование',
            supplies: 'Сырье и поставки',
            
            // Фермы
            crops: 'Выращиваемые культуры',
            area: 'Площадь и планировка',
            seasons: 'Урожайность и сезоны',
            
            // Порты
            infrastructure: 'Инфраструктура и оборудование',
            routes: 'Торговые маршруты',
            security: 'Безопасность и защита',
            
            // Народы
            origin: 'Происхождение и история',
            language: 'Язык и письменность',
            society: 'Социальная структура',
            religion: 'Религия и верования',
            
            // Монстры
            appearance: 'Внешний вид и размер',
            behavior: 'Поведение и повадки',
            danger: 'Опасность и угроза',
            legends: 'Легенды и истории',
            
            // Задачи
            goal: 'Цель и назначение',
            priority: 'Приоритет и сложность',
            requirements: 'Требования и ресурсы',
            stages: 'Сроки и этапы',
            responsible: 'Ответственные лица',
            criteria: 'Критерии выполнения'
        };

        return descriptions[section] || section;
    }

    /**
     * Генерирует рекомендации с помощью AI
     */
    async generateRecommendations(analysis, contentType) {
        try {
            // Инициализируем AI сервис при необходимости
            const aiService = await this.initializeAIService();
            if (!aiService) {
                console.warn('[LoreAnalyzerService] AI сервис недоступен, используем дефолтные рекомендации');
                return this.getDefaultRecommendations(analysis, contentType);
            }
            
            const prompt = this.buildRecommendationPrompt(analysis, contentType);
            
            // Проверяем доступные методы AI сервиса
            if (typeof aiService.generateText === 'function') {
                const result = await aiService.generateText(prompt, {
                maxTokens: 1000,
                temperature: 0.7
            });

                if (result && result.text) {
                    return this.parseRecommendations(result.text);
                }
            } else if (typeof aiService.sendRequest === 'function') {
                const result = await aiService.sendRequest(prompt, {
                    maxTokens: 1000,
                    temperature: 0.7
                });
                
                if (result && result.content) {
            return this.parseRecommendations(result.content);
                }
            } else {
                console.warn('[LoreAnalyzerService] AI сервис не имеет поддерживаемых методов');
            }

            return this.getDefaultRecommendations(analysis, contentType);
        } catch (error) {
            this.plugin.logDebug(`Ошибка генерации рекомендаций: ${error.message}`);
            console.warn('[LoreAnalyzerService] Ошибка генерации рекомендаций, используем дефолтные:', error);
            return this.getDefaultRecommendations(analysis, contentType);
        }
    }

    /**
     * Строит промпт для генерации рекомендаций
     */
    buildRecommendationPrompt(analysis, contentType) {
        const missingSections = analysis.missing.join(', ');
        const completeness = analysis.completeness;
        const loreContext = JSON.stringify(analysis.loreContext.worldInfo, null, 2);

        return `
Анализ контента типа "${contentType}":
- Полнота: ${completeness}%
- Отсутствующие секции: ${missingSections}
- Контекст мира: ${loreContext}

Предложи 3-5 конкретных рекомендаций для улучшения этого контента. 
Фокусируйся на:
1. Что добавить в отсутствующие секции
2. Как связать с существующим лором
3. Как сделать контент более интересным и детальным

Отвечай на русском языке, кратко и по делу.
        `.trim();
    }

    /**
     * Парсит рекомендации из ответа AI
     */
    parseRecommendations(content) {
        const recommendations = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && (trimmed.match(/^\d+\./) || trimmed.match(/^-/))) {
                recommendations.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
            }
        }

        return recommendations.length > 0 ? recommendations : ['Добавить больше деталей и связей с миром'];
    }

    /**
     * Возвращает стандартные рекомендации при ошибке AI
     */
    getDefaultRecommendations(analysis, contentType) {
        const recommendations = [];
        
        if (analysis.completeness < 50) {
            recommendations.push('Добавить основные секции: описание, история, детали');
        }
        
        if (analysis.missing.length > 0) {
            recommendations.push(`Заполнить отсутствующие секции: ${analysis.missing.join(', ')}`);
        }
        
        recommendations.push('Связать с существующим лором мира');
        recommendations.push('Добавить уникальные детали и особенности');
        
        return recommendations;
    }

    /**
     * Анализ замка/крепости
     */
    async analyzeCastle(content, projectRoot) {
        const analysis = {
            type: 'castle',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            location: { weight: 15, found: false },
            architecture: { weight: 15, found: false },
            garrison: { weight: 15, found: false },
            owner: { weight: 10, found: false },
            strategic: { weight: 10, found: false },
            history: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'castle');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'castle');

        return analysis;
    }

    /**
     * Анализ города
     */
    async analyzeCity(content, projectRoot) {
        const analysis = {
            type: 'city',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            geography: { weight: 15, found: false },
            population: { weight: 15, found: false },
            economy: { weight: 15, found: false },
            politics: { weight: 10, found: false },
            culture: { weight: 10, found: false },
            history: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'city');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'city');

        return analysis;
    }

    /**
     * Анализ деревни
     */
    async analyzeVillage(content, projectRoot) {
        const analysis = {
            type: 'village',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            location: { weight: 15, found: false },
            population: { weight: 15, found: false },
            occupations: { weight: 15, found: false },
            traditions: { weight: 10, found: false },
            connections: { weight: 10, found: false },
            problems: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'village');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'village');

        return analysis;
    }

    /**
     * Анализ провинции
     */
    async analyzeProvince(content, projectRoot) {
        const analysis = {
            type: 'province',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            borders: { weight: 15, found: false },
            administration: { weight: 15, found: false },
            resources: { weight: 15, found: false },
            population: { weight: 10, found: false },
            economy: { weight: 10, found: false },
            culture: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'province');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'province');

        return analysis;
    }

    /**
     * Анализ государства
     */
    async analyzeState(content, projectRoot) {
        const analysis = {
            type: 'state',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            territory: { weight: 15, found: false },
            politics: { weight: 15, found: false },
            economy: { weight: 15, found: false },
            population: { weight: 10, found: false },
            foreign: { weight: 10, found: false },
            history: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'state');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'state');

        return analysis;
    }

    /**
     * Анализ заклинания
     */
    async analyzeSpell(content, projectRoot) {
        const analysis = {
            type: 'spell',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            school: { weight: 15, found: false },
            components: { weight: 15, found: false },
            effects: { weight: 15, found: false },
            level: { weight: 10, found: false },
            risks: { weight: 10, found: false },
            history: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'spell');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'spell');

        return analysis;
    }

    /**
     * Анализ алхимии
     */
    async analyzeAlchemy(content, projectRoot) {
        const analysis = {
            type: 'alchemy',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            ingredients: { weight: 20, found: false },
            proportions: { weight: 15, found: false },
            process: { weight: 15, found: false },
            effects: { weight: 15, found: false },
            risks: { weight: 10, found: false },
            stability: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'alchemy');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'alchemy');

        return analysis;
    }

    /**
     * Анализ шахты
     */
    async analyzeMine(content, projectRoot) {
        const analysis = {
            type: 'mine',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            resources: { weight: 20, found: false },
            depth: { weight: 15, found: false },
            equipment: { weight: 15, found: false },
            workers: { weight: 10, found: false },
            productivity: { weight: 10, found: false },
            safety: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'mine');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'mine');

        return analysis;
    }

    /**
     * Анализ завода
     */
    async analyzeFactory(content, projectRoot) {
        const analysis = {
            type: 'factory',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            products: { weight: 20, found: false },
            technology: { weight: 15, found: false },
            workers: { weight: 15, found: false },
            supplies: { weight: 10, found: false },
            productivity: { weight: 10, found: false },
            safety: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'factory');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'factory');

        return analysis;
    }

    /**
     * Анализ фермы
     */
    async analyzeFarm(content, projectRoot) {
        const analysis = {
            type: 'farm',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            crops: { weight: 20, found: false },
            area: { weight: 15, found: false },
            technology: { weight: 15, found: false },
            workers: { weight: 10, found: false },
            seasons: { weight: 10, found: false },
            economy: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'farm');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'farm');

        return analysis;
    }

    /**
     * Анализ порта
     */
    async analyzePort(content, projectRoot) {
        const analysis = {
            type: 'port',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            location: { weight: 15, found: false },
            depth: { weight: 15, found: false },
            infrastructure: { weight: 15, found: false },
            routes: { weight: 10, found: false },
            population: { weight: 10, found: false },
            security: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'port');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'port');

        return analysis;
    }

    /**
     * Анализ народа
     */
    async analyzePeople(content, projectRoot) {
        const analysis = {
            type: 'people',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            origin: { weight: 15, found: false },
            culture: { weight: 15, found: false },
            language: { weight: 15, found: false },
            society: { weight: 10, found: false },
            religion: { weight: 10, found: false },
            relations: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'people');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'people');

        return analysis;
    }

    /**
     * Анализ монстра
     */
    async analyzeMonster(content, projectRoot) {
        const analysis = {
            type: 'monster',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            appearance: { weight: 15, found: false },
            origin: { weight: 15, found: false },
            behavior: { weight: 15, found: false },
            abilities: { weight: 10, found: false },
            danger: { weight: 10, found: false },
            legends: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'monster');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'monster');

        return analysis;
    }

    /**
     * Анализ задачи
     */
    async analyzeTask(content, projectRoot) {
        const analysis = {
            type: 'task',
            completeness: 0,
            sections: {},
            missing: [],
            recommendations: [],
            loreContext: {}
        };

        const sections = {
            name: { weight: 10, found: false },
            description: { weight: 15, found: false },
            goal: { weight: 20, found: false },
            priority: { weight: 15, found: false },
            requirements: { weight: 15, found: false },
            stages: { weight: 10, found: false },
            responsible: { weight: 10, found: false },
            criteria: { weight: 10, found: false }
        };

        this.analyzeSections(content, sections, analysis);
        analysis.loreContext = await this.gatherLoreContext(projectRoot, 'task');
        analysis.completeness = this.calculateCompleteness(sections);
        analysis.recommendations = await this.generateRecommendations(analysis, 'task');

        return analysis;
    }

    /**
     * Вспомогательный метод для анализа секций
     */
    analyzeSections(content, sections, analysis) {
        Object.keys(sections).forEach(section => {
            const hasContent = this.hasSectionContent(content, section);
            sections[section].found = hasContent;
            analysis.sections[section] = {
                present: hasContent,
                weight: sections[section].weight,
                quality: hasContent ? this.assessContentQuality(content, section) : 0
            };
        });

        Object.keys(sections).forEach(section => {
            if (!sections[section].found) {
                analysis.missing.push(this.getMissingDescription(section, analysis.type));
            }
        });
    }
};
