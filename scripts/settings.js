import { validateAmount, validateRate, validateCategory } from './validators.js';
import { records, settings, updateSettings, replaceRecords } from './state.js';
import { parseImport, downloadJson } from './storage.js';
import { $, say, showError, renderCategories } from './ui.js';

const settingsFields = [
  ['cap-input', 'Monthly cap', validateAmount],
  ['rate-usd', 'USD rate', validateRate],
  ['rate-eur', 'EUR rate', validateRate],
];

function checkSettings(event) {
  event.preventDefault();
  let error = '';

  for (const [id, label, validate] of settingsFields) {
    const message = validate($(id).value);
    $(id).setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message && !error) {
      error = `${label}: ${message}`;
      $(id).focus();
    }
  }

  $('settings-error').textContent = error;
  return !error;
}

function addCategory(event) {
  event.preventDefault();
  const name = $('new-category').value;
  let message = validateCategory(name);
  if (!message && settings.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    message = 'That category already exists.';
  }

  showError('new-category', 'category-error', message);
  if (message) return $('new-category').focus();

  updateSettings({ categories: [...settings.categories, name] });
  $('category-form').reset();
  renderCategories(settings.categories);
  say('Category added.');
}

function removeCategory(event) {
  const name = event.target.dataset.category;
  if (!name) return;

  const used = records.filter(r => r.category === name).length;
  let message = '';
  if (used) message = `"${name}" is used by ${used} record(s), so it cannot be removed.`;
  else if (settings.categories.length === 1) message = 'Keep at least one category.';

  $('category-error').textContent = message;
  if (message) return;

  updateSettings({ categories: settings.categories.filter(c => c !== name) });
  renderCategories(settings.categories);
  say('Category removed.');
}

async function importFile(event, refresh) {
  const file = event.target.files[0];
  if (!file) return;

  const result = parseImport(await file.text());
  $('import-error').textContent = result.error || '';
  event.target.value = '';
  if (result.error) return;
  if (!confirm(`Replace your ${records.length} records with the ${result.records.length} in this file?`)) return;

  replaceRecords(result.records);
  const extra = result.records.map(r => r.category).filter(c => !settings.categories.includes(c));
  if (extra.length) updateSettings({ categories: [...settings.categories, ...new Set(extra)] });

  renderCategories(settings.categories);
  refresh();
  say(`Imported ${result.records.length} records.`);
}

export function setupSettings(refresh) {
  $('cap-input').value = settings.cap;
  $('rate-usd').value = settings.rates.USD;
  $('rate-eur').value = settings.rates.EUR;
  renderCategories(settings.categories);

  $('settings-form').addEventListener('submit', event => {
    if (!checkSettings(event)) return;
    updateSettings({
      cap: Number($('cap-input').value),
      rates: { USD: Number($('rate-usd').value), EUR: Number($('rate-eur').value) },
    });
    refresh();
    say('Settings saved.');
  });

  $('category-form').addEventListener('submit', addCategory);
  $('category-list').addEventListener('click', removeCategory);
  $('import-file').addEventListener('change', event => importFile(event, refresh));
  $('export-btn').addEventListener('click', () => {
    downloadJson(records, `finance-tracker-${new Date().toISOString().slice(0, 10)}.json`);
    say('Exported your transactions.');
  });
}
