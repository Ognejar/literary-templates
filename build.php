<?php
// build.php — склеивает все js-файлы в один main.js для Obsidian

$files = [
    'modals.js',           // Сначала вспомогательные модальные окна
    'projectRoot.js',      // Затем утилиты
    'src/settingsService.js', // Сервис настроек и тэговых картинок
    'ProjectSelectorModal.js',  // Новые селекторы
    'ChapterSelectorModal.js',
    'WorldSettingsModal.js',    // Редактор настроек мира
    'PotionWizardModal.js',
    'SpellWizardModal.js',
    'SceneWizardModal.js',
    'VillageWizardModal.js',
    'LocationWizardModal.js',
    'CityWizardModal.js',
    'DeadZoneWizardModal.js',
    'PortWizardModal.js',
    'ProvinceWizardModal.js',
    'CastleWizardModal.js',
    'MineWizardModal.js',
    'FactoryWizardModal.js',
    'FarmWizardModal.js',
    'StateWizardModal.js',      // Мастер создания государства
    // Включаем creators файлы - они нужны для standalone функций
    'creators/createWorld.js',
    'creators/createVillage.js',
    'creators/createDeadZone.js',
    'creators/createScene.js',
    'creators/createChapter.js',
    'creators/createCity.js',
    'creators/createLocation.js',
    'creators/createPort.js',
    'creators/createCastle.js',
    'creators/createMine.js',
    'creators/createFactory.js',
    'creators/createFarm.js',
    'creators/createPotion.js',
    'creators/createSpell.js',
    'creators/createState.js',
    'creators/createProvince.js',
    'main.js'              // Главный файл в конце
];

$out = '';
$totalSize = 0;
echo "Размеры исходных файлов:\n";
foreach ($files as $file) {
    if (file_exists($file)) {
        $size = filesize($file);
        $totalSize += $size;
        echo str_pad($file, 25) . ': ' . str_pad($size, 8, ' ', STR_PAD_LEFT) . " байт\n";
        $out .= "\n// --- $file ---\n" . file_get_contents($file);
    } else {
        echo "Внимание: файл $file не найден!\n";
    }
}
echo "Суммарный размер всех исходных файлов: $totalSize байт\n";
file_put_contents('main.bundle.js', $out);
echo "Сборка завершена: main.bundle.js\n";

// Простая очистка - удаляем только дублирующиеся импорты obsidian
$main = file_get_contents('main.bundle.js');

// Удаляем ВСЕ строки с импортами obsidian (более агрессивно)
$main = preg_replace('/^.*const \{ .* \} = require\([\'\"]obsidian[\'\"]\);.*\n?/m', '', $main, -1, $count1);

// Удаляем все строки с const { ... } = require('obsidian');
$main = preg_replace('/^.*const \{ .* \} = require\([\'\"]obsidian[\'\"]\);.*\n?/m', '', $main, -1, $count2);

// Удаляем импорты модулей, которые больше не нужны в собранном файле
$main = preg_replace('/^.*const \{ .* \} = require\([\'\"].*\.js[\'\"]\);.*\n?/m', '', $main, -1, $count4);

// Удаляем дублирующиеся функции из main.js, которые уже есть в projectRoot.js
// НЕ удаляем findProjectRoot, getAllProjectRoots, fillTemplate, generateFromTemplate, ensureEntityInfrastructure из main.js
// так как они нужны для работы функций create*

// Удаляем неправильные require импорты из creators файлов
$main = preg_replace('/const \{ .* \} = require\([\'\"].*\.js[\'\"]\);.*\n?/m', '', $main, -1, $count12);
$main = preg_replace('/const \{ .* \} = require\([\'\"].*[\'\"]\);.*\n?/m', '', $main, -1, $count13);

// Удаляем старые сигнатуры функций create* с параметрами (app, plugin, startPath)
$main = preg_replace('/async function createWorld\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count14);
$main = preg_replace('/async function createVillage\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count15);
$main = preg_replace('/async function createDeadZone\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count16);
$main = preg_replace('/async function createScene\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count17);
$main = preg_replace('/async function createChapter\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count18);
$main = preg_replace('/async function createCity\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count19);
$main = preg_replace('/async function createLocation\(app, plugin, startPath = \'\'\)\s*\{[\s\S]*?\n\}/m', '', $main, -1, $count20);

// Удаляем module.exports из modals.js (не нужен для плагина)
$main = preg_replace('/module\\.exports = \\{ PromptModal, SuggesterModal \\};\\s*\\n/', '', $main, -1, $count11);

// Удаляем дублированные module.exports в конце файла
$main = preg_replace('/module\\.exports = LiteraryTemplatesPlugin;\\s*\\n\\s*module\\.exports = LiteraryTemplatesPlugin;\\s*$/', 'module.exports = LiteraryTemplatesPlugin;', $main, -1, $count9);

// Добавляем правильный экспорт для плагина Obsidian в конец файла (если его нет)
if (strpos($main, 'module.exports = LiteraryTemplatesPlugin;') === false) {
    $main .= "\n\nmodule.exports = LiteraryTemplatesPlugin;";
}

// Добавляем один импорт obsidian в начало
$main = "const { Plugin, Notice, TFile, TFolder, Modal, Setting } = require('obsidian');\n\n" . $main;

file_put_contents('main.bundle.js', $main);

$bundleSize = filesize('main.bundle.js');
echo "Размер main.bundle.js: $bundleSize байт\n";
if ($bundleSize > $totalSize) {
    echo "ВНИМАНИЕ: Итоговый файл main.bundle.js больше суммы исходных файлов на " . ($bundleSize - $totalSize) . " байт!\n";
} else {
    echo "main.bundle.js меньше или равен сумме исходных файлов.\n";
}

echo "Удалено $count1 лишних импортов obsidian\n";
echo "Удалено $count2 лишних импортов obsidian (повторно)\n";
echo "Удалено $count4 импортов модулей\n";
echo "Функции findProjectRoot, getAllProjectRoots, fillTemplate, generateFromTemplate, ensureEntityInfrastructure оставлены в main.js\n";
echo "Удалено $count11 module.exports из modals.js\n";
echo "Удалено $count12 неправильных require импортов из creators\n";
echo "Удалено $count13 неправильных require импортов (общий)\n";
echo "Удалено $count14 старых функций createWorld\n";
echo "Удалено $count15 старых функций createVillage\n";
echo "Удалено $count16 старых функций createDeadZone\n";
echo "Удалено $count17 старых функций createScene\n";
echo "Удалено $count18 старых функций createChapter\n";
echo "Удалено $count19 старых функций createCity\n";
echo "Удалено $count20 старых функций createLocation\n";
echo "Удалено $count9 дублированных module.exports\n";
echo "Проверен экспорт для плагина\n";

// --- АНАЛИЗ ДУБЛИКАТОВ ---
function analyzeDuplicates($filename) {
    $code = file_get_contents($filename);
    $lines = explode("\n", $code);
    $signatures = [];
    foreach ($lines as $line) {
        // Ищем function, class, const/let/var <name> = (function|async function|class)
        if (preg_match('/^\s*function\s+([a-zA-Z0-9_]+)/', $line, $m)) {
            $signatures[] = 'function ' . $m[1];
        } elseif (preg_match('/^\s*class\s+([a-zA-Z0-9_]+)/', $line, $m)) {
            $signatures[] = 'class ' . $m[1];
        } elseif (preg_match('/^\s*(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(async\s+)?function/', $line, $m)) {
            $signatures[] = $m[1] . ' ' . $m[2] . ' = function';
        } elseif (preg_match('/^\s*(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*class/', $line, $m)) {
            $signatures[] = $m[1] . ' ' . $m[2] . ' = class';
        }
    }
    $counts = array_count_values($signatures);
    arsort($counts);
    $duplicates = array_filter($counts, function($v) { return $v > 1; });
    if (count($duplicates) > 0) {
        echo "\nТоп-10 дублирующихся сигнатур (function/class):\n";
        $i = 0;
        foreach ($duplicates as $sig => $cnt) {
            echo str_pad($sig, 40) . ": " . $cnt . "\n";
            $i++;
            if ($i >= 10) break;
        }
    } else {
        echo "\nДублирующихся function/class не найдено.\n";
    }
}
analyzeDuplicates('main.bundle.js');

// Копируем результат в папку плагина Obsidian
$target = 'C:/Obsidian_data_C/.obsidian/plugins/literary-templates/main.js';
if (copy('main.bundle.js', $target)) {
    echo "main.bundle.js скопирован в $target\n";
} else {
    echo "Ошибка копирования main.bundle.js в $target\n";
}

// --- КОПИРОВАНИЕ ШАБЛОНОВ ---
function copyDir($src, $dst) {
    if (!is_dir($src)) return false;
    if (!is_dir($dst)) mkdir($dst, 0777, true);
    $dir = opendir($src);
    while(false !== ($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                copyDir($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
    return true;
}

$srcTemplates = __DIR__ . '/templates';
$dstTemplates = 'C:/Obsidian_data_C/.obsidian/plugins/literary-templates/templates';
if (copyDir($srcTemplates, $dstTemplates)) {
    echo "Шаблоны скопированы в $dstTemplates\n";
} else {
    echo "Ошибка копирования шаблонов в $dstTemplates\n";
}

// Копируем секции шаблонов
$srcSections = __DIR__ . '/templates/sections';
$dstSections = 'C:/Obsidian_data_C/.obsidian/plugins/literary-templates/templates/sections';

// Диагностика исходной папки
if (!is_dir($srcSections)) {
    echo "Исходная папка секций не найдена: $srcSections\n";
} else {
    echo "Исходная папка секций найдена: $srcSections\n";
    // Автоматически создаём целевую папку, если её нет
    if (!is_dir($dstSections)) {
        if (mkdir($dstSections, 0777, true)) {
            echo "Целевая папка секций создана: $dstSections\n";
        } else {
            echo "Не удалось создать целевую папку секций: $dstSections\n";
        }
    }
}
if (copyDir($srcSections, $dstSections)) {
    echo "Секции шаблонов скопированы в $dstSections\n";
} else {
    echo "Ошибка копирования секций шаблонов в $dstSections\n";
}