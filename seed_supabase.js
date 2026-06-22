import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const normalizeSupabaseValue = (value) => {
  if (!value) return value;

  const trimmed = String(value).trim();
  const withoutPrefix = trimmed.replace(/^(VITE_SUPABASE_(?:ANON|PUBLISHABLE)_KEY)\s*=\s*/, '');

  if ((withoutPrefix.startsWith('"') && withoutPrefix.endsWith('"')) || (withoutPrefix.startsWith("'") && withoutPrefix.endsWith("'"))) {
    return withoutPrefix.slice(1, -1).trim();
  }

  return withoutPrefix;
};

// Read .env file manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = normalizeSupabaseValue(env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in .env file');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const menuItems = [
  // HOT DRINKS
  { name: 'Tea', category: 'Hot Drinks', price: 20, stock_count: 100 },
  { name: 'Ginger Tea', category: 'Hot Drinks', price: 25, stock_count: 100 },
  { name: 'Yalaka Tea', category: 'Hot Drinks', price: 25, stock_count: 100 },
  { name: 'Coffee', category: 'Hot Drinks', price: 25, stock_count: 100 },
  { name: 'Black Tea', category: 'Hot Drinks', price: 15, stock_count: 100 },
  { name: 'Black Coffee', category: 'Hot Drinks', price: 20, stock_count: 100 },
  { name: 'Lemon Tea', category: 'Hot Drinks', price: 20, stock_count: 100 },
  { name: 'Boost', category: 'Hot Drinks', price: 40, stock_count: 100 },
  { name: 'Horlicks', category: 'Hot Drinks', price: 40, stock_count: 100 },
  { name: 'Green Tea', category: 'Hot Drinks', price: 30, stock_count: 100 },
  { name: 'Sukku Pal', category: 'Hot Drinks', price: 30, stock_count: 100 },
  { name: 'Badam Pal', category: 'Hot Drinks', price: 40, stock_count: 100 },
  { name: 'Pal', category: 'Hot Drinks', price: 20, stock_count: 100 },
  { name: 'Milo', category: 'Hot Drinks', price: 40, stock_count: 100 },

  // MILK SHAKE
  { name: 'Vanilla Milkshake', category: 'Milk Shake', price: 70, stock_count: 100 },
  { name: 'Chocolate Milkshake', category: 'Milk Shake', price: 80, stock_count: 100 },
  { name: 'Strawberry Milkshake', category: 'Milk Shake', price: 70, stock_count: 100 },
  { name: 'Butterscotch Milkshake', category: 'Milk Shake', price: 80, stock_count: 100 },
  { name: 'KitKat Milkshake', category: 'Milk Shake', price: 100, stock_count: 100 },
  { name: 'Brownie Milkshake', category: 'Milk Shake', price: 120, stock_count: 100 },
  { name: 'Oreo Milkshake', category: 'Milk Shake', price: 100, stock_count: 100 },

  // MOJITO
  { name: 'Blue Mojito', category: 'Mojito', price: 90, stock_count: 100 },
  { name: 'Lime mint Mojito', category: 'Mojito', price: 80, stock_count: 100 },
  { name: 'Watermelon Mojito', category: 'Mojito', price: 90, stock_count: 100 },

  // CHAT ITEMS
  { name: 'Pani Puri', category: 'Chat Items', price: 30, stock_count: 100 },
  { name: 'Masal Puri', category: 'Chat Items', price: 30, stock_count: 100 },
  { name: 'Kalan', category: 'Chat Items', price: 50, stock_count: 100 },
  { name: 'Cauliflower Chilli', category: 'Chat Items', price: 50, stock_count: 100 },
  { name: 'Chicken chill', category: 'Chat Items', price: 60, stock_count: 100 },

  // SCOPES
  { name: 'Vanilla Scope', category: 'Scopes', price: 40, stock_count: 100 },
  { name: 'Chocolate Scope', category: 'Scopes', price: 40, stock_count: 100 },
  { name: 'Strawberry Scope', category: 'Scopes', price: 40, stock_count: 100 },
  { name: 'Butterscotch Scope', category: 'Scopes', price: 40, stock_count: 100 },
  { name: 'Brownie Scope', category: 'Scopes', price: 60, stock_count: 100 },

  // JUICE
  { name: 'Apple Juice', category: 'Juice', price: 90, stock_count: 100 },
  { name: 'Orange Juice', category: 'Juice', price: 70, stock_count: 100 },
  { name: 'Pomegranate Juice', category: 'Juice', price: 70, stock_count: 100 },
  { name: 'Mosambi Juice', category: 'Juice', price: 40, stock_count: 100 },
  { name: 'Muskmelon Juice', category: 'Juice', price: 30, stock_count: 100 },
  { name: 'Watermelon Juice', category: 'Juice', price: 30, stock_count: 100 },
  { name: 'Lemon Juice', category: 'Juice', price: 20, stock_count: 100 },

  // COOLING
  { name: 'Cold Coffee', category: 'Cooling', price: 70, stock_count: 100 },
  { name: 'Rose Milk', category: 'Cooling', price: 30, stock_count: 100 },
  { name: 'Badam milk', category: 'Cooling', price: 30, stock_count: 100 },
  { name: 'Boost (Cold)', category: 'Cooling', price: 50, stock_count: 100 },
  { name: 'Horlicks (Cold)', category: 'Cooling', price: 50, stock_count: 100 },
  { name: 'Nannari Sharbat', category: 'Cooling', price: 30, stock_count: 100 },

  // STARTER (VEG)
  { name: 'French Fries', category: 'Starter (Veg)', price: 70, stock_count: 100 },
  { name: 'Peri Peri Fries', category: 'Starter (Veg)', price: 80, stock_count: 100 },
  { name: 'Cheese Balls (6)', category: 'Starter (Veg)', price: 80, stock_count: 100 },
  { name: 'Veg Samosa (3)', category: 'Starter (Veg)', price: 60, stock_count: 100 },
  { name: 'Veg Momos (6)', category: 'Starter (Veg)', price: 80, stock_count: 100 },
  { name: 'Paneer Momos (6)', category: 'Starter (Veg)', price: 120, stock_count: 100 },
  { name: 'Veg Cutlet (2)', category: 'Starter (Veg)', price: 100, stock_count: 100 },

  // RICE & NOODLE ITEMS
  { name: 'Veg Rice', category: 'Rice & Noodle', price: 70, stock_count: 100 },
  { name: 'Egg Rice', category: 'Rice & Noodle', price: 80, stock_count: 100 },
  { name: 'Chicken Rice', category: 'Rice & Noodle', price: 100, stock_count: 100 },
  { name: 'Veg Noodle', category: 'Rice & Noodle', price: 70, stock_count: 100 },
  { name: 'Egg Noodle', category: 'Rice & Noodle', price: 80, stock_count: 100 },
  { name: 'Chicken Noodle', category: 'Rice & Noodle', price: 100, stock_count: 100 },

  // STARTER (NON - VEG)
  { name: 'Chicken Momos (6)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Chicken Pops (10)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Chicken Nuggets (6)', category: 'Starter (Non-Veg)', price: 80, stock_count: 100 },
  { name: 'Chicken Cutlet (2)', category: 'Starter (Non-Veg)', price: 40, stock_count: 100 },
  { name: 'Chicken Strips (5)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Spicy Wings (4)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Fish Finger (4)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Chicken Lollipop (4)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
  { name: 'Chicken Bites (6)', category: 'Starter (Non-Veg)', price: 100, stock_count: 100 },
];

async function seed() {
  console.log('Fetching existing menu items from Supabase...');
  const { data: existing, error: getError } = await supabase
    .from('menu')
    .select('id, name');

  if (getError) {
    console.error('Error fetching menu items:', getError);
    return;
  }

  console.log(`Found ${existing ? existing.length : 0} existing items.`);

  if (existing && existing.length > 0) {
    console.log('Menu already seeded. Skipping insert.');
    return;
  }

  console.log('Inserting menu items...');
  const { data, error: insertError } = await supabase
    .from('menu')
    .insert(menuItems)
    .select();

  if (insertError) {
    console.error('Error seeding database:', insertError);
  } else {
    console.log(`Successfully seeded ${data ? data.length : 0} items to Supabase!`);
  }
}

seed();
