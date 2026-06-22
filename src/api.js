import { supabase } from './supabase';
import { io } from 'socket.io-client';

const LOCAL_SERVER_URL = 'http://localhost:5000';
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
const isLocalServer = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Initialize socket.io-client for local server mode
let localSocket;
if (typeof window !== 'undefined' && isLocalServer && !isElectron) {
  localSocket = io(LOCAL_SERVER_URL);
}

const sortMenuItems = (items) => {
  if (!Array.isArray(items)) return items;
  return [...items].sort((a, b) => {
    // 1. Sort by category first (maintain alphabetical order of categories)
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    
    // 2. Custom sorting for Hot Drinks category
    if (a.category === 'Hot Drinks') {
      const order = ['Tea', 'Black Tea', 'Coffee', 'Black Coffee'];
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Other hot drinks are sorted alphabetically
      return a.name.localeCompare(b.name);
    }
    
    // 3. Alphabetical sorting by name for other categories
    return a.name.localeCompare(b.name);
  });
};

// Store subscriptions to allow cleaning up
const subs = new Map();

export const socket = isElectron ? {
  on: (event, callback) => {
    // Local Electron instances do not require real-time cloud notifications,
    // as state changes are immediate and local.
    console.log('Electron environment: bypassing Supabase subscription');
  },
  off: (event, callback) => {
    console.log('Electron environment: bypassing Supabase subscription removal');
  }
} : (isLocalServer ? {
  on: (event, callback) => {
    if (localSocket) {
      localSocket.on(event, callback);
    }
  },
  off: (event, callback) => {
    if (localSocket) {
      localSocket.off(event, callback);
    }
  }
} : {
  on: (event, callback) => {
    if (event === 'database_update') {
      const sub = supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          callback({ action: 'database_update', table: payload.table });
        })
        .subscribe();
      subs.set(callback, sub);
    }
  },
  off: (event, callback) => {
    if (event === 'database_update') {
      const sub = subs.get(callback);
      if (sub) {
        supabase.removeChannel(sub);
        subs.delete(callback);
      }
    }
  }
});

export const api = isElectron ? {
  // --- MENU ---
  getMenu: async () => {
    const data = await window.electronAPI.getMenu();
    return sortMenuItems(data);
  },
  addMenuItem: async (item) => {
    const res = await window.electronAPI.addMenuItem({
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      stock_count: parseInt(item.stock_count) || 0
    });
    return { success: true, id: res?.id || null };
  },
  updateMenuItem: async (item) => {
    await window.electronAPI.updateMenuItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      stock_count: parseInt(item.stock_count) || 0
    });
    return { success: true };
  },
  deleteMenuItem: async (id) => {
    await window.electronAPI.deleteMenuItem(id);
    return { success: true };
  },
  
  // --- BILLING ---
  createBill: async (billData) => {
    return await window.electronAPI.createBill(billData);
  },
  getBills: async () => {
    return await window.electronAPI.getBills();
  },
  updateBill: async (billData) => {
    await window.electronAPI.updateBill(billData);
    return { success: true };
  },
  deleteBill: async (id) => {
    await window.electronAPI.deleteBill(id);
    return { success: true };
  },
  
  getDashboardStats: async () => {
    return await window.electronAPI.getDashboardStats();
  },
  
  // --- PURCHASES ---
  getPurchases: async () => {
    return await window.electronAPI.getPurchases();
  },
  addPurchaseItem: async (item) => {
    return await window.electronAPI.addPurchaseItem(item);
  },
  updatePurchaseItem: async (item) => {
    return await window.electronAPI.updatePurchaseItem(item);
  },
  deletePurchaseItem: async (id) => {
    return await window.electronAPI.deletePurchaseItem(id);
  }
} : (isLocalServer ? {
  // --- MENU ---
  getMenu: async () => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    const data = await res.json();
    return sortMenuItems(data);
  },
  addMenuItem: async (item) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        stock_count: parseInt(item.stock_count) || 0
      })
    });
    if (!res.ok) throw new Error('Failed to add menu item');
    return await res.json();
  },
  updateMenuItem: async (item) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/menu/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        stock_count: parseInt(item.stock_count) || 0
      })
    });
    if (!res.ok) throw new Error('Failed to update menu item');
    return await res.json();
  },
  deleteMenuItem: async (id) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/menu/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete menu item');
    return await res.json();
  },
  
  // --- BILLING ---
  createBill: async (billData) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    if (!res.ok) throw new Error('Failed to create bill');
    return await res.json();
  },
  getBills: async () => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/bills`);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return await res.json();
  },
  updateBill: async (billData) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/bills/${billData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    if (!res.ok) throw new Error('Failed to update bill');
    return await res.json();
  },
  deleteBill: async (id) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/bills/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete bill');
    return await res.json();
  },
  
  getDashboardStats: async () => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  },
  
  // --- PURCHASES ---
  getPurchases: async () => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/purchases`);
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return await res.json();
  },
  addPurchaseItem: async (item) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add purchase');
    return await res.json();
  },
  updatePurchaseItem: async (item) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/purchases/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to update purchase');
    return await res.json();
  },
  deletePurchaseItem: async (id) => {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/purchases/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete purchase');
    return await res.json();
  }
} : {
  // --- MENU ---
  getMenu: async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return sortMenuItems(data);
  },
  addMenuItem: async (item) => {
    // Ensure item has required fields
    const newItem = {
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      stock_count: parseInt(item.stock_count) || 0
    };
    const { data, error } = await supabase
      .from('menu')
      .insert([newItem])
      .select();
    if (error) throw error;
    return { success: true, id: data?.[0]?.id || null };
  },
  updateMenuItem: async (item) => {
    const updatedItem = {
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      stock_count: parseInt(item.stock_count) || 0
    };
    const { error } = await supabase
      .from('menu')
      .update(updatedItem)
      .eq('id', item.id);
    if (error) throw error;
    return { success: true };
  },
  deleteMenuItem: async (id) => {
    const { error } = await supabase
      .from('menu')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  
  // --- BILLING ---
  createBill: async (billData) => {
    try {
      const today = billData.date; // YYYY-MM-DD
      
      // 1. Generate Bill Number
      const { count } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .gte('date_time', `${today}T00:00:00Z`)
        .lte('date_time', `${today}T23:59:59Z`);
      
      const nextCount = (count || 0) + 1;
      const dateStr = today.replace(/-/g, '');
      const billNumber = `BL-${dateStr}-${nextCount.toString().padStart(4, '0')}`;

      // 2. Insert Bill Header
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert([{
          bill_number: billNumber,
          date_time: new Date(`${today}T${billData.time}`).toISOString(),
          subtotal: billData.subtotal,
          tax: billData.tax || 0,
          total: billData.total,
          payment_method: billData.payment_method
        }])
        .select();

      if (billError) throw billError;
      const billId = bill[0].id;

      // 3. Insert Bill Items & Update Stock
      for (const item of billData.items) {
        await supabase
          .from('bill_items')
          .insert([{
            bill_id: billId,
            item_id: item.id,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          }]);

        // Basic stock update
        const { data: menu } = await supabase.from('menu').select('stock_count').eq('id', item.id).single();
        if (menu) {
          await supabase.from('menu').update({ stock_count: menu.stock_count - item.quantity }).eq('id', item.id);
        }
      }

      return { success: true, billNumber };
    } catch (err) {
      console.error('Supabase createBill error:', err);
      throw err;
    }
  },
  getBills: async () => {
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .order('date_time', { ascending: false });
    
    if (billsError) throw billsError;

    for (let bill of bills) {
      const { data: items } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', bill.id);
      bill.items = items || [];
    }
    
    return bills;
  },
  updateBill: async (billData) => {
    // Delete old items then re-insert
    await supabase.from('bill_items').delete().eq('bill_id', billData.id);
    
    const { error: billError } = await supabase
      .from('bills')
      .update({
        subtotal: billData.subtotal,
        total: billData.total,
        payment_method: billData.payment_method
      })
      .eq('id', billData.id);
    
    if (billError) throw billError;

    for (const item of billData.items) {
      await supabase.from('bill_items').insert([{
        bill_id: billData.id,
        item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }]);
    }
    
    return { success: true };
  },
  deleteBill: async (id) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  
  getDashboardStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00Z`;
    
    const { data: salesData } = await supabase.from('bills').select('total').gte('date_time', startOfDay);
    const { data: billIds } = await supabase.from('bills').select('id').gte('date_time', startOfDay);
    
    const ids = billIds?.map(b => b.id) || [];
    const { data: itemsData } = await supabase.from('bill_items').select('quantity, item_name').in('bill_id', ids);
    
    const totalSalesToday = salesData?.reduce((s, b) => s + b.total, 0) || 0;
    const totalItemsSold = itemsData?.reduce((s, i) => s + i.quantity, 0) || 0;

    const itemCounts = {};
    itemsData?.forEach(i => itemCounts[i.item_name] = (itemCounts[i.item_name] || 0) + i.quantity);
    let top = 'N/A', max = 0;
    for (const n in itemCounts) if (itemCounts[n] > max) { max = itemCounts[n]; top = n; }

    const { count: lowStock } = await supabase.from('menu').select('*', { count: 'exact', head: true }).lt('stock_count', 10);
    const { data: purchaseData } = await supabase.from('purchases').select('total').eq('date', today);
    const totalPurchasesToday = purchaseData?.reduce((s, p) => s + p.total, 0) || 0;

    return {
      totalBillsToday: billIds?.length || 0,
      totalSalesToday,
      totalItemsSold,
      mostSoldItem: top,
      lowStockCount: lowStock || 0,
      totalPurchasesToday
    };
  },
  
  // --- PURCHASES ---
  getPurchases: async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('date', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return data;
  },
  addPurchaseItem: async (item) => {
    const { data, error } = await supabase
      .from('purchases')
      .insert([{
        date: item.date,
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.quantity) * parseFloat(item.price),
        category: item.category
      }])
      .select();
    if (error) throw error;
    return { success: true, id: data?.[0]?.id || null };
  },
  updatePurchaseItem: async (item) => {
    const { error } = await supabase
      .from('purchases')
      .update({
        date: item.date,
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.quantity) * parseFloat(item.price),
        category: item.category
      })
      .eq('id', item.id);
    if (error) throw error;
    return { success: true };
  },
  deletePurchaseItem: async (id) => {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
});
