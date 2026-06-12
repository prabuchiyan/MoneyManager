import { executeSql } from '../database/db';
import { createTransaction } from './transactions';

export async function createBill({ name, amount = 0, due_date = null, is_recurring = 0, recurrence_type = null, category_id = null }) {
  const res = await executeSql(
    `INSERT INTO bills (name, amount, due_date, is_recurring, recurrence_type, category_id) VALUES (?,?,?,?,?,?)`,
    [name, amount, due_date, is_recurring ? 1 : 0, recurrence_type, category_id]
  );
  return res.insertId;
}

export async function getBills() {
  const res = await executeSql(`SELECT * FROM bills ORDER BY due_date IS NULL, due_date`);
  const rows = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
}

export async function markBillPaid(billId, { source_id = null, date = null, notes = 'Bill payment' } = {}) {
  const bills = await executeSql(`SELECT * FROM bills WHERE id = ?`, [billId]);
  if (!bills.rows.length) throw new Error('Bill not found');
  const bill = bills.rows.item(0);

  // create expense transaction
  const txId = await createTransaction({ type: 'expense', amount: bill.amount, category_id: bill.category_id, source_id, date, notes, bill_id: billId });

  await executeSql(`UPDATE bills SET is_paid = ?, linked_transaction_id = ? WHERE id = ?`, [1, txId, billId]);
  return txId;
}

function addMonthsToDate(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0,10);
}

export async function processRecurringAfterPaid(billId) {
  const res = await executeSql(`SELECT * FROM bills WHERE id = ?`, [billId]);
  if (!res.rows.length) throw new Error('Bill not found');
  const bill = res.rows.item(0);
  if (!bill.is_recurring) return null;

  // compute next due date for monthly recurrence (support only 'monthly' for now)
  let next = null;
  if (bill.recurrence_type === 'monthly') {
    next = addMonthsToDate(bill.due_date, 1);
  }

  if (next) {
    // insert a new bill for the next recurrence
    const newIdRes = await executeSql(`INSERT INTO bills (name, amount, due_date, is_recurring, recurrence_type, category_id, is_paid) VALUES (?,?,?,?,?,?,?)`, [bill.name, bill.amount, next, 1, bill.recurrence_type, bill.category_id, 0]);
    return newIdRes.insertId;
  }

  return null;
}

export async function runRecurringScheduler() {
  // Create missing future occurrences for recurring bills where last occurrence is paid
  const today = new Date().toISOString().slice(0,10);
  const res = await executeSql(`SELECT * FROM bills WHERE is_recurring = 1`);
  const rows = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));

  function addMonthsToDate(dateStr, months) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0,10);
  }

  for (const bill of rows) {
    // only advance from paid occurrences to generate next ones
    if (!bill.is_paid) continue;

    let next = addMonthsToDate(bill.due_date, 1);
    // generate occurrences up to the current month (inclusive)
    while (next && next <= today) {
      // check if an occurrence already exists with this due_date and same name
      const exist = await executeSql(`SELECT id FROM bills WHERE name = ? AND due_date = ?`, [bill.name, next]);
      if (!exist.rows.length) {
        await executeSql(`INSERT INTO bills (name, amount, due_date, is_recurring, recurrence_type, category_id, is_paid) VALUES (?,?,?,?,?,?,?)`, [bill.name, bill.amount, next, 1, bill.recurrence_type, bill.category_id, 0]);
      }
      next = addMonthsToDate(next, 1);
    }
  }
}

export async function updateBill(id, fields) {
  const { name, amount, due_date, is_recurring = 0, recurrence_type = null, category_id = null, is_paid = 0 } = fields;
  await executeSql(
    `UPDATE bills SET name = ?, amount = ?, due_date = ?, is_recurring = ?, recurrence_type = ?, category_id = ?, is_paid = ? WHERE id = ?`,
    [name, amount, due_date, is_recurring ? 1 : 0, recurrence_type, category_id, is_paid ? 1 : 0, id]
  );
}

export async function deleteBill(id) {
  await executeSql(`DELETE FROM bills WHERE id = ?`, [id]);
}

export default { createBill, getBills, markBillPaid, updateBill, deleteBill };
