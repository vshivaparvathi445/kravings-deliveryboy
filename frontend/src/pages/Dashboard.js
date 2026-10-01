import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiDollarSign, FiStar, FiMap, FiPhone, FiNavigation } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [active,  setActive]  = useState([]);
  const [daily,   setDaily]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [sRes, aRes, dRes] = await Promise.all([
        api.get('/orders/stats'),
        api.get('/orders/active'),
        api.get('/earnings/daily?days=7'),
      ]);
      setStats(sRes.data);
      setActive(aRes.data.orders || []);
      setDaily((dRes.data.daily || []).map(d => ({
        day:      new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
        earnings: d.earnings,
        orders:   d.deliveries,
      })));
    } catch (_) {
      // fallback demo data
      setStats({ today_deliveries:8, today_earnings:520, today_distance_km:42, rating:4.87 });
      setActive([]);
      setDaily([
        { day:'Mon', earnings:380, orders:5 },
        { day:'Tue', earnings:520, orders:7 },
        { day:'Wed', earnings:460, orders:6 },
        { day:'Thu', earnings:610, orders:8 },
        { day:'Fri', earnings:720, orders:9 },
        { day:'Sat', earnings:840, orders:11 },
        { day:'Sun', earnings:520, orders:8 },
      ]);
    } finally { setLoading(false); }
  }

  async function markPickedUp(id) {
    try {
      await api.post(`/orders/${id}/pickup`);
      toast.success('Marked as picked up! 📦');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  }

  async function markDelivered(id, otp) {
    const code = window.prompt('Enter 4-digit OTP from customer:');
    if (!code) return;
    try {
      const res = await api.post(`/orders/${id}/deliver`, { otp: code });
      toast.success(`Delivered! ₹${res.data.earned} earned 🎉`);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || 'Wrong OTP'); }
  }

  if (loading) return (
    <div className="loading-page" style={{ height: 'auto', padding: 80 }}>
      <div className="loading-logo">🍟</div>
      <div className="loading-text">Loading Dashboard…</div>
    </div>
  );

  return (
    <div>
      {/* ── STAT CARDS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon si-or"><FiTruck /></div>
          <div>
            <div className="stat-num">{stats?.today_deliveries ?? 0}</div>
            <div className="stat-lbl">Today's Deliveries</div>
            <div className="stat-delta delta-up">↑ 2 more than yesterday</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-gn"><FiDollarSign /></div>
          <div>
            <div className="stat-num">₹{stats?.today_earnings ?? 0}</div>
            <div className="stat-lbl">Today's Earnings</div>
            <div className="stat-delta delta-up">↑ Including bonuses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-bl"><FiStar /></div>
          <div>
            <div className="stat-num">{stats?.rating ?? '–'}</div>
            <div className="stat-lbl">Avg Rating</div>
            <div className="stat-delta delta-up">↑ +0.04 this week</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-pu"><FiMap /></div>
          <div>
            <div className="stat-num">{stats?.today_distance_km ?? 0} km</div>
            <div className="stat-lbl">Distance Today</div>
            <div className="stat-delta delta-dn">↓ Below avg</div>
          </div>
        </div>
      </div>

      {/* ── EARNINGS CHART ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Weekly Earnings Overview 📊</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily} barSize={32}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis hide />
            <Tooltip
              formatter={v => [`₹${v}`, 'Earnings']}
              contentStyle={{ fontFamily: 'Nunito, sans-serif', borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
            />
            <Bar dataKey="earnings" fill="#FC8019" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── MAP CARD ── */}
      {active.length > 0 && (
        <>
          <div className="sec-hd">
            <h3>Current Delivery</h3>
            <span style={{ color:'var(--or)', cursor:'pointer', fontWeight:700 }} onClick={() => navigate('/active')}>View all →</span>
          </div>
          <div className="map-card">
            <div className="map-ph">
              <div className="map-grid" />
              <div className="map-road-h" style={{ top: '40%' }} />
              <div className="map-road-h" style={{ top: '65%' }} />
              <div className="map-road-v" style={{ left: '30%' }} />
              <div className="map-road-v" style={{ left: '60%' }} />
              <div className="map-pin">📍</div>
              <div className="map-info">En route · {active[0]?.distance_km} km away</div>
            </div>
            <div className="map-controls">
              <div className="map-addr">
                <strong>#{active[0]?.order_number}</strong>
                <span>Drop: {active[0]?.drop_address}</span>
              </div>
              <button className="btn-icon" style={{ background:'var(--bll)', color:'var(--bl)', borderRadius:12, padding:'10px 14px' }}
                onClick={() => toast.success('Calling customer…')}>
                <FiPhone />
              </button>
              <button className="btn-icon" style={{ background:'var(--lt)', border:'1.5px solid var(--bd)', borderRadius:12, padding:'10px 14px', fontWeight:700, fontSize:'.82rem' }}
                onClick={() => toast.success('Opening navigation…')}>
                <FiNavigation /> &nbsp;Navigate
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── ACTIVE ORDERS ── */}
      <div className="sec-hd" style={{ marginTop: 8 }}>
        <h3>Active Orders</h3>
        <span style={{ color:'var(--or)', cursor:'pointer', fontWeight:700 }} onClick={() => navigate('/active')}>See all →</span>
      </div>

      {active.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon">🏍️</div>
          <h4>No Active Orders</h4>
          <p>Go online and accept requests to start earning!</p>
        </div>
      ) : (
        active.slice(0, 2).map(o => (
          <OrderCard key={o.id} order={o} onPickup={markPickedUp} onDeliver={markDelivered} />
        ))
      )}
    </div>
  );
}

function OrderCard({ order, onPickup, onDeliver }) {
  const stMap = {
    assigned: { cls: 'sp-assigned', label: 'Assigned',  icon: '📦' },
    picked:   { cls: 'sp-picked',   label: 'Picked Up', icon: '🏍️' },
    delivered:{ cls: 'sp-delivered',label: 'Delivered', icon: '✅' },
  };
  const st = stMap[order.status] || stMap.assigned;

  return (
    <div className="order-card">
      <div className="oc-top">
        <div>
          <div className="oc-id">#{order.order_number}</div>
          <div className="oc-time">🕐 {order.assigned_at ? new Date(order.assigned_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Just now'}</div>
        </div>
        <span className={`status-pill ${st.cls}`}>{st.icon} {st.label}</span>
      </div>

      <div className="oc-route">
        <div className="route-line">
          <div className="route-dot rd-pick" />
          <div className="route-connector" />
          <div className="route-dot rd-drop" />
        </div>
        <div className="route-stops">
          <div><div className="stop-type st-pick">Pickup</div><div className="stop-name">{order.pickup_address}</div></div>
          <div><div className="stop-type st-drop">Delivery</div><div className="stop-name">{order.drop_address}</div><div className="stop-addr">{order.customer_name}</div></div>
        </div>
      </div>

      <div className="oc-meta">
        {[
          { icon:'📦', val: Array.isArray(order.items) ? order.items.map(i=>`${i.name} ×${i.qty}`).join(', ') : `${order.item_count} items` },
          { icon:'📍', val: `${order.distance_km} km` },
          { icon:'⏱️', val: order.estimated_time },
          { icon:'💰', val: `₹${order.total_earn}`, green: true },
          ...(order.status==='picked' ? [{ icon:'🔑', val:`OTP: ${order.otp_code}`, orange:true }] : []),
        ].map((c,i) => (
          <div key={i} className="meta-chip" style={c.green ? { color:'var(--gn)', fontWeight:700 } : c.orange ? { color:'var(--or)', fontWeight:700 } : {}}>
            {c.icon} {c.val}
          </div>
        ))}
      </div>

      <div className="oc-actions">
        {order.status === 'assigned' && (
          <>
            <button className="btn-primary" style={{ flex:1, padding:12, fontSize:'.9rem' }} onClick={() => onPickup(order.id)}>
              📦 Mark Picked Up
            </button>
            <button className="btn-icon" style={{ background:'var(--bll)', color:'var(--bl)', borderRadius:12, padding:'0 14px' }}
              onClick={() => toast.success('Calling customer…')}><FiPhone /></button>
          </>
        )}
        {order.status === 'picked' && (
          <>
            <button className="btn-success" style={{ flex:1, padding:12, fontSize:'.9rem' }} onClick={() => onDeliver(order.id)}>
              ✅ Mark Delivered
            </button>
            <button className="btn-icon" style={{ background:'var(--bll)', color:'var(--bl)', borderRadius:12, padding:'0 14px' }}
              onClick={() => toast.success('Calling customer…')}><FiPhone /></button>
          </>
        )}
      </div>
    </div>
  );
}

export { OrderCard };
