import { validateDescription, validateAmount, validateDate, validateCategory, validateRate } from './validators.js';
import { records, settings, addRecord, updateRecord, deleteRecord, updateSettings, replaceRecords } from './state.js';
import { compileRegex, filterRecords, sortRecords } from './search.js';
import { getStats } from './stats.js';
import { renderRecords, renderDashboard } from './ui.js';

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
  const message = validateCategory($('new-category').value);
  showError('new-category', 'category-error', message);
  if (message) $('new-category').focus();
  else say('Category looks good. Saving comes in M6.');
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
  render();
}

start();
