const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'cafe_pos.sqlite');

console.log('Seeding server database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    seedDb();
  }
});

const menuItems = [
  // HOT DRINKS
  { name: 'Tea', category: 'Hot Drinks', price: 20 },
  { name: 'Ginger Tea', category: 'Hot Drinks', price: 25 },
  { name: 'Yalaka Tea', category: 'Hot Drinks', price: 25 },
  { name: 'Coffee', category: 'Hot Drinks', price: 25 },
  { name: 'Black Tea', category: 'Hot Drinks', price: 15 },
  { name: 'Black Coffee', category: 'Hot Drinks', price: 20 },
  { name: 'Lemon Tea', category: 'Hot Drinks', price: 20 },
  { name: 'Boost', category: 'Hot Drinks', price: 40 },
  { name: 'Horlicks', category: 'Hot Drinks', price: 40 },
  { name: 'Green Tea', category: 'Hot Drinks', price: 30 },
  { name: 'Sukku Pal', category: 'Hot Drinks', price: 30 },
  { name: 'Badam Pal', category: 'Hot Drinks', price: 40 },
  { name: 'Pal', category: 'Hot Drinks', price: 20 },
  { name: 'Milo', category: 'Hot Drinks', price: 40 },

  // MILK SHAKE
  { name: 'Vanilla Milkshake', category: 'Milk Shake', price: 70 },
  { name: 'Chocolate Milkshake', category: 'Milk Shake', price: 80 },
  { name: 'Strawberry Milkshake', category: 'Milk Shake', price: 70 },
  { name: 'Butterscotch Milkshake', category: 'Milk Shake', price: 80 },
  { name: 'KitKat Milkshake', category: 'Milk Shake', price: 100 },
  { name: 'Brownie Milkshake', category: 'Milk Shake', price: 120 },
  { name: 'Oreo Milkshake', category: 'Milk Shake', price: 100 },

  // MOJITO
  { name: 'Blue Mojito', category: 'Mojito', price: 90 },
  { name: 'Lime mint Mojito', category: 'Mojito', price: 80 },
  { name: 'Watermelon Mojito', category: 'Mojito', price: 90 },

  // CHAT ITEMS
  { name: 'Pani Puri', category: 'Chat Items', price: 30 },
  { name: 'Masal Puri', category: 'Chat Items', price: 30 },
  { name: 'Kalan', category: 'Chat Items', price: 50 },
  { name: 'Cauliflower Chilli', category: 'Chat Items', price: 50 },
  { name: 'Chicken chill', category: 'Chat Items', price: 60 },

  // SCOPES
  { name: 'Vanilla Scope', category: 'Scopes', price: 40 },
  { name: 'Chocolate Scope', category: 'Scopes', price: 40 },
  { name: 'Strawberry Scope', category: 'Scopes', price: 40 },
  { name: 'Butterscotch Scope', category: 'Scopes', price: 40 },
  { name: 'Brownie Scope', category: 'Scopes', price: 60 },

  // JUICE
  { name: 'Apple Juice', category: 'Juice', price: 90 },
  { name: 'Orange Juice', category: 'Juice', price: 70 },
  { name: 'Pomegranate Juice', category: 'Juice', price: 70 },
  { name: 'Mosambi Juice', category: 'Juice', price: 40 },
  { name: 'Muskmelon Juice', category: 'Juice', price: 30 },
  { name: 'Watermelon Juice', category: 'Juice', price: 30 },
  { name: 'Lemon Juice', category: 'Juice', price: 20 },

  // COOLING
  { name: 'Cold Coffee', category: 'Cooling', price: 70 },
  { name: 'Rose Milk', category: 'Cooling', price: 30 },
  { name: 'Badam milk', category: 'Cooling', price: 30 },
  { name: 'Boost (Cold)', category: 'Cooling', price: 50 },
  { name: 'Horlicks (Cold)', category: 'Cooling', price: 50 },
  { name: 'Nannari Sharbat', category: 'Cooling', price: 30 },

  // STARTER (VEG)
  { name: 'French Fries', category: 'Starter (Veg)', price: 70 },
  { name: 'Peri Peri Fries', category: 'Starter (Veg)', price: 80 },
  { name: 'Cheese Balls (6)', category: 'Starter (Veg)', price: 80 },
  { name: 'Veg Samosa (3)', category: 'Starter (Veg)', price: 60 },
  { name: 'Veg Momos (6)', category: 'Starter (Veg)', price: 80 },
  { name: 'Paneer Momos (6)', category: 'Starter (Veg)', price: 120 },
  { name: 'Veg Cutlet (2)', category: 'Starter (Veg)', price: 100 },

  // RICE & NOODLE ITEMS
  { name: 'Veg Rice', category: 'Rice & Noodle', price: 70 },
  { name: 'Egg Rice', category: 'Rice & Noodle', price: 80 },
  { name: 'Chicken Rice', category: 'Rice & Noodle', price: 100 },
  { name: 'Veg Noodle', category: 'Rice & Noodle', price: 70 },
  { name: 'Egg Noodle', category: 'Rice & Noodle', price: 80 },
  { name: 'Chicken Noodle', category: 'Rice & Noodle', price: 100 },

  // STARTER (NON - VEG)
  { name: 'Chicken Momos (6)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Chicken Pops (10)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Chicken Nuggets (6)', category: 'Starter (Non-Veg)', price: 80 },
  { name: 'Chicken Cutlet (2)', category: 'Starter (Non-Veg)', price: 40 },
  { name: 'Chicken Strips (5)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Spicy Wings (4)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Fish Finger (4)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Chicken Lollipop (4)', category: 'Starter (Non-Veg)', price: 100 },
  { name: 'Chicken Bites (6)', category: 'Starter (Non-Veg)', price: 100 },
];

function seedDb() {
  db.serialize(() => {
    // Clear old menu
    db.run("DELETE FROM menu", (err) => {
      if (err) {
        console.error("Error clearing old menu:", err);
        // Don't return, maybe table doesn't exist yet, but it should be initialized by server
      }

      // Ensure menu table exists
      db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_count INTEGER NOT NULL
      )`, (err) => {
        if (err) {
          console.error("Error creating table:", err);
          return;
        }

        const stmt = db.prepare(`INSERT INTO menu (name, category, price, stock_count) VALUES (?, ?, ?, ?)`);
        menuItems.forEach(item => {
          stmt.run([item.name, item.category, item.price, 100]);
        });
        stmt.finalize();
        console.log("Server database successfully seeded with menu items!");
        db.close();
      });
    });
  });
}
