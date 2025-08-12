# Тест функции getTagImageBlock

## Проверка функции

```javascript
// Тестируем функцию getTagImageBlock
if (window.litSettingsService) {
    console.log('=== Тест getTagImageBlock ===');
    
    const project = '1_Пробный/заявсь';
    
    // Тест 1: Мёртвая зона (с ё)
    const result1 = window.litSettingsService.getTagImageBlock(app, project, 'Мёртвая зона');
    console.log('Мёртвая зона (с ё):', result1);
    
    // Тест 2: Мертвая зона (без ё)
    const result2 = window.litSettingsService.getTagImageBlock(app, project, 'Мертвая зона');
    console.log('Мертвая зона (без ё):', result2);
    
    // Тест 3: Проверяем, что файл существует
    const file = app.vault.getAbstractFileByPath('1_Пробный/заявсь/Теговые_картинки/Мертвая зона.jpg');
    console.log('Файл существует:', file ? 'Да' : 'Нет');
    console.log('Путь к файлу:', file ? file.path : 'Не найден');
}
```

## Ожидаемый результат

Функция должна вернуть:
- `![[1_Пробный/заявсь/Теговые_картинки/Мертвая зона.jpg]]` для теста 2
- Пустую строку для теста 1 (файл с ё не существует)
