<?php
// Скачайте файл https://unicode.org/Public/emoji/15.0/emoji-test.txt заранее и положите рядом с этим скриптом
$emojiFile = __DIR__ . '/emoji-test.txt';
$outputFile = __DIR__ . '/все_смайлики.md';

$emojis = [];
if (file_exists($emojiFile)) {
    $lines = file($emojiFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') !== false && preg_match('/^\s*([0-9A-F ]+)\s*; fully-qualified\s*#\s*(.+?)\s+E\d+\.\d+\s+(.+)$/u', $line, $matches)) {
            $codepoints = explode(' ', trim($matches[1]));
            $emoji = '';
            foreach ($codepoints as $cp) {
                $emoji .= mb_convert_encoding('&#x' . $cp . ';', 'UTF-8', 'HTML-ENTITIES');
            }
            $emojis[] = $emoji;
        }
    }
    // Удаляем дубликаты и сортируем
    $emojis = array_unique($emojis);
    sort($emojis);
    file_put_contents($outputFile, implode(' ', $emojis));
    echo "Файл $outputFile создан!\n";
} else {
    echo "Файл emoji-test.txt не найден. Скачайте его с https://unicode.org/Public/emoji/15.0/emoji-test.txt\n";
}