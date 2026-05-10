import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { api, socket } from '../api';

const MenuManager = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock_count: ''
  });

  useEffect(() => {
    loadMenu();
    
    // Auto-refresh when other devices modify menu
    const handleUpdate = (data) => {
      if (data.table === 'menu') loadMenu();
    };
    socket.on('database_update', handleUpdate);
    return () => socket.off('database_update', handleUpdate);
  }, []);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setItems(data);
    } catch (err) {
      console.error("Failed to load menu", err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      ...formData,
      price: parseFloat(formData.price),
      stock_count: parseInt(formData.stock_count, 10) || 0
    };

    try {
      if (editingItem) {
        await api.updateMenuItem({ ...itemData, id: editingItem.id });
      } else {
        await api.addMenuItem(itemData);
      }
      // loadMenu() is triggered by socket event, but we can call it here for instant feedback
      await loadMenu();
      closeModal();
    } catch (err) {
      console.error("Error saving item", err);
      alert("Failed to save item: " + (err.message || "Unknown error"));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      stock_count: item.stock_count
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.deleteMenuItem(id);
        await loadMenu();
      } catch (err) {
        console.error("Error deleting item", err);
      }
    }
  };

  const openNewItemModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', price: '', stock_count: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-scroll">
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 250px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              className="input" 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNewItemModal} style={{ whiteSpace: 'nowrap' }}>
          <Plus size={18} /> <span className="desktop-only">Add New Item</span><span className="mobile-only">Add Item</span>
        </button>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="table-container" style={{ flex: 1, border: 'none' }}>
          <table>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th className="desktop-only">Price</th>
                <th className="desktop-only">Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '1rem', 
                      backgroundColor: 'var(--bg-surface-hover)',
                      fontSize: '0.8rem'
                    }}>
                      {item.category}
                    </span>
                    <div className="mobile-only" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      ₹{item.price.toFixed(2)} | Stock: {item.stock_count}
                    </div>
                  </td>
                  <td className="desktop-only">₹{item.price.toFixed(2)}</td>
                  <td className="desktop-only">
                    <span style={{ color: item.stock_count < 10 ? 'var(--danger-color)' : 'inherit', fontWeight: item.stock_count < 10 ? 600 : 400 }}>
                      {item.stock_count}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="icon-btn" onClick={() => handleEdit(item)}><Edit size={18} /></button>
                      <button className="icon-btn" style={{ color: 'var(--danger-color)' }} onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card modal-container" style={{ width: '400px', animation: 'fadeIn 0.2s ease', maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Item Name</label>
                <input className="input" name="name" required value={formData.name} onChange={handleInputChange} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                <select 
                  className="input" 
                  name="category" 
                  required 
                  value={formData.category} 
                  onChange={handleInputChange}
                  style={{ appearance: 'auto' }}
                >
                  <option value="" disabled>Select a category</option>
                  {/* Current categories in use + defaults */}
                  {[...new Set(['Hot Drinks', 'Milk Shake', 'Mojito', 'Chat Items', 'Scopes', 'Juice', 'Cooling', 'Starter (Veg)', 'Rice & Noodle', 'Starter (Non-Veg)', 'Desserts', 'Savories', ...items.map(i => i.category)])].sort().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {formData.category === 'Other' && (
                  <input 
                    className="input" 
                    style={{ marginTop: '0.5rem' }} 
                    placeholder="Type new category..."
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price</label>
                  <input className="input" name="price" type="number" step="0.01" min="0" required value={formData.price} onChange={handleInputChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Stock Count {formData.category.toLowerCase() === 'saver' ? '(Optional)' : ''}</label>
                  <input className="input" name="stock_count" type="number" min="0" required={formData.category.toLowerCase() !== 'saver'} value={formData.stock_count} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Item' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
};

export default MenuManager;
