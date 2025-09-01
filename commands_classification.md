# Классификация команд плагина Literary Templates

## 1. Готовые к работе команды (зарегистрированы и находятся в commands.md)

| ID команды | Название команды |
| :--- | :--- |
| `ai-append-current-note-lore` | AI добавить лор из текущего документа |
| `ai-gather-project-lore` | AI собрать лор по проекту (перезаписать файл) |
| `ai-prompt-selector` | AI промпт-селектор (выбор шаблона для внешнего чата) |
| `create-new-character` | Создать нового персонажа |
| `create-new-potion` | Создать новое зелье |
| `create-new-spell-wizard` | Создать новое заклинание (мастер) |
| `create-artifact` | Создать артефакт (минишаблонизатор) |
| `create-chapter` | Создать главу (минишаблонизатор) |
| `create-conflict` | Создать конфликт (мастер) |
| `create-cult` | Создать культ (мастер) |
| `create-event` | Создать событие (мастер) |
| `create-faction` | Создать фракцию (мастер) |
| `create-factory` | Создать завод (минишаблонизатор) |
| `create-farm` | Создать ферму (минишаблонизатор) |
| `create-log-file` | Создать лог файл (принудительно) |
| `create-mine` | Создать шахту (минишаблонизатор) |
| `create-monster` | Создать монстра (минишаблонизатор) |
| `create-organization` | Создать организацию (мастер) |
| `create-people` | Создать народ (минишаблонизатор) |
| `create-potion` | Создать зелье (минишаблонизатор) |
| `create-quest` | Создать квест (мастер) |
| `create-religion` | Создать религию (мастер) |
| `create-scene` | Создать сцену (минишаблонизатор) |
| `create-social-institution` | Создать социальный объект (мастер) |
| `create-task` | Создать задачу (мастер) |
| `create-trade-route` | Создать торговый путь (мастер) |
| `create-village` | Создать деревню (минишаблонизатор) |
| `create-work` | Создать произведение |
| `create-world` | Создать новый мир/проект |
| `edit-world-settings` | Редактировать настройки мира |
| `import-facts-from-clipboard` | Импортировать факты из буфера |
| `import-facts-manual` | Импортировать факты (ручной ввод) |
| `insert-plotline-into-scene` | Вставить сюжетную линию в сцену |
| `insert-todo` | Вставить TODO |
| `literary-switch-project` | Литературные шаблоны: Сменить проект |
| `manage-ai-keys` | Управление AI ключами |
| `migrate-existing-content` | Мигрировать существующий контент |
| `open-plugin-settings-file` | Открыть настройки Literary Templates |
| `open-writer-handbook` | Справочник писателя (создать/открыть) |
| `run-temporal-tests` | Запустить тесты временных слоев |
| `select-epoch` | Выбрать эпоху |
| `set-writer-handbook-status` | Справочник: установить статус (planned/started/writing/done/abandoned) |
| `test-ai-connection` | Тест AI подключения |
| `toggle-debug-logging` | Переключить отладку (логирование) |
| `view-facts-database` | Просмотреть базу фактов |
| `add-project-overview-block` | Проект: добавить список файлов (2 уровня) |
| `add-project-tasks-block` | Проект: добавить виджет задач (Dataview) на главную |

## 2. Сделаны, но не зарегистрированы (есть реализация, но отсутствуют в commands.md)

| ID команды | Название команды | Файлы реализации |
| :--- | :--- | :--- |
| `create-city` | Создать город | createCity.js, CityWizardModal.js |
| `create-state` | Создать государство | createState.js, StateWizardModal.js |
| `create-province` | Создать провинцию | createProvince.js, ProvinceWizardModal.js |
| `create-castle` | Создать замок | createCastle.js, CastleWizardModal.js |
| `create-port` | Создать порт | createPort.js, PortWizardModal.js |
| `create-dead-zone` | Создать мертвую зону | createDeadZone.js, DeadZoneWizardModal.js |
| `create-location` | Создать локацию | createLocation.js, LocationWizardModal.js |
| `create-character` | Создать персонажа | createCharacter.js, CharacterWizardModal.js |
| `create-alchemy-recipe` | Создать алхимический рецепт | createAlchemyRecipe.js, AlchemyRecipeWizardModal.js |

## 3. Висящие воздухе (частично реализованные)

На данный момент не выявлено команд, которые были бы частично реализованы. Все найденные файлы в директории creators/* содержат полную реализацию соответствующих команд.
