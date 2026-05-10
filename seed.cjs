const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

const dbDir = path.join(os.homedir(), 'AppData', 'Roaming', 'tgm-pandi-cafe');
const dbPath = path.join(dbDir, 'cafe_pos.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    seedDb();
  }
});

const defaultItems = [
  { name: 'Espresso', category: 'Coffee', price: 60.00, stock_count: 50 },
  { name: 'Cappuccino', category: 'Coffee', price: 120.00, stock_count: 30 },
  { name: 'Filter Coffee', category: 'Coffee', price: 40.00, stock_count: 100 },
  { name: 'Masala Chai', category: 'Tea', price: 30.00, stock_count: 150 },
  { name: 'Green Tea', category: 'Tea', price: 50.00, stock_count: 40 },
  { name: 'Samosa', category: 'Snacks', price: 20.00, stock_count: 60 },
  { name: 'Veg Sandwich', category: 'Snacks', price: 80.00, stock_count: 25 },
  { name: 'Chocolate Brownie', category: 'Desserts', price: 90.00, stock_count: 15 },
  { name: 'Cold Coffee', category: 'Cold Drinks', price: 110.00, stock_count: 20 },
  { name: 'Fresh Lime Soda', category: 'Cold Drinks', price: 60.00, stock_count: 45 },
];

function seedDb() {
  db.serialize(() => {
    db.get("SELECT COUNT(*) as count FROM menu", (err, row) => {
      if (err) {
        console.error(err);
        return;
      }
      
      if (row.count === 0) {
        const stmt = db.prepare(`INSERT INTO menu (name, category, price, stock_count) VALUES (?, ?, ?, ?)`);
        defaultItems.forEach(item => {
          stmt.run([item.name, item.category, item.price, item.stock_count]);
        });
        stmt.finalize();
        console.log("Database seeded with default menu items!");
      } else {
        console.log("Menu already has items. No seeding needed.");
      }
    });
  });
}
