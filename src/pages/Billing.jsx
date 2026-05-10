import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Scale, Package, X, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, socket } from '../api';

/* ── helpers ─────────────────────────────────────────────── */
const isSaver = (cat) => cat?.toLowerCase() === 'savories' || cat?.toLowerCase() === 'saver';

/* ── Category gradient colors for card backgrounds ── */
const CAT_COLORS = {
  'Hot Drinks':        ['#92400e','#b45309'],
  'Milk Shake':        ['#6d28d9','#8b5cf6'],
  'Mojito':            ['#065f46','#059669'],
  'Chat Items':        ['#9a3412','#ea580c'],
  'Scopes':            ['#be185d','#ec4899'],
  'Juice':             ['#92400e','#f59e0b'],
  'Cooling':           ['#1e40af','#3b82f6'],
  'Starter (Veg)':     ['#166534','#22c55e'],
  'Rice & Noodle':     ['#854d0e','#ca8a04'],
  'Starter (Non-Veg)': ['#7f1d1d','#ef4444'],
  'Desserts':          ['#86198f','#d946ef'],
  'Savories':          ['#78350f','#d97706'],
};

/* ── High Quality Unsplash Images for Categories ── */
const CAT_IMAGES = {
  'Hot Drinks':        'https://images.unsplash.com/photo-1544787219-7f47ccb79074?w=300&q=70', // Tea/Coffee
  'Milk Shake':        'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=70', // Milkshake
  'Mojito':            'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=70', // Mojito
  'Chat Items':        'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=70', // Chat
  'Scopes':            'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=70', // Ice Cream
  'Juice':             'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=70', // Fresh Juice
  'Cooling':           'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=70', // Cold Drink
  'Starter (Veg)':     'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=300&q=70', // Veg Starter
  'Rice & Noodle':     'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=70', // Noodles
  'Starter (Non-Veg)':'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&q=70', // Fried Chicken
  'Desserts':          'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=70', // Cake
  'Savories':          'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&q=70', // Snacks
};

const getItemImage = (name, category) => {
  // Hardcoded known good images for a few items
  const specialImages = {
    'Coffee': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=300&q=70',
    'French Fries': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=70',
    'Pani Puri': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=70',
    'Chicken Nuggets': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=70',
  };
  
  if (specialImages[name]) return specialImages[name];

  // Fetch the first image result from a real search engine (Bing) for high accuracy
  const searchQuery = encodeURIComponent(`${name} ${category !== 'Chat Items' && category !== 'Savories' ? category : ''} food`);
  return `https://tse1.mm.bing.net/th?q=${searchQuery}`;
};

const getCatEmoji = (cat) => {
  const m = { 'hot drinks':'☕','milk shake':'🥤','mojito':'🍹','chat items':'🍡',
    'scopes':'🍦','juice':'🍊','cooling':'🧊','starter (veg)':'🥗',
    'rice & noodle':'🍜','starter (non-veg)':'🍗','desserts':'🍰','savories':'⚖️' };
  return m[cat?.toLowerCase()] ?? '🍽️';
};


/* ── component ───────────────────────────────────────────── */
const Billing = () => {
  const [items, setItems]                     = useState([]);
  const [cart, setCart]                       = useState([]);
  const [search, setSearch]                   = useState('');
  const [categoryFilter, setCategoryFilter]   = useState('All');
  const [isCheckoutOpen, setIsCheckoutOpen]   = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState('Cash');
  const [mobileView, setMobileView]           = useState('menu'); // 'menu' or 'cart'

  const location = useLocation();
  const navigate  = useNavigate();
  const editBill  = location.state?.editBill || null;
  const [editingBillId,     setEditingBillId]     = useState(null);
  const [editingBillNumber, setEditingBillNumber] = useState(null);

  const [weightModal, setWeightModal] = useState(null);
  const [weightGrams, setWeightGrams] = useState('');
  const [weightPrice, setWeightPrice] = useState('');
  const [receipt, setReceipt]         = useState(null); // { billNumber, items, total, paymentMethod, date, time }

  useEffect(() => {
    loadMenu();
    if (editBill) {
      setEditingBillId(editBill.id);
      setEditingBillNumber(editBill.bill_number);
      setPaymentMethod(editBill.payment_method);
      setCart(editBill.items.map(i => ({
        id: i.item_id, name: i.item_name,
        price: i.price, quantity: i.quantity, stock_count: 9999,
      })));
      navigate('/billing', { replace: true, state: {} });
    }
    const onUpdate = (d) => { if (d.action.startsWith('menu_')) loadMenu(); };
    socket.on('database_update', onUpdate);
    return () => socket.off('database_update', onUpdate);
  }, [editBill, navigate]);

  const loadMenu = async () => {
    try { setItems(await api.getMenu()); }
    catch (e) { console.error('Failed to load menu', e); }
  };

  const categories  = ['All', ...new Set(items.map(i => i.category))];
  const filtered    = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === 'All' || i.category === categoryFilter)
  );

  const addToCart = (item) => {
    if (isSaver(item.category)) {
      setWeightModal(item); setWeightGrams(''); setWeightPrice(''); return;
    }
    if (item.stock_count <= 0) { alert('Out of stock!'); return; }
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) {
        if (ex.quantity >= item.stock_count) return prev;
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(i => {
      if (i.id !== id) return i;
      const q = i.quantity + delta;
      return (q > 0 && q <= i.stock_count) ? { ...i, quantity: q } : i;
    }).filter(i => i.quantity > 0)
  );

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    if (!weightGrams || !weightPrice) return;
    setCart(prev => [...prev, {
      id: Date.now() + Math.random(),
      item_id: weightModal.id,
      name: `${weightModal.name} (${weightGrams}g)`,
      price: parseFloat(weightPrice),
      quantity: 1,
      isWeightBased: true,
      stock_count: 9999,
    }]);
    setWeightModal(null);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total    = subtotal;

  const handleCheckout = async () => {
    if (!cart.length) return;
    const billData = {
      id: editingBillId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      subtotal, tax: 0, total, payment_method: paymentMethod,
      items: cart.map(i => ({ id: i.item_id || i.id, name: i.name, price: i.price, quantity: i.quantity })),
    };
    try {
      if (editingBillId) {
        const r = await api.updateBill(billData);
        if (r.success) {
          setCart([]); setIsCheckoutOpen(false);
          setReceipt({ billNumber: editingBillNumber, items: cart, total, paymentMethod, date: billData.date, time: billData.time });
          setEditingBillId(null); setEditingBillNumber(null);
        }
      } else {
        const r = await api.createBill(billData);
        if (r.success) {
          setCart([]); setIsCheckoutOpen(false);
          setReceipt({ billNumber: r.billNumber, items: cart, total, paymentMethod, date: billData.date, time: billData.time });
        }
      }
    } catch (e) { 
      console.error(e); 
      alert('Checkout failed: ' + (e.message || 'Check your internet or Supabase key')); 
    }
  };

  /* ── styles ─ */
  const S = {
    overlay: { position:'fixed', inset:0, background:'rgba(20,10,0,0.65)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' },
    modal:   { background:'var(--bg-surface)', borderRadius:'var(--r-xl)', padding:'2rem', width:'420px', maxWidth: '95%', boxShadow:'0 24px 60px rgba(0,0,0,0.35)', animation:'slideUp 0.25s var(--ease)', border:'1px solid var(--border)' },
  };

  return (
    <>
      <div className="animate-fade-in billing-layout" style={{ position: 'relative' }}>

        {/* ── MOBILE TOGGLE (Sticky Top) ────────────────── */}
        <div className="mobile-flex" style={{
          display: 'none',
          position: 'sticky',
          top: '-1px',
          background: 'var(--bg)',
          padding: '0.75rem 0',
          zIndex: 100,
          justifyContent: 'center',
          borderBottom: '1px solid var(--border)',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            padding: '0.3rem',
            borderRadius: '99px',
            display: 'flex',
            gap: '0.2rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setMobileView('menu')}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '99px',
                border: 'none',
                background: mobileView === 'menu' ? 'var(--primary)' : 'transparent',
                color: mobileView === 'menu' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Menu
            </button>
            <button
              onClick={() => setMobileView('cart')}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '99px',
                border: 'none',
                background: mobileView === 'cart' ? 'var(--primary)' : 'transparent',
                color: mobileView === 'cart' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              Cart {cart.length > 0 && <span style={{ background: mobileView === 'cart' ? '#fff' : 'var(--primary)', color: mobileView === 'cart' ? 'var(--primary)' : '#fff', padding: '0 5px', borderRadius: '4px', fontSize: '0.7rem' }}>{cart.length}</span>}
            </button>
          </div>
        </div>

        {/* ── LEFT: Menu ───────────────────────────────── */}
        <div className={`billing-main ${mobileView === 'menu' ? 'mobile-show' : 'mobile-hide'}`}>

          {/* Search + Filters bar */}
          <div className="card" style={{ padding:'0.875rem 1rem', display:'flex', gap:'0.875rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:'180px' }}>
              <Search size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
              <input
                className="input"
                type="text"
                placeholder="Search items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:'38px' }}
              />
            </div>
            <div className="scroll-x" style={{ flex: 1, minWidth: 0 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding:'0.35rem 0.9rem',
                    borderRadius:'99px',
                    border:'1.5px solid',
                    fontSize:'0.8rem',
                    fontWeight:600,
                    cursor:'pointer',
                    transition:'all 0.18s',
                    whiteSpace:'nowrap',
                    fontFamily:"'Outfit', sans-serif",
                    background: categoryFilter === cat ? 'linear-gradient(135deg,var(--primary),var(--accent-dark))' : 'transparent',
                    color:      categoryFilter === cat ? '#fff' : 'var(--text-muted)',
                    borderColor:categoryFilter === cat ? 'transparent' : 'var(--border)',
                    boxShadow:  categoryFilter === cat ? '0 3px 10px rgba(249,115,22,0.4)' : 'none',
                  }}
                >
                  {getCatEmoji(cat)} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu grid */}
          <div style={{
            flex:1, overflowY:'auto',
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))',
            gridAutoRows:'max-content',
            gap:'0.875rem',
            paddingBottom:'0.5rem',
            alignContent:'start',
          }}>
            {filtered.map(item => {
              const available = item.stock_count > 0 || isSaver(item.category);
              const img = getItemImage(item.name, item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => available && addToCart(item)}
                  style={{
                    minHeight: '165px',
                    background:'var(--bg-surface)',
                    border:'1.5px solid var(--border)',
                    borderRadius:'var(--r-lg)',
                    cursor: available ? 'pointer' : 'not-allowed',
                    opacity: available ? 1 : 0.5,
                    display:'flex', flexDirection:'column',
                    transition:'all 0.2s var(--ease)',
                    boxShadow:'var(--shadow-sm)',
                    overflow:'hidden',
                  }}
                  onMouseEnter={e => { if(available){e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='var(--shadow-lg)';e.currentTarget.style.borderColor='var(--primary)';}}}
                  onMouseLeave={e => {e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='var(--shadow-sm)';e.currentTarget.style.borderColor='var(--border)';}}
                >
                  {/* Food image — gradient bg always shows, img loads on top */}
                  <div style={{
                    height:'85px', flexShrink: 0, overflow:'hidden', position:'relative',
                    background: `linear-gradient(135deg, ${(CAT_COLORS[item.category]||['#374151','#6b7280'])[0]}, ${(CAT_COLORS[item.category]||['#374151','#6b7280'])[1]})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {/* Real image loads on top, fades in */}
                    {img && <img
                      src={img}
                      alt={item.name}
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0, transition:'opacity 0.4s' }}
                      loading="lazy"
                      onLoad={e => { e.target.style.opacity = '1'; }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)' }} />
                    {isSaver(item.category) && (
                      <span style={{ position:'absolute', top:'6px', left:'6px', background:'#10b981', color:'#fff', fontSize:'0.6rem', fontWeight:700, padding:'2px 7px', borderRadius:'99px', letterSpacing:'0.05em', zIndex:2 }}>⚖ BY WEIGHT</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding:'0.65rem 0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem', flex:1 }}>
                    <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                      color: isSaver(item.category) ? 'var(--success)' : 'var(--primary)' }}>
                      {getCatEmoji(item.category)} {item.category}
                    </div>
                    <div style={{ fontWeight:600, fontSize:'0.85rem', lineHeight:1.3, color:'var(--text)' }}>{item.name}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:'0.25rem' }}>
                      <span style={{ fontFamily:"'Outfit',sans-serif", color:'var(--primary)', fontWeight:800, fontSize:'1rem' }}>₹{item.price.toFixed(0)}</span>
                      <span style={{ fontSize:'0.68rem', fontWeight:600,
                        color: isSaver(item.category) ? 'var(--success)' : (item.stock_count < 10 ? 'var(--danger)' : 'var(--text-muted)') }}>
                        {isSaver(item.category) ? '⚖️ Wt' : `📦 ${item.stock_count}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--text-muted)', padding:'3rem', fontSize:'0.9rem' }}>
                No items found. Try a different search.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart ──────────────────────────────── */}
        <div className={`card billing-cart ${mobileView === 'cart' ? 'mobile-show' : 'mobile-hide'}`} style={{ padding:0 }}>

          {/* Cart Header */}
          <div style={{
            padding:'1.1rem 1.4rem',
            background:'linear-gradient(135deg, var(--primary), var(--accent-dark))',
            borderRadius:'var(--r-xl) var(--r-xl) 0 0',
            display:'flex', alignItems:'center', gap:'0.6rem',
          }}>
            <ShoppingCart size={20} color="#fff" />
            <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, color:'#fff', fontSize:'1rem' }}>
              {editingBillId ? `✏️ Editing ${editingBillNumber}` : 'Current Bill'}
            </span>
            {cart.length > 0 && (
              <span style={{
                marginLeft:'auto', background:'rgba(255,255,255,0.25)', color:'#fff',
                borderRadius:'99px', padding:'0.15rem 0.55rem', fontSize:'0.78rem', fontWeight:700,
              }}>{cart.length}</span>
            )}
          </div>

          {/* Items list */}
          <div style={{ flex:1, overflowY:'auto', padding:'0.875rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {cart.length === 0 ? (
              <div style={{
                flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                color:'var(--text-muted)', minHeight:'200px', gap:'0.75rem',
              }}>
                <ShoppingCart size={44} opacity={0.15} />
                <span style={{ fontSize:'0.875rem' }}>Cart is empty</span>
                <span style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>Click menu items to add</span>
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{
                display:'flex', alignItems:'center', gap:'0.6rem',
                padding:'0.65rem 0.75rem',
                background:'var(--bg)',
                borderRadius:'var(--r-md)',
                border:'1px solid var(--border)',
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'0.85rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginTop:'1px' }}>₹{item.price.toFixed(2)} each</div>
                </div>

                {/* Qty controls */}
                {item.isWeightBased ? (
                  <span style={{ fontSize:'0.75rem', color:'var(--success)', fontWeight:600, background:'var(--success-bg)', padding:'0.2rem 0.5rem', borderRadius:'99px' }}>
                    <Scale size={10} style={{ display:'inline', marginRight:'2px' }} />Wt
                  </span>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden' }}>
                    <button className="icon-btn" style={{ padding:'0.3rem 0.4rem', borderRadius:0 }} onClick={() => updateQty(item.id, -1)}><Minus size={12} /></button>
                    <span style={{ width:'22px', textAlign:'center', fontSize:'0.85rem', fontWeight:700 }}>{item.quantity}</span>
                    <button className="icon-btn" style={{ padding:'0.3rem 0.4rem', borderRadius:0 }} onClick={() => updateQty(item.id, 1)}><Plus size={12} /></button>
                  </div>
                )}

                <div style={{ width:'52px', textAlign:'right', fontWeight:700, fontSize:'0.85rem', color:'var(--primary)' }}>
                  ₹{(item.price * item.quantity).toFixed(0)}
                </div>

                <button className="icon-btn" style={{ color:'var(--danger)', padding:'0.25rem' }} onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Total + checkout */}
          <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid var(--border)', background:'var(--bg-surface2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem', borderTop:'1.5px dashed var(--border)', paddingTop:'0.6rem' }}>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.2rem' }}>Total</span>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'var(--primary)' }}>₹{total.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width:'100%', padding:'0.9rem', fontSize:'1rem', borderRadius:'var(--r-lg)' }}
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              {editingBillId ? '✏️ Update Bill' : '🧾 Proceed to Checkout'}
            </button>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ width:'100%', marginTop:'0.5rem', padding:'0.5rem', background:'none', border:'none', color:'var(--danger)', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CHECKOUT MODAL ─────────────────────────────── */}
      {isCheckoutOpen && (
        <div style={S.overlay} onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-container" style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.25rem' }}>💳</div>
              <h3 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.3rem' }}>Choose Payment</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.83rem', marginTop:'0.25rem' }}>Select how the customer will pay</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {[
                { key:'Cash', icon:<Banknote size={26} />, label:'Cash', color:'#16a34a' },
                { key:'UPI',  icon:<Smartphone size={26} />, label:'UPI',  color:'#7c3aed' },
                { key:'Card', icon:<CreditCard size={26} />, label:'Card', color:'#0369a1' },
              ].map(({ key, icon, label, color }) => (
                <div
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  style={{
                    border:`2px solid ${paymentMethod === key ? color : 'var(--border)'}`,
                    borderRadius:'var(--r-lg)', padding:'1rem 0.5rem',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
                    cursor:'pointer', transition:'all 0.2s var(--ease)',
                    background: paymentMethod === key ? `${color}12` : 'transparent',
                    transform: paymentMethod === key ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <span style={{ color: paymentMethod === key ? color : 'var(--text-muted)' }}>{icon}</span>
                  <span style={{ fontWeight:700, fontSize:'0.85rem', color: paymentMethod === key ? color : 'var(--text-muted)', fontFamily:"'Outfit',sans-serif" }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'var(--bg)', borderRadius:'var(--r-md)', padding:'1rem 1.25rem',
              marginBottom:'1.5rem', border:'1px solid var(--border)',
            }}>
              <span style={{ color:'var(--text-muted)', fontWeight:500 }}>Total Amount</span>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'var(--primary)' }}>₹{total.toFixed(2)}</span>
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setIsCheckoutOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={handleCheckout}>
                {editingBillId ? '✏️ Update Bill' : '✅ Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVORIES WEIGHT MODAL ──────────────────────── */}
      {weightModal && (
        <div style={{ ...S.overlay, zIndex:1100 }} onClick={() => setWeightModal(null)}>
          <div className="modal-container" style={{ ...S.modal, width:'390px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              textAlign:'center', marginBottom:'1.75rem',
              padding:'1.25rem',
              background:'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.1))',
              borderRadius:'var(--r-lg)',
              border:'1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize:'2.2rem', marginBottom:'0.4rem' }}>⚖️</div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--primary)', marginBottom:'0.35rem' }}>Savories</div>
              <h3 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'var(--text)' }}>{weightModal.name}</h3>
              <span style={{
                display:'inline-block', marginTop:'0.5rem',
                background:'var(--primary)', color:'#fff',
                padding:'0.25rem 0.8rem', borderRadius:'99px',
                fontSize:'0.75rem', fontWeight:700,
              }}>Manual Entry</span>
            </div>

            <form onSubmit={handleWeightSubmit}>
              {/* Weight */}
              <div style={{ marginBottom:'1.1rem' }}>
                <label style={{ display:'block', marginBottom:'0.45rem', fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>
                  ⚖️ Weight (Grams)
                </label>
                <input
                  className="input"
                  type="number" required min="1"
                  value={weightGrams}
                  onChange={e => {
                    const grams = e.target.value;
                    setWeightGrams(grams);
                    if (grams && weightModal.price) {
                      const calculated = (parseFloat(grams) / 100) * weightModal.price;
                      setWeightPrice(calculated.toFixed(2));
                    } else {
                      setWeightPrice('');
                    }
                  }}
                  placeholder="e.g. 100"
                  autoFocus
                  style={{ fontSize:'1.05rem', fontWeight:600 }}
                />
              </div>

              {/* Price */}
              <div style={{ marginBottom:'1.1rem' }}>
                <label style={{ display:'block', marginBottom:'0.45rem', fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>
                  💰 Price (₹)
                </label>
                <input
                  className="input"
                  type="number" step="0.01" min="0" required
                  value={weightPrice}
                  onChange={e => setWeightPrice(e.target.value)}
                  placeholder="e.g. 30"
                  style={{ fontSize:'1.05rem', fontWeight:600 }}
                />
                <p style={{ marginTop:'0.35rem', fontSize:'0.76rem', color:'var(--text-muted)' }}>
                  💡 Calculated based on ₹{weightModal.price} per 100g rate.
                </p>
              </div>

              {/* Live Preview */}
              {weightGrams && weightPrice && (
                <div style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(245,158,11,0.08))',
                  border:'1.5px solid rgba(249,115,22,0.3)',
                  borderRadius:'var(--r-md)',
                  padding:'0.85rem 1.1rem',
                  marginBottom:'1.25rem',
                }}>
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Preview</div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', marginTop:'0.15rem' }}>{weightGrams}g of {weightModal.name}</div>
                  </div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'var(--primary)' }}>
                    ₹{parseFloat(weightPrice || 0).toFixed(2)}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex:1 }} onClick={() => setWeightModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex:2 }}>
                  ➕ Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ──────────────────────────────── */}
      {receipt && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{
            background:'#ffffff',
            borderRadius:'8px',
            width:'360px',
            maxHeight:'92vh',
            overflowY:'auto',
            boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
            position:'relative',
            color:'#111111',          /* explicit dark — no CSS var leakage */
            fontFamily:"'Inter','Segoe UI',Arial,sans-serif",
          }}>
            {/* Close */}
            <button onClick={()=>setReceipt(null)} style={{ position:'absolute',top:'12px',right:'12px',background:'none',border:'none',cursor:'pointer',color:'#555',lineHeight:1 }}>
              <X size={18}/>
            </button>

            {/* Receipt body */}
            <div id="receipt-content" style={{ padding:'1.75rem 1.5rem', color:'#111111' }}>

              {/* ── Shop Header ── */}
              <div style={{ textAlign:'center', paddingBottom:'1.25rem', borderBottom:'2px dashed #d0d0d0', marginBottom:'1.25rem' }}>
                <div style={{
                  fontFamily:"'Inter','Segoe UI',Arial,sans-serif",
                  fontWeight:800,
                  fontSize:'1.35rem',
                  letterSpacing:'0.12em',
                  textTransform:'uppercase',
                  color:'#111111',          /* hard-coded black — always visible */
                }}>TGM PANDI CAFE</div>
                <div style={{ fontFamily:"'Inter',Arial,sans-serif", fontWeight:500, fontSize:'0.8rem', color:'#555555', marginTop:'0.35rem', letterSpacing:'0.02em' }}>
                  Your Taste, Our Pride
                </div>
                <div style={{ fontFamily:"'Inter',Arial,sans-serif", fontSize:'0.72rem', color:'#888888', marginTop:'0.2rem' }}>
                  📍 Thank you for visiting us!
                </div>
              </div>

              {/* ── Bill Meta ── */}
              <div style={{ fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:'0.78rem', color:'#333333', marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span>Bill No</span>
                  <strong style={{ color:'#111111', fontWeight:700 }}>#{receipt.billNumber}</strong>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span>Date</span>
                  <span style={{ color:'#333333' }}>{receipt.date}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span>Time</span>
                  <span style={{ color:'#333333' }}>{receipt.time}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Payment</span>
                  <span style={{ color:'#111111', fontWeight:600 }}>{receipt.paymentMethod}</span>
                </div>
              </div>

              {/* ── Items ── */}
              <div style={{ borderTop:'1px dashed #ccc', borderBottom:'1px dashed #ccc', padding:'0.9rem 0', marginBottom:'0.9rem' }}>
                {/* Column headers */}
                <div style={{
                  display:'grid', gridTemplateColumns:'1fr 40px 70px',
                  fontFamily:"'Inter',Arial,sans-serif",
                  fontSize:'0.68rem', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.07em',
                  color:'#777777', marginBottom:'0.6rem',
                  borderBottom:'1px solid #eeeeee', paddingBottom:'0.4rem',
                }}>
                  <span>Item</span>
                  <span style={{ textAlign:'center' }}>Qty</span>
                  <span style={{ textAlign:'right' }}>Amount</span>
                </div>
                {/* Rows */}
                {receipt.items.map((it, i) => (
                  <div key={i} style={{
                    display:'grid', gridTemplateColumns:'1fr 40px 70px',
                    fontFamily:"'Roboto Mono','Courier New',monospace",
                    fontSize:'0.78rem', color:'#222222',
                    marginBottom:'0.45rem', alignItems:'start',
                  }}>
                    <span style={{ lineHeight:1.4, paddingRight:'0.5rem' }}>{it.name}</span>
                    <span style={{ textAlign:'center', color:'#555555' }}>×{it.quantity}</span>
                    <span style={{ textAlign:'right', fontWeight:600, color:'#111111' }}>₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* ── Total ── */}
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                fontFamily:"'Inter',Arial,sans-serif",
                fontWeight:800, fontSize:'1.1rem', color:'#111111',
                borderBottom:'3px double #111111',
                padding:'0.6rem 0', marginBottom:'1.25rem',
              }}>
                <span style={{ letterSpacing:'0.04em' }}>TOTAL</span>
                <span style={{ fontSize:'1.2rem' }}>₹{receipt.total.toFixed(2)}</span>
              </div>

              {/* ── Footer ── */}
              <div style={{ textAlign:'center', fontFamily:"'Inter',Arial,sans-serif", lineHeight:1.8 }}>
                <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#333333', letterSpacing:'0.06em' }}>
                  ✦ THANK YOU ✦
                </div>
                <div style={{ fontSize:'0.76rem', color:'#666666' }}>Please visit again soon!</div>
                <div style={{ marginTop:'0.75rem', paddingTop:'0.6rem', borderTop:'1px dashed #ddd', fontSize:'0.65rem', color:'#aaaaaa', letterSpacing:'0.04em' }}>
                  Powered by TGM POS System
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #eeeeee', display:'flex', gap:'0.75rem', background:'#fafafa', borderRadius:'0 0 8px 8px' }}>
              <button onClick={()=>setReceipt(null)} style={{
                flex:1, padding:'0.6rem', border:'1.5px solid #d0d0d0', borderRadius:'8px',
                background:'#ffffff', color:'#333333', fontFamily:"'Inter',sans-serif",
                fontWeight:600, fontSize:'0.85rem', cursor:'pointer',
              }}>Close</button>
              <button onClick={() => {
                const content = document.getElementById('receipt-content').innerHTML;
                const w = window.open('','_blank','width=400,height=700');
                w.document.write(`<!DOCTYPE html><html><head><title>Bill #${receipt.billNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',Arial,sans-serif;color:#111;background:#fff;padding:1rem;}</style></head><body>${content}</body></html>`);
                w.document.close();
                w.focus();
                setTimeout(()=>{ w.print(); w.close(); }, 400);
              }} style={{
                flex:1, padding:'0.6rem', border:'none', borderRadius:'8px',
                background:'linear-gradient(135deg,#f97316,#d97706)', color:'#ffffff',
                fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:'0.85rem',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem',
              }}>
                <Printer size={15}/> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Billing;
