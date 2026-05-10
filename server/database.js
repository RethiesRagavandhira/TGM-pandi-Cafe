import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const getAppPath = () => {
  return path.join(process.cwd(), 'data'); 
};

const dbDir = getAppPath();
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'cafe_pos.sqlite');
console.log('Database Path:', dbPath);

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Menu Table
    db.run(`CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock_count INTEGER NOT NULL
    )`);

    // Bills Table
    db.run(`CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      date_time TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL
    )`);

    // Bill Items Table
    db.run(`CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    )`);
  });
}

// Promisify wrapper for db operations
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getSingleQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// --- MENU OPERATIONS ---

export const getMenu = async () => {
  return await getQuery(`SELECT * FROM menu ORDER BY category, name`);
};

export const addMenuItem = async (item) => {
  return await runQuery(
    `INSERT INTO menu (name, category, price, stock_count) VALUES (?, ?, ?, ?)`,
    [item.name, item.category, item.price, item.stock_count]
  );
};

export const updateMenuItem = async (item) => {
  return await runQuery(
    `UPDATE menu SET name = ?, category = ?, price = ?, stock_count = ? WHERE id = ?`,
    [item.name, item.category, item.price, item.stock_count, item.id]
  );
};

export const deleteMenuItem = async (id) => {
  return await runQuery(`DELETE FROM menu WHERE id = ?`, [id]);
};

// --- BILLING OPERATIONS ---

export const createBill = async (billData) => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');

        const countRow = await getSingleQuery(`SELECT count(*) as count FROM bills WHERE date_time LIKE ?`, [`${billData.date}%`]);
        const count = (countRow ? countRow.count : 0) + 1;
        const dateStr = billData.date.replace(/-/g, '');
        const billNumber = `BL-${dateStr}-${count.toString().padStart(4, '0')}`;

        const billInsert = await runQuery(
          `INSERT INTO bills (bill_number, date_time, subtotal, tax, total, payment_method) VALUES (?, ?, ?, ?, ?, ?)`,
          [billNumber, `${billData.date}T${billData.time}`, billData.subtotal, billData.tax, billData.total, billData.payment_method]
        );
        const billId = billInsert.id;

        for (const item of billData.items) {
          await runQuery(
            `INSERT INTO bill_items (bill_id, item_id, item_name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)`,
            [billId, item.id, item.name, item.quantity, item.price, item.quantity * item.price]
          );

          await runQuery(
            `UPDATE menu SET stock_count = stock_count - ? WHERE id = ?`,
            [item.quantity, item.id]
          );
        }

        db.run('COMMIT');
        resolve({ success: true, billNumber });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
};

export const getBills = async () => {
  let query = `SELECT * FROM bills ORDER BY date_time DESC`;
  const bills = await getQuery(query);
  
  for (let bill of bills) {
    const items = await getQuery(`SELECT * FROM bill_items WHERE bill_id = ?`, [bill.id]);
    bill.items = items;
  }
  
  return bills;
};

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const todayPrefix = `${today}%`;

  const totalBillsRow = await getSingleQuery(`SELECT COUNT(*) as count FROM bills WHERE date_time LIKE ?`, [todayPrefix]);
  const totalSalesRow = await getSingleQuery(`SELECT SUM(total) as sum FROM bills WHERE date_time LIKE ?`, [todayPrefix]);
  
  const totalItemsSoldRow = await getSingleQuery(`
    SELECT SUM(quantity) as sum 
    FROM bill_items 
    JOIN bills ON bill_items.bill_id = bills.id 
    WHERE bills.date_time LIKE ?
  `, [todayPrefix]);

  const mostSoldRow = await getSingleQuery(`
    SELECT item_name, SUM(quantity) as sum 
    FROM bill_items 
    JOIN bills ON bill_items.bill_id = bills.id 
    WHERE bills.date_time LIKE ?
    GROUP BY item_id 
    ORDER BY sum DESC LIMIT 1
  `, [todayPrefix]);

  const lowStockItems = await getQuery(`SELECT count(*) as count FROM menu WHERE stock_count < 10`);

  return {
    totalBillsToday: totalBillsRow.count || 0,
    totalSalesToday: totalSalesRow.sum || 0,
    totalItemsSold: totalItemsSoldRow.sum || 0,
    mostSoldItem: mostSoldRow ? mostSoldRow.item_name : 'N/A',
    lowStockCount: lowStockItems[0] ? lowStockItems[0].count : 0
  };
};

export const deleteBill = async (id) => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');

        const items = await getQuery(`SELECT * FROM bill_items WHERE bill_id = ?`, [id]);
        for (const item of items) {
          await runQuery(`UPDATE menu SET stock_count = stock_count + ? WHERE id = ?`, [item.quantity, item.item_id]);
        }

        await runQuery(`DELETE FROM bill_items WHERE bill_id = ?`, [id]);
        await runQuery(`DELETE FROM bills WHERE id = ?`, [id]);

        db.run('COMMIT');
        resolve({ success: true });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
};

export const updateBill = async (billData) => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');

        const oldItems = await getQuery(`SELECT * FROM bill_items WHERE bill_id = ?`, [billData.id]);
        for (const item of oldItems) {
          await runQuery(`UPDATE menu SET stock_count = stock_count + ? WHERE id = ?`, [item.quantity, item.item_id]);
        }

        await runQuery(`DELETE FROM bill_items WHERE bill_id = ?`, [billData.id]);

        await runQuery(
          `UPDATE bills SET subtotal = ?, tax = ?, total = ?, payment_method = ? WHERE id = ?`,
          [billData.subtotal, billData.tax, billData.total, billData.payment_method, billData.id]
        );

        for (const item of billData.items) {
          await runQuery(
            `INSERT INTO bill_items (bill_id, item_id, item_name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)`,
            [billData.id, item.id, item.name, item.quantity, item.price, item.quantity * item.price]
          );

          await runQuery(
            `UPDATE menu SET stock_count = stock_count - ? WHERE id = ?`,
            [item.quantity, item.id]
          );
        }

        db.run('COMMIT');
        resolve({ success: true });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
};
