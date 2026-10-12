const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sum = list => list.reduce((total, r) => total + r.amount, 0);

export function getStats(records, settings) {
  const total = sum(records);

  const byCategory = {};
  for (const r of records) byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    days.push({ key, label: d.getDate(), total: sum(records.filter(r => r.date === key)) });
  }

  const month = dayKey(new Date()).slice(0, 7);
  const spentThisMonth = sum(records.filter(r => r.date.startsWith(month)));

  return {
    count: records.length,
    total,
    topCategory: top ? top[0] : 'None',
    usd: total * settings.rates.USD,
    eur: total * settings.rates.EUR,
    days,
    spentThisMonth,
    remaining: settings.cap - spentThisMonth,
  };
}
