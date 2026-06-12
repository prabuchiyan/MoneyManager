import { executeSql } from '../database/db';
import events from './events';

export async function createTransaction(tx) {
  const { type, amount, category_id, source_id, date, notes, bill_id } = tx;
  const res = await executeSql(
    `INSERT INTO transactions (type, amount, category_id, source_id, date, notes, bill_id) VALUES (?,?,?,?,?,?,?)`,
    [type, amount, category_id || null, source_id || null, date || new Date().toISOString(), notes || null, bill_id || null]
  );
  // notify listeners that transactions changed
  try { events.emit('transactionsChanged', { action: 'create', id: res.insertId }); } catch (e) {}
  return res.insertId;
}

// emit change after creation
const _origCreate = createTransaction;

export async function getTransactions(limit = 100) {
  const res = await executeSql(`SELECT * FROM transactions ORDER BY date DESC LIMIT ?`, [limit]);
  const rows = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
}

export async function deleteTransaction(id) {
  await executeSql(`DELETE FROM transactions WHERE id = ?`, [id]);
  try { events.emit('transactionsChanged', { action: 'delete', id }); } catch (e) {}
}

export async function updateTransaction(id, fields) {
  const sets = [];
  const vals = [];
  for (const k of Object.keys(fields)) {
    sets.push(`${k} = ?`);
    vals.push(fields[k]);
  }
  if (sets.length === 0) return;
  vals.push(id);
  const sql = `UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`;
  await executeSql(sql, vals);
  try { events.emit('transactionsChanged', { action: 'update', id, fields }); } catch (e) {}
}
