import { getTransactions } from './transactions';
import { getSources } from './sources';
import { getCategories } from './categories';

function monthOf(dateStr) {
  if (!dateStr) return null;
  return dateStr.slice(0, 7);
}

export async function getTotalBalance() {
  const sources = await getSources(true);
  const initial = sources.reduce((s, src) => s + (parseFloat(src.initial_balance) || 0), 0);

  const tx = await getTransactions(10000);
  const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const expense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  return { initial, income, expense, balance: initial + income - expense };
}

export async function getCategorySpending(month = null) {
  const tx = await getTransactions(10000);
  const cats = await getCategories(true);
  const byId = {};
  const m = month || new Date().toISOString().slice(0, 7);
  tx.forEach(t => {
    if (t.type !== 'expense') return;
    if (!t.date || !t.date.startsWith(m)) return;
    const cid = t.category_id || 'uncategorized';
    byId[cid] = (byId[cid] || 0) + (parseFloat(t.amount) || 0);
  });

  const result = Object.keys(byId).map(k => {
    const cat = cats.find(c => String(c.id) === String(k));
    return { category_id: k, category_name: cat ? cat.name : 'Uncategorized', amount: byId[k] };
  }).sort((a,b) => b.amount - a.amount);

  return result;
}

export async function getMonthlyTrends(months = 6) {
  const tx = await getTransactions(10000);
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.toISOString().slice(0, 7);
    const monthTx = tx.filter(t => t.date && t.date.startsWith(m));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    trends.push({ month: m, income, expense });
  }
  return trends;
}

export async function getSourceBalances() {
  const sources = await getSources(true);
  const tx = await getTransactions(10000);
  const result = sources.map(s => {
    const initial = parseFloat(s.initial_balance) || 0;
    const income = tx.filter(t => String(t.source_id) === String(s.id) && t.type === 'income').reduce((a,b)=>a + (parseFloat(b.amount)||0), 0);
    const expense = tx.filter(t => String(t.source_id) === String(s.id) && t.type === 'expense').reduce((a,b)=>a + (parseFloat(b.amount)||0), 0);
    return { source_id: s.id, name: s.name, balance: initial + income - expense };
  });
  return result;
}

export default { getTotalBalance, getCategorySpending, getMonthlyTrends };
