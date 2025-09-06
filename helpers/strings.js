/**
 * helpers/strings.js
 * Небольшие строковые утилиты
 */

function clean(s) {
  return String(s || '').trim();
}

function cleanName(name) {
  // Совместимо с текущей логикой в ReligionWizardModal
  return String(name || '')
    .replace(/[^а-яА-ЯёЁ\w\s-.]/g, '')
    .replace(/\s+/g, '_');
}

function todayFormatted() {
  try {
    if (typeof window !== 'undefined' && window.moment) {
      return window.moment().format('YYYY-MM-DD');
    }
  } catch (e) {}
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  clean,
  cleanName,
  todayFormatted,
};
