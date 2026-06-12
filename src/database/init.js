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
      is_recurring INTEGER DEFAULT 0,
      recurrence_type TEXT,
      category_id INTEGER,
      is_paid INTEGER DEFAULT 0,
      linked_transaction_id INTEGER
    );`);

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

