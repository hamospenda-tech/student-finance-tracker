import { load, save, loadSettings, saveSettings } from './storage.js';

export const records = load();
export const settings = loadSettings();

export function addRecord({ description, amount, category, date }) {
  const now = new Date().toISOString();
  records.push({ id: 'txn_' + Date.now(), description, amount: Number(amount), category, date, createdAt: now, updatedAt: now });
  save(records);
}

export function updateRecord(id, changes) {
  const record = records.find(r => r.id === id);
  Object.assign(record, changes, { updatedAt: new Date().toISOString() });
  save(records);
}

export function deleteRecord(id) {
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) records.splice(index, 1);
  save(records);
}

export function replaceRecords(data) {
  records.splice(0, records.length, ...data);
  save(records);
}

export function updateSettings(changes) {
  Object.assign(settings, changes);
  saveSettings(settings);
}
