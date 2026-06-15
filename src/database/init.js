import { executeSql } from './db';

export async function initDB() {
  try {
    // Categories
    await executeSql(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );`);

    // Sources
    await executeSql(`CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      initial_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );`);
    // Ensure `icon` column exists for sources (safe ALTER)
    try {
      await executeSql(`ALTER TABLE sources ADD COLUMN icon TEXT`, []);
    } catch (e) {
      // ignore if column already exists or ALTER not supported on web shim
    }
    // Ensure `color` column exists for categories (safe ALTER)
    try {
      await executeSql(`ALTER TABLE categories ADD COLUMN color TEXT`, []);
    } catch (e) {
      // ignore if column already exists or ALTER not supported on web shim
    }

    // Transactions
    await executeSql(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER,
      source_id INTEGER,
      date TEXT,
      notes TEXT,
      bill_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(source_id) REFERENCES sources(id)
    );`);

    // Budgets
    await executeSql(`CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      monthly_limit REAL NOT NULL,
      month TEXT NOT NULL
    );`);

    // Bills
    await executeSql(`CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      is_recurring INTEGER DEFAULT 0,
      recurrence_type TEXT,
      recurrence_interval INTEGER DEFAULT 1,
      recurrence_end_date TEXT,
      category_id INTEGER,
      source_id INTEGER,
      reminder_days_before INTEGER DEFAULT 2,
      last_reminded_at TEXT,
      auto_pay INTEGER DEFAULT 0,
      notes TEXT,
      attachment_url TEXT,
      linked_transaction_id INTEGER,
      paid_at TEXT,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT
    );`);

    const billColumns = [
      ['status', "TEXT DEFAULT 'pending'"],
      ['recurrence_interval', 'INTEGER DEFAULT 1'],
      ['recurrence_end_date', 'TEXT'],
      ['source_id', 'INTEGER'],
      ['reminder_days_before', 'INTEGER DEFAULT 2'],
      ['last_reminded_at', 'TEXT'],
      ['auto_pay', 'INTEGER DEFAULT 0'],
      ['notes', 'TEXT'],
      ['attachment_url', 'TEXT'],
      ['paid_at', 'TEXT'],
      ['created_at', "TEXT DEFAULT (datetime('now'))"],
      ['updated_at', "TEXT DEFAULT (datetime('now'))"],
      ['deleted_at', 'TEXT'],
    ];
    for (const [col, def] of billColumns) {
      try {
        await executeSql(`ALTER TABLE bills ADD COLUMN ${col} ${def}`, []);
      } catch (e) {
        // ignore if column already exists or ALTER not supported on web shim
      }
    }

    // Migrate legacy is_paid rows to status column
    try {
      await executeSql(
        `UPDATE bills SET status = 'paid', paid_at = datetime('now') WHERE is_paid = 1 AND (status IS NULL OR status = 'pending')`,
        []
      );
      const today = new Date().toISOString().slice(0, 10);
      await executeSql(
        `UPDATE bills SET status = 'overdue' WHERE is_paid = 0 AND due_date < ? AND (status IS NULL OR status = 'pending')`,
        [today]
      );
      await executeSql(
        `UPDATE bills SET status = 'pending' WHERE is_paid = 0 AND (status IS NULL OR status = '')`,
        []
      );
    } catch (e) {
      // web shim may not support complex UPDATE; handled in service layer
    }

    console.log('Database initialized');
    // Seed defaults if empty (helpful for web/local dev)
    try {
      const cats = await executeSql('SELECT * FROM categories', []);
      if (cats.rows.length === 0) {
        const defaultCats = [
          ['Groceries','expense'],
          ['Rent','expense'],
          ['Utilities','expense'],
          ['Salary','income'],
          ['Misc','expense']
        ];
        for (const c of defaultCats) {
          await executeSql('INSERT INTO categories (name, type) VALUES (?,?)', c);
        }
      }
    } catch (e) {
      console.warn('Seeding categories failed', e);
    }

    try {
      const src = await executeSql('SELECT * FROM sources', []);
      if (src.rows.length === 0) {
        const defaults = [ ['Cash', null, 0], ['Bank', null, 0] ];
        for (const s of defaults) {
          await executeSql('INSERT INTO sources (name, type, initial_balance) VALUES (?,?,?)', s);
        }
      }
    } catch (e) {
      console.warn('Seeding sources failed', e);
    }
  } catch (err) {
    console.error('DB init error', err);
  }
}

