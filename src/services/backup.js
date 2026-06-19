import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { executeSql } from '../database/db';
import { getCategories, createCategory } from './categories';
import { getSources, createSource } from './sources';
import { getTransactions, createTransaction } from './transactions';
import { getBudgets, createBudget } from './budgets';
import { getBills, createBill, updateBill } from './bills';

const BACKUP_VERSION = 1;

export async function exportBackup() {
  try {
    const categories = await getCategories(false);
    const sources = await getSources(false);
    const transactions = await getTransactions(1000000);
    const budgets = await getBudgets();
    const bills = await getBills();

    const backupData = {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        transactions,
        categories,
        sources,
        budgets,
        bills,
      },
    };

    const backupJson = JSON.stringify(backupData);
    const fileName = `MoneyManager_Backup_${new Date().toISOString().split('T')[0]}.json`;

    if (Platform.OS === 'web') {
      // Web Fallback: Create a blob and trigger a download
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, timestamp: backupData.timestamp };
    }

    // Native Mobile logic
    const fileUri = FileSystem.cacheDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, backupJson);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Sharing is not available on this device');
    }

    return { success: true, timestamp: backupData.timestamp };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

export async function pickBackupFile() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    let fileContent;

    if (Platform.OS === 'web') {
      // On web, we might get the file directly or need to fetch the URI
      if (asset.file) {
        fileContent = await asset.file.text();
      } else {
        const response = await fetch(asset.uri);
        fileContent = await response.text();
      }
    } else {
      fileContent = await FileSystem.readAsStringAsync(asset.uri);
    }

    const backupData = JSON.parse(fileContent);


    // Validation
    if (backupData.version !== BACKUP_VERSION) {
      throw new Error('Invalid backup version');
    }

    const requiredKeys = ['transactions', 'categories', 'sources', 'budgets', 'bills'];
    for (const key of requiredKeys) {
      if (!backupData.data || !backupData.data[key]) {
        throw new Error(`Missing required data: ${key}`);
      }
    }

    return backupData;
  } catch (error) {
    console.error('Picking file failed:', error);
    throw error;
  }
}

async function clearAllTables() {
  const tables = ['transactions', 'budgets', 'bills', 'categories', 'sources'];
  for (const table of tables) {
    await executeSql(`DELETE FROM ${table}`);
    // Optional: Reset autoincrement
    await executeSql(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
  }
}

export async function restoreBackup(backupData, mode = 'replace') {
  try {
    if (mode === 'replace') {
      await clearAllTables();
    }

    const { categories, sources, budgets, bills, transactions } = backupData.data;

    const categoryMap = {};
    const sourceMap = {};
    const billMap = {};
    const transactionMap = {};

    // 1. Categories
    for (const cat of categories) {
      // If merge, check existing
      if (mode === 'merge') {
        const existing = await executeSql(`SELECT id FROM categories WHERE name = ? AND type = ?`, [cat.name, cat.type]);
        if (existing.rows.length > 0) {
          categoryMap[cat.id] = existing.rows.item(0).id;
          continue;
        }
      }
      const newId = await createCategory(cat);
      categoryMap[cat.id] = newId;
    }

    // 2. Sources
    for (const src of sources) {
      if (mode === 'merge') {
        const existing = await executeSql(`SELECT id FROM sources WHERE name = ?`, [src.name]);
        if (existing.rows.length > 0) {
          sourceMap[src.id] = existing.rows.item(0).id;
          continue;
        }
      }
      const newId = await createSource(src);
      sourceMap[src.id] = newId;
    }

    // 3. Bills
    for (const bill of bills) {
      if (mode === 'merge') {
        const existing = await executeSql(`SELECT id FROM bills WHERE name = ? AND due_date = ?`, [bill.name, bill.due_date]);
        if (existing.rows.length > 0) {
          billMap[bill.id] = existing.rows.item(0).id;
          continue;
        }
      }
      const billToCreate = { 
        ...bill,
        category_id: categoryMap[bill.category_id] || null,
        source_id: sourceMap[bill.source_id] || null
      };
      const newId = await createBill(billToCreate);
      billMap[bill.id] = newId;
    }

    // 4. Transactions (in chunks if many)
    const CHUNK_SIZE = 50;
    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (tx) => {
        if (mode === 'merge') {
          const existing = await executeSql(
            `SELECT id FROM transactions WHERE type = ? AND amount = ? AND date = ? AND notes = ?`,
            [tx.type, tx.amount, tx.date, tx.notes]
          );
          if (existing.rows.length > 0) {
            transactionMap[tx.id] = existing.rows.item(0).id;
            return;
          }
        }
        const txToCreate = {
          ...tx,
          category_id: categoryMap[tx.category_id] || null,
          source_id: sourceMap[tx.source_id] || null,
          bill_id: billMap[tx.bill_id] || null
        };
        const newId = await createTransaction(txToCreate);
        transactionMap[tx.id] = newId;
      }));
    }

    // 5. Update Bills with linked transactions
    for (const bill of bills) {
      if (bill.linked_transaction_id) {
        const newTxId = transactionMap[bill.linked_transaction_id];
        const newBillId = billMap[bill.id];
        if (newTxId && newBillId) {
          await updateBill(newBillId, { linked_transaction_id: newTxId });
        }
      }
    }

    // 6. Budgets
    for (const budget of budgets) {
      if (mode === 'merge') {
        const existing = await executeSql(
          `SELECT id FROM budgets WHERE category_id = ? AND month = ?`,
          [categoryMap[budget.category_id] || null, budget.month]
        );
        if (existing.rows.length > 0) continue;
      }
      await createBudget({
        ...budget,
        category_id: categoryMap[budget.category_id] || null
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
}
