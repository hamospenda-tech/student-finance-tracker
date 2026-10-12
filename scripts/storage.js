import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';

const KEY = 'sft:records';
const SETTINGS_KEY = 'sft:settings';
const defaults = {
  cap: 100000,
  rates: { USD: 0.00069, EUR: 0.0006 },
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'],
};

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export const load = () => read(KEY, []);
export const save = data => localStorage.setItem(KEY, JSON.stringify(data));

export const loadSettings = () => ({ ...defaults, ...read(SETTINGS_KEY, {}) });
export const saveSettings = data => localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));

const isText = value => typeof value === 'string';
const isTime = value => isText(value) && !isNaN(Date.parse(value));

function checkRecord(r, ids) {
  if (!r || typeof r !== 'object') return 'must be an object.';
  if (!isText(r.id) || !r.id || ids.has(r.id)) return 'needs a unique id.';
  ids.add(r.id);
  if (!isText(r.description) || validateDescription(r.description)) return 'has an invalid description.';
  if (typeof r.amount !== 'number' || validateAmount(String(r.amount))) return 'has an invalid amount.';
  if (!isText(r.category) || validateCategory(r.category)) return 'has an invalid category.';
  if (!isText(r.date) || validateDate(r.date)) return 'has an invalid date.';
  if (!isTime(r.createdAt) || !isTime(r.updatedAt)) return 'needs createdAt and updatedAt timestamps.';
  return '';
}

export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  if (!Array.isArray(data)) return { error: 'The file must contain a list of records.' };

  const ids = new Set();
  for (const [index, r] of data.entries()) {
    const problem = checkRecord(r, ids);
    if (problem) return { error: `Record ${index + 1} ${problem}` };
  }

  return {
    records: data.map(({ id, description, amount, category, date, createdAt, updatedAt }) => (
      { id, description, amount, category, date, createdAt, updatedAt }
    )),
  };
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
