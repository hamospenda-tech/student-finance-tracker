import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';

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

for (const [name, validate] of fields) {
  $(name).addEventListener('change', () => showError(name, name + '-error', validate($(name).value)));
}

$('record-form').addEventListener('submit', event => {
  event.preventDefault();
  let firstBad = null;

  for (const [name, validate] of fields) {
    const message = validate($(name).value);
    showError(name, name + '-error', message);
    if (message && !firstBad) firstBad = $(name);
  }

  if (firstBad) firstBad.focus();
  else say('Looks good. Saving comes in M4.');
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
