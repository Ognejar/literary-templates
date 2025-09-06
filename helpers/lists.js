/**
 * helpers/lists.js
 * Универсальные утилиты для работы со списками
 */

function clean(s) {
  return String(s || '').trim();
}

function parseCommaList(s) {
  return clean(s)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

function toBulleted(list) {
  return (Array.isArray(list) ? list : []).map(x => `- ${x}`).join('\n');
}

function toWikiLinks(list) {
  return (Array.isArray(list) ? list : []).map(x => `[[${x}]]`).join(', ');
}

module.exports = {
  clean,
  parseCommaList,
  toBulleted,
  toWikiLinks,
};
