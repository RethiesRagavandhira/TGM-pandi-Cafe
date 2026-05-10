import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Wifi } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api, socket } from '../api';

const pageInfo = {
  '/':        { title: 'Dashboard',              emoji: '📊' },
  '/billing': { title: 'Point of Sale (Billing)', emoji: '🧾' },
  '/menu':    { title: 'Menu Management',         emoji: '🍽️' },
  '/history': { title: 'Sales History',           emoji: '📋' },
};

const Header = () => {
  const [theme, setTheme]           = useState('light');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Low stock notifications
    const checkStock = async () => {
      try {
        const menu = await api.getMenu();
        const lowStock = menu.filter(item => item.stock_count < 10 && item.category.toLowerCase() !== 'savories' && item.category.toLowerCase() !== 'saver');
        setNotifications(lowStock.map(item => ({
          id: item.id,
          text: `Low stock: ${item.name} (${item.stock_count} left)`,
          type: 'warning'
        })));
      } catch (err) {
        console.error("Notif check failed", err);
      }
    };

    checkStock();
    socket.on('database_update', checkStock);
    
    return () => {
      clearInterval(timer);
      socket.off('database_update', checkStock);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const info = pageInfo[location.pathname] || { title: 'TGM Cafe', emoji: '☕' };

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const dateStr = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  return (
    <header className="header">
      {/* Left — Page Title */}
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{info.emoji}</span>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>{info.title}</div>
          <div className="desktop-only" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>TGM Pandi Cafe POS</div>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="header-actions">
        {/* Date + Time */}
        <div className="desktop-only" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.35,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.82rem' }}>{timeStr}</span>
          <span>{dateStr}</span>
        </div>

        {/* Online indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.72rem', color: 'var(--success)',
          background: 'var(--success-bg)',
          padding: '0.25rem 0.6rem',
          borderRadius: '99px',
          fontWeight: 600,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--success)',
            animation: 'pulse-ring 2s infinite',
          }} />
          <span className="desktop-only">Online</span>
        </div>

        {/* Dark/Light toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '8px', height: '8px',
                background: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid var(--bg-surface)',
              }} />
            )}
          </button>

          {isNotifOpen && (
            <div 
              className="card animate-fade-in" 
              style={{
                position: 'absolute', top: '100%', right: 0,
                width: '280px', marginTop: '0.75rem', zIndex: 1000,
                padding: '0.5rem 0', boxShadow: 'var(--shadow-lg)',
                maxHeight: '400px', overflowY: 'auto',
                border: '1px solid var(--border-strong)'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.85rem' }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  All clear! No new alerts.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ 
                    padding: '0.75rem 1rem', 
                    fontSize: '0.8rem', 
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: 'var(--warning-bg)',
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }} onClick={() => setIsNotifOpen(false)}>
                    ⚠️ {n.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Role Badge */}
        <div className="role-badge">Admin</div>
      </div>
    </header>
  );
};

export default Header;
