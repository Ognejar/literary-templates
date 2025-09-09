/**
 * @file       FactsService.js
 * @description Утилиты для работы с фактами проекта (загрузка/сохранение JSON, нормализация, слияние)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (App, TFile)
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

// Путь к базе фактов внутри корня проекта
function getFactsPaths(projectRoot) {
    const dir = `${projectRoot}/Лор-контекст`;
    return {
        dir,
        jsonPath: `${dir}/Факты.json`,
    };
}

// Загрузка массива фактов из JSON файла проекта
async function loadFacts(app, projectRoot) {
    try {
        const { jsonPath } = getFactsPaths(projectRoot);
        const f = app.vault.getAbstractFileByPath(jsonPath);
        if (!(f instanceof TFile)) return [];
        const raw = await app.vault.read(f);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

// Сохранение массива фактов в JSON файл проекта
async function saveFacts(app, projectRoot, facts) {
    const { dir, jsonPath } = getFactsPaths(projectRoot);
    try { if (!app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir); } catch (e) {}
    const data = JSON.stringify(facts || [], null, 2);
    const existing = app.vault.getAbstractFileByPath(jsonPath);
    if (existing instanceof TFile) await app.vault.modify(existing, data); else await app.vault.create(jsonPath, data);
}

// Компактная диагностика/агрегация по фактам
function computeFactsDiagnostics(app, projectRoot) {
    return {
        async run() {
            const facts = await loadFacts(app, projectRoot);
            const defined = new Set();
            const referenced = new Set();
            for (const raw of facts) {
                const f = normalizeRussianFactKeys(raw);
                if (f && f.id) defined.add(String(f.id));
                for (const r of collectReferencedIds(f)) referenced.add(r);
            }
            const missing = Array.from(referenced).filter(id => !defined.has(id));
            return { facts, definedIds: defined, referencedIds: referenced, missingIds: missing };
        }
    };
}

// Нормализация ключей RU-схемы
function normalizeRussianFactKeys(factAny) {
    const f = typeof factAny === 'object' && factAny !== null ? { ...factAny } : {};
    if (f.type && !f['тип']) { f['тип'] = String(f.type); delete f.type; }
    if (f.name && !f['имя']) { f['имя'] = String(f.name); delete f.name; }
    if (f.attrs && !f['атрибуты']) { f['атрибуты'] = f.attrs; delete f.attrs; }
    if (typeof f.confidence === 'number' && f['достоверность'] == null) { f['достоверность'] = f.confidence; delete f.confidence; }
    if (f.source && !f['источник']) {
        const s = { ...f.source };
        if (s.path && !s['путь']) { s['путь'] = s.path; delete s.path; }
        f['источник'] = s; delete f.source;
    }
    if (Array.isArray(f.relations) && !Array.isArray(f['отношения'])) {
        f['отношения'] = f.relations.map(r => {
            const rr = { ...r };
            if (rr.predicate && !rr['связь']) { rr['связь'] = String(rr.predicate); delete rr.predicate; }
            if (rr.object && !rr['объект']) { rr['объект'] = String(rr.object); delete rr.object; }
            if (rr.attrs && !rr['атрибуты']) { rr['атрибуты'] = rr.attrs; delete rr.attrs; }
            return rr;
        });
        delete f.relations;
    }
    return f;
}

// Сбор ссылок из отношений факта
function collectReferencedIds(fact) {
    const refs = new Set();
    const rels = Array.isArray(fact['отношения']) ? fact['отношения'] : [];
    for (const r of rels) {
        if (r && typeof r === 'object' && r['объект']) refs.add(String(r['объект']));
    }
    return refs;
}

// Парсинг id формата type:name
function parseTypeAndNameFromId(id) {
    const s = String(id || '');
    const idx = s.indexOf(':');
    if (idx === -1) return { тип: '', имя: s.replace(/_/g, ' ') };
    const typePart = s.slice(0, idx);
    const namePart = s.slice(idx + 1);
    return { тип: typePart, имя: namePart.replace(/_/g, ' ') };
}

// Добавление недостающих болванок по ссылкам
function addMissingEntityStubs(facts) {
    const out = [];
    const byId = new Map();
    for (const raw of facts) {
        const f = normalizeRussianFactKeys(raw);
        if (f && f.id) byId.set(String(f.id), f);
        out.push(f);
    }
    const referenced = new Set();
    for (const f of out) {
        for (const ref of collectReferencedIds(f)) referenced.add(ref);
    }
    const added = [];
    for (const refId of referenced) {
        if (!byId.has(refId)) {
            const base = parseTypeAndNameFromId(refId);
            const stub = {
                id: refId,
                'тип': base.тип || 'сущность',
                'имя': base.имя || '',
                'атрибуты': {},
                'отношения': [],
                'достоверность': 0.2
            };
            out.push(stub);
            byId.set(refId, stub);
            added.push(refId);
        }
    }
    return { facts: out, addedIds: added };
}

// Подпись факта для сравнения
function computeFactSignature(fact) {
    try {
        const id = String(fact.id || '');
        const type = String(fact['тип'] || '');
        const name = String(fact['имя'] || '');
        const attrs = fact['атрибуты'] ? JSON.stringify(fact['атрибуты'], Object.keys(fact['атрибуты']).sort()) : '';
        const rels = Array.isArray(fact['отношения'])
            ? JSON.stringify(
                fact['отношения']
                    .map(r => ({ связь: r['связь'], объект: r['объект'] }))
                    .sort((a, b) => (a.связь + a.объект).localeCompare(b.связь + b.объект))
              )
            : '';
        return `${type}|${id}|${name}|${attrs}|${rels}`;
    } catch (e) { return Math.random().toString(36).slice(2); }
}

// Слияние входящих фактов в проект с сохранением
async function mergeFactsIntoProject(app, projectRoot, incomingFacts) {
    const existing = await loadFacts(app, projectRoot);
    const normalizedExisting = existing.map(normalizeRussianFactKeys);
    const map = new Map();
    for (const f of normalizedExisting) { map.set(computeFactSignature(f), f); }
    let mergedCount = 0, addedCount = 0, updatedCount = 0;
    for (const raw of incomingFacts) {
        mergedCount++;
        const f = normalizeRussianFactKeys(raw);
        const sig = computeFactSignature(f);
        if (!map.has(sig)) { map.set(sig, f); addedCount++; }
        else {
            const prev = map.get(sig);
            try {
                const nf = { ...prev };
                if (typeof f['достоверность'] === 'number') nf['достоверность'] = Math.max(prev['достоверность'] || 0, f['достоверность']);
                if (f['источник']) nf['источник'] = f['источник'];
                map.set(sig, nf);
                updatedCount++;
            } catch (e) {}
        }
    }
    const afterMerge = Array.from(map.values());
    const withStubs = addMissingEntityStubs(afterMerge).facts;
    await saveFacts(app, projectRoot, withStubs);
    return { mergedCount, addedCount, updatedCount };
}

// Очистка JSON-текста от ограждений/комментариев
function cleanJsonInput(text) {
    let s = String(text || '');
    s = s.replace(/^\uFEFF/, '');
    s = s.replace(/[\u00A0\u200B\u200C\u200D]/g, ' ');
    const lines = s.split(/\r?\n/).filter(line => {
        const trimmed = String(line).trim();
        if (/^--\s?/.test(trimmed)) return false;
        if (/^```/.test(trimmed)) return false;
        if (/^``\s*$/.test(trimmed)) return false;
        if (/^```json\b/i.test(trimmed)) return false;
        return true;
    });
    s = lines.join('\n');
    if (/^```/.test(s.trim())) {
        s = s.trim().replace(/^```(?:json)?\s*[\r\n]/, '').replace(/```\s*$/, '');
    }
    return s.trim();
}

// Экспорт для использования в других модулях
const FactsService = {
    getFactsPaths,
    loadFacts,
    saveFacts,
    computeFactsDiagnostics,
    normalizeRussianFactKeys,
    collectReferencedIds,
    parseTypeAndNameFromId,
    addMissingEntityStubs,
    computeFactSignature,
    mergeFactsIntoProject,
    cleanJsonInput,
};

if (typeof window !== 'undefined') {
    window.FactsService = FactsService;
}

module.exports = { FactsService };


