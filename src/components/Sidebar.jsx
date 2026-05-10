import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Utensils, History, Coffee } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard',       path: '/',        icon: <LayoutDashboard size={19} /> },
    { name: 'Billing',         path: '/billing', icon: <Receipt size={19} /> },
    { name: 'Menu Management', path: '/menu',    icon: <Utensils size={19} /> },
    { name: 'Sales History',   path: '/history', icon: <History size={19} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo desktop-only">
        <img
          src="./Bakery.jpeg"
          alt="TGM Cafe"
          style={{
            width: '100%',
            maxWidth: '130px',
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
            border: '2px solid rgba(249,115,22,0.2)',
          }}
        />
      </div>

      {/* Label */}
      <div className="desktop-only" style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        marginTop: '-0.5rem',
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>TGM Pandi Cafe</span>
      </div>

      {/* Divider */}
      <div className="desktop-only" style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)',
        marginBottom: '1rem',
      }} />

      {/* Nav Links */}
      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="desktop-only" style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--text-light)',
        fontSize: '0.75rem',
      }}>
        <Coffee size={14} color="var(--primary)" />
        <span>POS v2.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
