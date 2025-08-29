// Скрипт для замены country на state во всех шаблонах
// Запускать в Obsidian Developer Console

const templatesDir = 'templates';
const files = [
    'Новая_локация.md',
    'Новый_замок.md',
    'Новая_мертвая_зона.md',
    'Новая_ферма.md',
    'Новая_шахта.md',
    'Новый_порт.md',
    'Новая_фортификация.md',
    'Новый_завод.md',
    'Новый_социальный_объект.md'
];

console.log('🔧 Начинаем замену country -> state в шаблонах...');

files.forEach(async (filename) => {
    try {
        const filePath = `${templatesDir}/${filename}`;
        const file = app.vault.getAbstractFileByPath(filePath);
        
        if (file && file instanceof TFile) {
            const content = await app.vault.read(file);
            
            // Заменяем country на state
            let newContent = content
                .replace(/country:\s*"{{country}}"/g, 'state: "{{state}}"')
                .replace(/country:\s*"{{state}}"/g, 'state: "{{state}}"')
                .replace(/country:\s*{{country}}/g, 'state: {{state}}')
                .replace(/country:\s*{{state}}/g, 'state: {{state}}')
                .replace(/this\.country/g, 'this.state')
                .replace(/AND country = this\.country/g, 'AND state = this.state')
                .replace(/country = this\.country/g, 'state = this.state');
            
            if (newContent !== content) {
                await app.vault.modify(file, newContent);
                console.log(`✅ Исправлен: ${filename}`);
            } else {
                console.log(`ℹ️ Без изменений: ${filename}`);
            }
        } else {
            console.log(`⚠️ Файл не найден: ${filename}`);
        }
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filename}:`, error);
    }
});

console.log('🎉 Замена завершена!');
