import { supabase } from './supabase';

// Store subscriptions to allow cleaning up
const subs = new Map();

export const socket = {
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
};

export const api = {
  // --- MENU ---
  getMenu: async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
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

    return {
      totalBillsToday: billIds?.length || 0,
      totalSalesToday,
      totalItemsSold,
      mostSoldItem: top,
      lowStockCount: lowStock || 0
    };
  }
};
