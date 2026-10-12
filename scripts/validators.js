export const rules = {
  description: /^\S+(?: \S+)*$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWord: /\b(\w+)\s+\1\b/i,
  rate: /^\d+(\.\d{1,8})?$/,
};

export function validateDescription(value) {
  if (!value) return 'Please enter a description.';
  if (!rules.description.test(value)) return 'No spaces at the start or end, and no double spaces.';
  if (rules.duplicateWord.test(value)) return 'Remove the repeated word.';
  return '';
}

export function validateAmount(value) {
  return rules.amount.test(value) ? '' : 'Enter a number like 12 or 12.50 (up to 2 decimals).';
}

export function validateDate(value) {
  if (!rules.date.test(value)) return 'Use the format YYYY-MM-DD.';
  const d = new Date(value + 'T00:00:00Z');
  if (isNaN(d) || d.toISOString().slice(0, 10) !== value) return 'That date does not exist.';
  return '';
}

export function validateCategory(value) {
  return rules.category.test(value) ? '' : 'Use letters, spaces and hyphens only.';
}

export function validateRate(value) {
  return rules.rate.test(value) && Number(value) > 0 ? '' : 'Enter a rate above 0, like 0.00069.';
}
