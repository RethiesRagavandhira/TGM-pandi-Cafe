import React, { useState, useEffect } from 'react';
import { Download, Search, FileSpreadsheet, Receipt, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, socket } from '../api';
import * as XLSX from 'xlsx';

const History = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default today
  const navigate = useNavigate();

  useEffect(() => {
    loadBills();
    
    // Auto-refresh when bills change
    const handleUpdate = (data) => {
      if (data.table === 'bills' || data.table === 'bill_items') loadBills();
    };
    socket.on('database_update', handleUpdate);
    return () => socket.off('database_update', handleUpdate);
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err) {
      console.error("Failed to load bills", err);
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || bill.date_time.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bill? This will restore the stock counts for these items.")) {
      try {
        await api.deleteBill(id);
        await loadBills();
      } catch (err) {
        console.error("Error deleting bill", err);
      }
    }
  };

  const handleEdit = (bill) => {
    navigate('/billing', { state: { editBill: bill } });
  };

  const exportToExcel = () => {
    if (filteredBills.length === 0) {
      alert("No data to export for selected criteria.");
      return;
    }

    // Prepare data for Excel
    const exportData = [];
    
    filteredBills.forEach(bill => {
      // Add row for each item in the bill to make it detailed
      if (bill.items && bill.items.length > 0) {
        bill.items.forEach((item, idx) => {
          exportData.push({
            'Bill Number': idx === 0 ? bill.bill_number : '',
            'Date & Time': idx === 0 ? new Date(bill.date_time).toLocaleString() : '',
            'Item Name': item.item_name,
            'Quantity': item.quantity,
            'Price': item.price,
            'Total': item.total,
            'Bill Total': idx === 0 ? bill.total : '',
            'Payment Method': idx === 0 ? bill.payment_method : ''
          });
        });
      } else {
        // Fallback if no items array
        exportData.push({
          'Bill Number': bill.bill_number,
          'Date & Time': new Date(bill.date_time).toLocaleString(),
          'Item Name': '-',
          'Quantity': '-',
          'Price': '-',
          'Total': '-',
          'Bill Total': bill.total,
          'Payment Method': bill.payment_method
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    
    // Generate filename
    const dateStr = dateFilter || 'All_Dates';
    const fileName = `Cafe_Sales_Report_${dateStr}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="page-scroll">
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input
              className="input"
              type="text"
              placeholder="Search Bill No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px' }}>
            <input
              className="input"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ flex: 1 }}
            />
            {dateFilter && (
              <button className="btn btn-outline" onClick={() => setDateFilter('')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={exportToExcel} style={{ backgroundColor: 'var(--success-color)', width: 'auto', flex: '0 0 auto' }}>
          <FileSpreadsheet size={18} /> <span className="desktop-only">Export Excel</span>
        </button>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="table-container" style={{ flex: 1, border: 'none' }}>
          <table>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Bill Number</th>
                <th className="desktop-only">Date & Time</th>
                <th>Items (Qty)</th>
                <th className="desktop-only">Payment</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{bill.bill_number}</td>
                  <td className="desktop-only">{new Date(bill.date_time).toLocaleString()}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bill.items ? bill.items.map(i => `${i.item_name} (x${i.quantity})`).join(', ') : 'N/A'}
                  </td>
                  <td className="desktop-only">
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem',
                      backgroundColor: 'var(--bg-surface-hover)',
                      fontSize: '0.8rem'
                    }}>
                      {bill.payment_method}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{bill.total.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="icon-btn" onClick={() => handleEdit(bill)} title="Edit Bill"><Edit size={18} /></button>
                      <button className="icon-btn" style={{ color: 'var(--danger-color)' }} onClick={() => handleDelete(bill.id)} title="Delete Bill"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Receipt size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                    <p>No bills found for the selected criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
};

export default History;
