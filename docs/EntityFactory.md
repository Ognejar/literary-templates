# EntityFactory - Универсальная фабрика сущностей

## Обзор

`EntityFactory` - это универсальный класс для создания всех типов сущностей мира в плагине Literary Templates. Применяет принципы **DRY** (Don't Repeat Yourself), **KISS** (Keep It Simple, Stupid) и **SRP** (Single Responsibility Principle).

## Принципы дизайна

### DRY (Don't Repeat Yourself)
- **До**: Каждая функция создания дублировала логику определения проекта, создания модального окна, обработки данных
- **После**: Вся общая логика вынесена в фабрику, функции создания стали простыми вызовами

### KISS (Keep It Simple, Stupid)
- **До**: Сложная логика в каждой функции создания
- **После**: Простой вызов `factory.createEntity('City', startPath, options)`

### SRP (Single Responsibility Principle)
- `resolveProject()` - только определение проекта
- `getModalClass()` - только получение класса модального окна
- `prepareTemplateData()` - только подготовка данных для шаблона
- `createEntityFile()` - только создание файла

## Использование

### Базовое использование

```javascript
// Создание фабрики
const factory = new window.EntityFactory(plugin);

// Создание сущности
await factory.createEntity('City', startPath, options);
await factory.createEntity('State', startPath, options);
await factory.createEntity('Province', startPath, options);
```

### Рефакторинг существующих функций

**До (createCity.js):**
```javascript
var createCity = async function(plugin, startPath = '', options = {}) {
    try {
        // 100+ строк сложной логики...
        let resolvedProjectRoot = '';
        if (startPath) {
            resolvedProjectRoot = findProjectRoot(plugin.app, startPath) || startPath;
        }
        // ... много кода ...
        const modal = new CityWizardModal(/* ... */);
        modal.open();
    } catch (error) {
        // обработка ошибок
    }
};
```

**После (createCity.js):**
```javascript
var createCity = async function(plugin, startPath = '', options = {}) {
    try {
        const factory = new window.EntityFactory(plugin);
        await factory.createEntity('City', startPath, options);
    } catch (error) {
        new Notice('Ошибка при создании города: ' + error.message);
        await plugin.logDebug('Ошибка: ' + error.message);
        console.error('Ошибка в createCity:', error);
    }
};
```

## Поддерживаемые типы сущностей

| Тип | Модальное окно | Шаблон | Папка |
|-----|----------------|--------|-------|
| `City` | `CityWizardModal` | `Новый_город` | `Локации/Города` |
| `State` | `StateWizardModal` | `Новое_государство` | `Локации/Государства` |
| `Province` | `ProvinceWizardModal` | `Новая_провинция` | `Локации/Провинции` |
| `Village` | `VillageWizardModal` | `Новая_деревня` | `Локации/Деревни` |
| `Location` | `LocationWizardModal` | `Новая_локация` | `Локации/Локации` |
| `Port` | `PortWizardModal` | `Новый_порт` | `Локации/Порты` |
| `Castle` | `CastleWizardModal` | `Новый_замок` | `Локации/Замки` |
| `DeadZone` | `DeadZoneWizardModal` | `Новая_мертвая_зона` | `Локации/Мёртвые_зоны` |
| `Farm` | `FarmWizardModal` | `Новая_ферма` | `Локации/Фермы` |
| `Mine` | `MineWizardModal` | `Новая_шахта` | `Локации/Шахты` |
| `Factory` | `FactoryWizardModal` | `Новый_завод` | `Локации/Заводы` |
| `Character` | `CharacterWizardModal` | `Новый_персонаж` | `Персонажи` |
| `Monster` | `MonsterWizardModal` | `Новый_монстр` | `Монстры` |
| `Artifact` | `ArtifactWizardModal` | `Новый_артефакт` | `Артефакты` |
| `Spell` | `SpellWizardModal` | `Новое_заклинание` | `Магия/Заклинания` |
| `Potion` | `PotionWizardModal` | `Новое_зелье` | `Магия/Зелья` |
| `AlchemyRecipe` | `AlchemyRecipeWizardModal` | `Новый_рецепт_алхимии` | `Магия/Рецепты_алхимии` |
| `Task` | `TaskWizardModal` | `Новая_задача` | `Задачи` |
| `Scene` | `SceneWizardModal` | `Новая_сцена` | `Сцены` |
| `Chapter` | `ChapterWizardModal` | `Новая_глава` | `Главы` |
| `Work` | `WorkCreationModal` | `Новое_произведение` | `1_Рукопись/Произведения` |
| `Conflict` | `ConflictWizardModal` | `Новый_конфликт` | `Конфликты` |
| `Organization` | `OrganizationWizardModal` | `Новая_организация` | `Организации` |
| `Religion` | `ReligionWizardModal` | `Новая_религия` | `Религии` |
| `Cult` | `CultWizardModal` | `Новый_культ` | `Культы` |
| `TradeRoute` | `TradeRouteWizardModal` | `Новый_торговый_путь` | `Торговые_пути` |
| `SocialInstitution` | `SocialInstitutionWizardModal` | `Новое_социальное_учреждение` | `Социальные_учреждения` |
| `Faction` | `FactionWizardModal` | `Новая_фракция` | `Фракции` |
| `Quest` | `QuestWizardModal` | `Новый_квест` | `Квесты` |
| `Event` | `EventWizardModal` | `Новое_событие` | `События` |
| `People` | `PeopleWizardModal` | `Новый_народ` | `Народы` |

## Архитектура

### Основной поток

1. **Создание фабрики** → `new EntityFactory(plugin)`
2. **Вызов создания** → `factory.createEntity('City', startPath, options)`
3. **Разрешение проекта** → `resolveProject(startPath)`
4. **Получение модального окна** → `getModalClass('City')`
5. **Создание модального окна** → `new CityWizardModal(...)`
6. **Обработка данных** → `handleEntityCreation(...)`
7. **Подготовка данных** → `prepareTemplateData(...)`
8. **Генерация контента** → `generateContent(...)`
9. **Создание файла** → `createEntityFile(...)`
10. **Открытие файла** → `plugin.app.workspace.getLeaf().openFile(file)`

### Специализированные методы

#### `prepareCityData()`
```javascript
prepareCityData(project, entityData, baseData) {
    const mainIndustriesContent = entityData.mainIndustries ? 
        entityData.mainIndustries.map(i => `- ${i}`).join('\n') : '';
    
    return {
        ...baseData,
        name: entityData.cityName,
        state: entityData.state || '', // Прямо используем state
        mainIndustriesSection: mainIndustriesContent || 'Не указаны',
        // ... другие поля
    };
}
```

#### `findTagImage()`
```javascript
findTagImage(project, baseName) {
    const tagFolder = `${project}/Теговые_картинки`;
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of exts) {
        const path = `${tagFolder}/${baseName}.${ext}`;
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file && file instanceof window.obsidian.TFile) {
            return `![[${path}]]`;
        }
    }
    return '';
}
```

## Преимущества

### 1. Единообразие
- Все функции создания используют одинаковый API
- Стандартизированная обработка ошибок
- Единый поток создания сущностей

### 2. Легкость поддержки
- Изменения в логике создания применяются ко всем типам
- Централизованная логика поиска изображений
- Единая система валидации

### 3. Расширяемость
- Добавление нового типа сущности требует только добавления в маппинги
- Легко добавить новые специализированные методы подготовки данных
- Простое добавление новых опций

### 4. Тестируемость
- Каждый метод имеет одну ответственность
- Легко мокать зависимости
- Изолированная логика

## Миграция существующих функций

### Шаг 1: Создать фабрику
```javascript
const factory = new window.EntityFactory(plugin);
```

### Шаг 2: Заменить сложную логику
```javascript
// Было:
// 100+ строк кода...

// Стало:
await factory.createEntity('City', startPath, options);
```

### Шаг 3: Упростить обработку ошибок
```javascript
try {
    const factory = new window.EntityFactory(plugin);
    await factory.createEntity('City', startPath, options);
} catch (error) {
    new Notice('Ошибка при создании города: ' + error.message);
    await plugin.logDebug('Ошибка: ' + error.message);
    console.error('Ошибка в createCity:', error);
}
```

## Примеры использования

### Создание города
```javascript
const factory = new window.EntityFactory(plugin);
await factory.createEntity('City', startPath, {
    customOption: 'value'
});
```

### Создание государства
```javascript
const factory = new window.EntityFactory(plugin);
await factory.createEntity('State', startPath);
```

### Создание провинции
```javascript
const factory = new window.EntityFactory(plugin);
await factory.createEntity('Province', startPath);
```

## Заключение

`EntityFactory` значительно упрощает код создания сущностей, делая его более читаемым, поддерживаемым и расширяемым. Применение принципов DRY, KISS и SRP приводит к созданию качественного, профессионального кода.

## Следующие шаги

1. **Рефакторинг всех функций создания** для использования фабрики
2. **Добавление новых типов сущностей** в маппинги
3. **Создание специализированных методов** подготовки данных для новых типов
4. **Добавление валидации** на уровне фабрики
5. **Создание тестов** для фабрики
