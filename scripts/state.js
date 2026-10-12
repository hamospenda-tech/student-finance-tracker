import { load, save } from './storage.js';

export const records = load();

export function addRecord({ description, amount, category, date }) {
  const now = new Date().toISOString();
  records.push({ id: 'txn_' + Date.now(), description, amount: Number(amount), category, date, createdAt: now, updatedAt: now });
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
