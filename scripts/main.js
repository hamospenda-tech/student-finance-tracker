import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';
import { records, addRecord, deleteRecord, replaceRecords } from './state.js';
import { compileRegex, filterRecords, sortRecords } from './search.js';
import { renderRecords } from './ui.js';

const $ = id => document.getElementById(id);

const fields = [
  ['description', validateDescription],
  ['amount', validateAmount],
  ['date', validateDate],
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
  renderRecords(shown, re);

  let message = '';
  if (text && !re) message = 'That is not a valid regex pattern.';
  else if (re) message = `${shown.length} of ${records.length} records match.`;
  $('search-status').textContent = message;
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

$('category-form').addEventListener('submit', event => {
  event.preventDefault();
  const message = validateCategory($('new-category').value);
  showError('new-category', 'category-error', message);
  if (message) $('new-category').focus();
  else say('Category looks good. Saving comes in M6.');
});

$('records-body').addEventListener('click', event => {
  const id = event.target.dataset.delete;
  if (id && confirm('Delete this transaction?')) {
    deleteRecord(id);
    render();
    say('Transaction deleted.');
  }
});

async function start() {
  if (localStorage.getItem('sft:records') === null) {
    try {
      replaceRecords(await (await fetch('seed.json')).json());
    } catch {
      replaceRecords([]);
    }
  }
  render();
}

start();
