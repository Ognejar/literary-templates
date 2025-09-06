// button-icons.js
function replaceButtonIcons() {
    console.log('🔄 Замена текста кнопок на CSS-иконки');
    
    const buttons = document.querySelectorAll('.custom-world-button');
    console.log(`Найдено кнопок: ${buttons.length}`);
    
    buttons.forEach((button, index) => {
        // Удаляем текст и добавляем CSS-классы
        button.innerHTML = '';
        button.classList.add('custom-icon-button', 'icon-world');
        
        // Удаляем класс undefined если есть
        button.classList.remove('undefined');
        
        console.log(`✅ Кнопка ${index + 1} оформлена CSS-классами`);
    });
}

// Автоматический вызов
// setTimeout(replaceButtonIcons, 1000);