-- MASSIVE MENU SEEDING FOR TGM CAFE
-- Copy and paste this into Supabase SQL Editor

-- 1. Ensure security is off
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items DISABLE ROW LEVEL SECURITY;

-- 2. Clear current menu (Optional: uncomment if you want to start fresh)
-- DELETE FROM public.menu;

-- 3. Insert Comprehensive Menu
INSERT INTO public.menu (name, category, price, stock_count) VALUES
-- Hot Drinks
('Tea', 'Hot Drinks', 15, 1000),
('Coffee', 'Hot Drinks', 20, 1000),
('Ginger Tea', 'Hot Drinks', 20, 1000),
('Masala Tea', 'Hot Drinks', 25, 1000),
('Lemon Tea', 'Hot Drinks', 20, 1000),
('Green Tea', 'Hot Drinks', 30, 1000),
('Boost', 'Hot Drinks', 35, 1000),
('Horlicks', 'Hot Drinks', 35, 1000),

-- Chat Items
('Pani Puri', 'Chat Items', 30, 99),
('Masal Puri', 'Chat Items', 30, 99),
('Bhel Puri', 'Chat Items', 40, 99),
('Dahi Puri', 'Chat Items', 50, 99),
('Samosa Chat', 'Chat Items', 50, 99),
('Kalan', 'Chat Items', 50, 99),
('Cauliflower Chilli', 'Chat Items', 50, 98),
('Chicken Chill', 'Chat Items', 60, 98),

-- Milk Shake
('Chocolate Shake', 'Milk Shake', 90, 50),
('Vanilla Shake', 'Milk Shake', 80, 50),
('Strawberry Shake', 'Milk Shake', 80, 50),
('Pista Shake', 'Milk Shake', 90, 50),
('Badam Shake', 'Milk Shake', 100, 50),
('Oreo Shake', 'Milk Shake', 110, 50),

-- Cooling / Cold Drinks
('Badam Milk', 'Cooling', 30, 99),
('Boost (Cold)', 'Cooling', 50, 100),
('Cold Coffee', 'Cooling', 70, 94),
('Rose Milk', 'Cooling', 40, 100),
('Lassi', 'Cooling', 50, 50),

-- Starters
('French Fries', 'Starter (Veg)', 80, 50),
('Cheese Fries', 'Starter (Veg)', 100, 50),
('Veg Nuggets', 'Starter (Veg)', 90, 50),
('Chicken Nuggets', 'Starter (Non-Veg)', 120, 50),
('Chicken Popcorn', 'Starter (Non-Veg)', 130, 50),

-- Rice & Noodles
('Veg Fried Rice', 'Rice & Noodle', 100, 50),
('Egg Fried Rice', 'Rice & Noodle', 120, 50),
('Chicken Fried Rice', 'Rice & Noodle', 140, 50),
('Veg Noodles', 'Rice & Noodle', 100, 50),
('Egg Noodles', 'Rice & Noodle', 120, 50),
('Chicken Noodles', 'Rice & Noodle', 140, 50),

-- Savories (By weight)
('Murukku', 'Savories', 30, 1000),
('Kara Boondi', 'Savories', 25, 1000),
('Mixture', 'Savories', 35, 1000),
('Pakoda', 'Savories', 40, 1000);
