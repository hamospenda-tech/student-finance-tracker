import { validateDescription, validateAmount, validateDate, validateCategory, validateRate } from './validators.js';
import { records, settings, addRecord, updateRecord, deleteRecord, updateSettings, replaceRecords } from './state.js';
import { compileRegex, filterRecords, sortRecords } from './search.js';
import { parseImport, downloadJson } from './storage.js';
import { getStats } from './stats.js';
import { renderRecords, renderDashboard, renderCategories } from './ui.js';

const $ = id => document.getElementById(id);
let editingId = null;

const fields = [
  ['description', validateDescription],
  ['amount', validateAmount],
  ['date', validateDate],
];

const settingsFields = [
  ['cap-input', 'Monthly cap', validateAmount],
  ['rate-usd', 'USD rate', validateRate],
  ['rate-eur', 'EUR rate', validateRate],
];

function say(message) {
  $('status').textContent = message;
  setTimeout(() => { $('status').textContent = ''; }, 4000);
}

function showError(inputId, errorId, message) {
  $(errorId).textContent = message;
  $(inputId).setAttribute('aria-invalid', message ? 'true' : 'false');
}

function render() {
  const text = $('search').value;
  const re = compileRegex(text, $('ci').checked ? 'gi' : 'g');
  const shown = sortRecords(filterRecords(records, re), $('sort').value);
  renderRecords(shown, re, editingId);
  renderDashboard(getStats(records, settings), settings.cap);

  let message = '';
  if (text && !re) message = 'That is not a valid regex pattern.';
  else if (re) message = `${shown.length} of ${records.length} records match.`;
  $('search-status').textContent = message;
}

function fillSettings() {
  $('cap-input').value = settings.cap;
  $('rate-usd').value = settings.rates.USD;
  $('rate-eur').value = settings.rates.EUR;
}

function focusEdit(id) {
  [...document.querySelectorAll('[data-action="edit"]')].find(b => b.dataset.id === id)?.focus();
}

function saveEdit(id) {
  const values = {
    description: $('edit-description').value,
    amount: $('edit-amount').value,
    category: $('edit-category').value,
    date: $('edit-date').value,
  };
  const error = validateDescription(values.description) || validateAmount(values.amount) || validateDate(values.date);
  $('edit-error').textContent = error;
  if (error) return;

  updateRecord(id, { ...values, amount: Number(values.amount) });
  editingId = null;
  render();
  say('Transaction updated.');
  focusEdit(id);
}

function cancelEdit() {
  const id = editingId;
  editingId = null;
  render();
  focusEdit(id);
}

for (const [name, validate] of fields) {
  $(name).addEventListener('change', () => showError(name, name + '-error', validate($(name).value)));
}

['search', 'ci', 'sort'].forEach(id => $(id).addEventListener('input', render));
document.querySelector('.toolbar').addEventListener('submit', event => event.preventDefault());

$('record-form').addEventListener('submit', event => {
  event.preventDefault();
  let firstBad = null;

  for (const [name, validate] of fields) {
    const message = validate($(name).value);
    showError(name, name + '-error', message);
    if (message && !firstBad) firstBad = $(name);
  }

  if (firstBad) {
    firstBad.focus();
    return;
  }

  addRecord({
    description: $('description').value,
    amount: $('amount').value,
    category: $('category').value,
    date: $('date').value,
  });
  $('record-form').reset();
  render();
  say('Transaction saved.');
});

$('cancel-btn').addEventListener('click', () => {
  $('record-form').reset();
  for (const [name] of fields) showError(name, name + '-error', '');
});

$('settings-form').addEventListener('submit', event => {
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
  if (error) return;

  updateSettings({
    cap: Number($('cap-input').value),
    rates: { USD: Number($('rate-usd').value), EUR: Number($('rate-eur').value) },
  });
  render();
  say('Settings saved.');
});

$('category-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('new-category').value;
  let message = validateCategory(name);
  if (!message && settings.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    message = 'That category already exists.';
  }

  showError('new-category', 'category-error', message);
  if (message) {
    $('new-category').focus();
    return;
  }

  updateSettings({ categories: [...settings.categories, name] });
  $('category-form').reset();
  renderCategories(settings.categories);
  say('Category added.');
});

$('category-list').addEventListener('click', event => {
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
});

$('export-btn').addEventListener('click', () => {
  downloadJson(records, `finance-tracker-${new Date().toISOString().slice(0, 10)}.json`);
  say('Exported your transactions.');
});

$('import-file').addEventListener('change', async event => {
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

  editingId = null;
  renderCategories(settings.categories);
  render();
  say(`Imported ${result.records.length} records.`);
});

$('records-body').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === 'edit') {
    editingId = id;
    render();
    $('edit-description').focus();
  } else if (action === 'cancel') {
    cancelEdit();
  } else if (action === 'save') {
    saveEdit(id);
  } else if (action === 'delete' && confirm('Delete this transaction?')) {
    deleteRecord(id);
    render();
    say('Transaction deleted.');
  }
});

$('records-body').addEventListener('keydown', event => {
  if (!editingId) return;
  if (event.key === 'Escape') cancelEdit();
  if (event.key === 'Enter' && event.target.tagName === 'INPUT') saveEdit(editingId);
});

async function start() {
  if (localStorage.getItem('sft:records') === null) {
    const response = await fetch('seed.json').catch(() => null);
    if (response && response.ok) replaceRecords(await response.json());
  }
  fillSettings();
  renderCategories(settings.categories);
  render();
}

start();
