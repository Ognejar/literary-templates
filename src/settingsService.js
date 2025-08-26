/**
 * @file       src/settingsService.js
 * @description Универсальный сервис для чтения/нормализации настроек мира и поиска тэговых картинок
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies Obsidian App API
 * @created    2025-01-09
 * @updated    2025-01-09
 * @docs       docs/project.md
 */

(function initSettingsService() {
  // Защита от повторной инициализации
  if (typeof window !== 'undefined' && window.litSettingsService) return;

  function ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(/[;,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (value && typeof value === 'object') {
      return Object.values(value)
        .map((v) => {
          if (typeof v === 'string') return v;
          if (v && typeof v === 'object') {
            if (typeof v.name === 'string') return v.name;
            try { return JSON.stringify(v); } catch { return ''; }
          }
          return '';
        })
        .filter(Boolean);
    }
    return [];
  }

  async function readWorldSettings(app, projectRoot) {
    const defaults = {
      projectName: projectRoot ? projectRoot.split('/').pop() : 'Проект',
      locationTypes: ['Город', 'Деревня', 'Порт', 'Замок', 'Мертвая зона', 'Локация'],
      climates: ['Умеренный', 'Холодный', 'Теплый', 'Тропический', 'Сухой'],
      factions: ['Королевская власть', 'Гильдии', 'Аристократия'],
    };

    if (!projectRoot) return defaults;

    try {
      const jsonPath = `${projectRoot}/Настройки_мира.json`;
      const file = app.vault.getAbstractFileByPath(jsonPath);
      if (!file) return defaults;
      const raw = await app.vault.read(file);
      const parsed = JSON.parse(raw || '{}');

      const climates = ensureArray(parsed.climates);
      const locationTypes = ensureArray(parsed.locationTypes);
      const factionsSource = parsed.locations && parsed.locations.factions ? parsed.locations.factions : parsed.factions;
      const factions = ensureArray(factionsSource);

      return {
        ...parsed,
        climates: climates.length ? climates : defaults.climates,
        locationTypes: locationTypes.length ? locationTypes : defaults.locationTypes,
        factions: factions.length ? factions : defaults.factions,
      };
    } catch {
      return defaults;
    }
  }

  async function getClimates(app, projectRoot) {
    const settings = await readWorldSettings(app, projectRoot);
    return ensureArray(settings.climates);
  }

  async function getFactions(app, projectRoot) {
    const settings = await readWorldSettings(app, projectRoot);
    let factions = ensureArray(settings.factions);
    
    // Автоматически добавляем фракции из папки Фракции/
    if (projectRoot) {
      try {
        const factionsFolder = app.vault.getAbstractFileByPath(`${projectRoot}/Локации/Фракции`);
        if (factionsFolder && factionsFolder.children) {
          const createdFactions = factionsFolder.children
            .filter(file => file.extension === 'md')
            .map(file => file.basename)
            .filter(name => name && name.trim());
          
          // Объединяем статические фракции с созданными, убираем дубликаты
          const allFactions = [...new Set([...factions, ...createdFactions])];
          return allFactions.sort();
        }
      } catch (error) {
        console.warn('Ошибка сканирования папки Фракции:', error);
      }
    }
    
    return factions;
  }

  async function getLocationTypes(app, projectRoot) {
    const settings = await readWorldSettings(app, projectRoot);
    return ensureArray(settings.locationTypes);
  }

  function findTagImage(app, projectRoot, baseName, preferredExts = ['jpg', 'jpeg', 'png', 'webp']) {
    if (!projectRoot || !baseName) return '';
    const folder = `${projectRoot}/Теговые_картинки`;
    for (const ext of preferredExts) {
      const p = `${folder}/${baseName}.${ext}`;
      const f = app.vault.getAbstractFileByPath(p);
      if (f) return p;
    }
    return '';
  }

  function getTagImageBlock(app, projectRoot, tag, preferredExts = ['jpg', 'jpeg', 'png', 'webp']) {
    if (!projectRoot || !tag) return '';
    const folder = `${projectRoot}/Теговые_картинки`;
    for (const ext of preferredExts) {
      const p = `${folder}/${tag}.${ext}`;
      const f = app.vault.getAbstractFileByPath(p);
      if (f) {
        return `![[${p}]]`;
      }
    }
    return '';
  }

  const api = { ensureArray, readWorldSettings, getClimates, getFactions, getLocationTypes, findTagImage, getTagImageBlock };
  if (typeof window !== 'undefined') {
    window.litSettingsService = api;
  }
})();
