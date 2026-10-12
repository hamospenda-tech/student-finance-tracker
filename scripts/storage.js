const KEY = 'sft:records';
const SETTINGS_KEY = 'sft:settings';
const defaults = { cap: 100000, rates: { USD: 0.00069, EUR: 0.0006 } };

export const load = () => JSON.parse(localStorage.getItem(KEY) || '[]');
export const save = data => localStorage.setItem(KEY, JSON.stringify(data));

export const loadSettings = () => ({ ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') });
export const saveSettings = data => localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
