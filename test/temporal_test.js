/**
 * @file       temporal_test.js
 * @description Тестовый сценарий для проверки функциональности временных слоев
 * @author     KiloCode
 * @version    1.0.0
 * @license    MIT
 */

// Тестирование TimelineService
function testTimelineService() {
    console.log('=== Тестирование TimelineService ===');
    
    // Создание эпох
    const epoch1 = window.timelineService.createEpoch({
        id: 'ancient_times',
        name: 'Древние времена',
        description: 'Эпоха древних цивилизаций',
        startDate: '-10000',
        endDate: '-5000'
    });
    
    const epoch2 = window.timelineService.createEpoch({
        id: 'medieval_era',
        name: 'Средневековье',
        description: 'Эпоха средневековья',
        startDate: '1000',
        endDate: '1500'
    });
    
    console.log('Созданные эпохи:', window.timelineService.getAllEpochs());
    
    // Активация эпохи
    window.timelineService.setActiveEpoch('medieval_era');
    console.log('Активная эпоха:', window.timelineService.getActiveEpoch());
    
    // Получение эпохи по ID
    console.log('Эпоха ancient_times:', window.timelineService.getEpochById('ancient_times'));
}

// Тестирование TemporalEntityService
function testTemporalEntityService() {
    console.log('=== Тестирование TemporalEntityService ===');
    
    // Создание базовой сущности
    const baseEntity = {
        id: 'character:john_doe',
        type: 'character',
        name: 'Джон Доу',
        attributes: {
            age: 25,
            occupation: 'рыцарь'
        },
        relations: []
    };
    
    // Сохранение сущности в активной эпохе
    window.temporalEntityService.saveEntity(baseEntity);
    console.log('Сущность сохранена в активной эпохе');
    
    // Получение сущности из активной эпохи
    const retrievedEntity = window.temporalEntityService.getEntity('character:john_doe');
    console.log('Полученная сущность:', retrievedEntity);
    
    // Создание новой версии сущности
    const updatedEntity = {
        id: 'character:john_doe',
        type: 'character',
        name: 'Сэр Джон Доу',
        attributes: {
            age: 30,
            occupation: 'рыцарь',
            title: 'Сэр'
        },
        relations: []
    };
    
    window.temporalEntityService.saveEntity(updatedEntity);
    console.log('Обновленная сущность сохранена');
    
    // Получение всех версий сущности
    const allVersions = window.temporalEntityService.getAllVersions('character:john_doe');
    console.log('Все версии сущности:', allVersions);
}

// Тестирование TemporalContextService
function testTemporalContextService() {
    console.log('=== Тестирование TemporalContextService ===');
    
    // Создание сущностей с зависимостями
    const kingdom = {
        id: 'location:great_kingdom',
        type: 'location',
        name: 'Великое королевство',
        attributes: {
            population: 100000,
            ruler: 'character:king_arthur'
        },
        relations: []
    };
    
    const king = {
        id: 'character:king_arthur',
        type: 'character',
        name: 'Король Артур',
        attributes: {
            age: 40,
            title: 'Король'
        },
        relations: []
    };
    
    window.temporalEntityService.saveEntity(kingdom);
    window.temporalEntityService.saveEntity(king);
    
    // Проверка контекста
    const context = window.temporalContextService.getContext();
    console.log('Текущий контекст:', context);
    
    // Проверка зависимостей
    const dependencies = window.temporalContextService.getEntityDependencies('location:great_kingdom');
    console.log('Зависимости королевства:', dependencies);
    
    // Проверка целостности контекста
    const integrity = window.temporalContextService.checkContextIntegrity();
    console.log('Целостность контекста:', integrity);
}

// Тестирование TemporalAPI
function testTemporalAPI() {
    console.log('=== Тестирование TemporalAPI ===');
    
    // Получение всех эпох
    const epochs = window.temporalAPI.getAllEpochs();
    console.log('Все эпохи через API:', epochs);
    
    // Получение сущности из активной эпохи
    const entity = window.temporalAPI.getEntity('character:john_doe');
    console.log('Сущность через API:', entity);
    
    // Получение всех версий сущности
    const versions = window.temporalAPI.getAllVersions('character:john_doe');
    console.log('Все версии через API:', versions);
    
    // Получение контекста
    const context = window.temporalAPI.getContext();
    console.log('Контекст через API:', context);
}

// Основная функция тестирования
async function runTemporalTests(plugin) {
    console.log('Запуск тестов временных слоев...');
    
    try {
        // Инициализируем тестовые сервисы если они еще не доступны глобально
        if (!window.timelineService) {
            window.timelineService = new plugin.timelineService.constructor(plugin);
        }
        
        if (!window.temporalEntityService) {
            window.temporalEntityService = new plugin.temporalEntityService.constructor(plugin);
        }
        
        if (!window.temporalContextService) {
            window.temporalContextService = new plugin.temporalContextService.constructor(plugin);
        }
        
        if (!window.temporalAPI) {
            window.temporalAPI = new plugin.temporalAPI.constructor(plugin);
        }
        
        testTimelineService();
        testTemporalEntityService();
        testTemporalContextService();
        testTemporalAPI();
        
        console.log('Все тесты успешно пройдены!');
        return { success: true, message: 'Все тесты успешно пройдены!' };
    } catch (error) {
        console.error('Ошибка при выполнении тестов:', error);
        return { success: false, message: 'Ошибка при выполнении тестов: ' + error.message };
    }
}

module.exports = { runTemporalTests };