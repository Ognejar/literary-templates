/**
 * @file       ProjectDiscovery.js
 * @description Обнаружение папок проектов и корней миров по структуре хранилища
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (App, TFile, TFolder)
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

// Возвращает список папок-проектов (папки, где есть под-папки миров ИЛИ файл-маркер 'Проекты.md')
async function getAllProjectFolders(app) {
    const all = app.vault.getMarkdownFiles();
    // 1) Папки, где есть миры с 'Настройки_мира.md'
    const worldSettings = all.filter(f => f.basename === 'Настройки_мира');
    const worldRoots = new Set(worldSettings.map(f => f.parent ? f.parent.path : ''));
    const projectFolders = new Set();
    worldRoots.forEach(root => {
        const parts = String(root).split('/');
        if (parts.length > 1) projectFolders.add(parts.slice(0, -1).join('/'));
    });
    // 2) Папки, где есть файл-маркер 'Проекты.md'
    const markers = all.filter(f => f.basename === 'Проекты');
    markers.forEach(f => { if (f.parent && f.parent.path) projectFolders.add(f.parent.path); });
    return Array.from(projectFolders);
}

// Возвращает список корней всех проектов (папки миров, где лежит 'Настройки_мира.md')
async function getAllProjectRoots(app) {
    const all = app.vault.getMarkdownFiles();
    const roots = all
        .filter(f => f.basename === 'Настройки_мира')
        .map(f => f.parent ? f.parent.path : '')
        .filter(Boolean);
    return Array.from(new Set(roots));
}

if (typeof window !== 'undefined') {
    window.getAllProjectFolders = getAllProjectFolders;
    window.getAllProjectRoots = getAllProjectRoots;
}

module.exports = { getAllProjectFolders, getAllProjectRoots };


