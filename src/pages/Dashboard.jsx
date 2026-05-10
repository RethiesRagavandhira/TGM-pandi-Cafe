import React, { useState, useEffect } from 'react';
import { IndianRupee, Receipt, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { api, socket } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBillsToday: 0,
    totalSalesToday: 0,
    totalItemsSold: 0,
    mostSoldItem: 'N/A',
    lowStockCount: 0
  });

  useEffect(() => {
    loadStats();
    const handleUpdate = () => loadStats();
    socket.on('database_update', handleUpdate);
    return () => socket.off('database_update', handleUpdate);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const statCards = [
    { title: "Today's Sales", value: `₹${stats.totalSalesToday.toFixed(2)}`, icon: <IndianRupee size={24} />, color: 'var(--success-color)' },
    { title: "Total Bills", value: stats.totalBillsToday, icon: <Receipt size={24} />, color: 'var(--primary-color)' },
    { title: "Items Sold", value: stats.totalItemsSold, icon: <Package size={24} />, color: 'var(--warning-color)' },
    { title: "Top Item", value: stats.mostSoldItem || 'N/A', icon: <TrendingUp size={24} />, color: '#8b5cf6' },
  ];

  return (
    <div className="page-scroll">
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {stats.lowStockCount > 0 && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid var(--danger-color)', 
          padding: '1rem 1.5rem', 
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          color: 'var(--danger-color)'
        }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Low Stock Alert</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>You have {stats.lowStockCount} items running low on stock. Please restock soon.</p>
          </div>
        </div>
      )}

      <div className="stat-cards-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="card animate-fade-in" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            animationDelay: `${idx * 0.1}s`,
            padding: '1rem'
          }}>
            <div style={{ 
              backgroundColor: `${card.color}20`, 
              color: card.color,
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {React.cloneElement(card.icon, { size: 20 })}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <TrendingUp size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
        <h3>Sales Analytics</h3>
        <p>Charts and graphs can be integrated here</p>
      </div>

    </div>
    </div>
  );
};

export default Dashboard;
