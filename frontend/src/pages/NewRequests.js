import React, { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NewRequests() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNew(); const id = setInterval(fetchNew, 10000); return () => clearInterval(id); }, []);

  async function fetchNew() {
    try {
      const res = await api.get('/orders/new');
      console.log('NEW ORDERS RESPONSE:', res.data);
      setOrders(res.data.orders || []);
    } catch (_) {
      setOrders([{
        id:99, order_number:'KRV9825', created_at: new Date().toISOString(),
        pickup_address:'Burger Palace, One Town', drop_address:'Flat 4B, Sunrise Apts, Benz Circle',
        items:[{name:'Cheese Burger',qty:2},{name:'Nuggets',qty:1}], item_count:3,
        distance_km:3.2, estimated_time:'~18 min', total_earn:45,
      }]);
    } finally { setLoading(false); }
  }

  async function accept(id) {
    try {
      await api.post(`/orders/${id}/accept`);
      toast.success('Order accepted! Head to pickup 🏍️');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) { toast.error(e.response?.data?.error || 'Could not accept'); }
  }

  function decline(id) {
    setOrders(prev => prev.filter(o => o.id !== id));
    toast('Order declined');
  }

  return (
    <div>
      <div className="sec-hd">
        <h3>New Delivery Requests</h3>
        <button className="btn-icon" onClick={fetchNew} style={{ color:'var(--or)' }}><FiRefreshCw /></button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="es-icon">⏳</div><h4>Loading orders…</h4></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon">🔔</div>
          <h4>No New Requests</h4>
          <p>Stay online — orders will appear here automatically.</p>
        </div>
      ) : orders.map(o => (
        <div key={o.id} className="order-card">
          <div className="oc-top">
            <div>
              <div className="oc-id">#{o.order_number}</div>
              <div className="oc-time">🕐 {new Date(o.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
            </div>
            <span className="status-pill sp-new">🔔 New Request</span>
          </div>

          <div className="oc-route">
            <div className="route-line">
              <div className="route-dot rd-pick" />
              <div className="route-connector" />
              <div className="route-dot rd-drop" />
            </div>
            <div className="route-stops">
              <div><div className="stop-type st-pick">Pickup</div><div className="stop-name">{o.pickup_address}</div></div>
              <div><div className="stop-type st-drop">Delivery</div><div className="stop-name">{o.drop_address}</div></div>
            </div>
          </div>

          <div className="oc-meta">
            <div className="meta-chip">📦 {Array.isArray(o.items) ? o.items.map(i=>`${i.name} ×${i.qty}`).join(', ') : `${o.item_count} items`}</div>
            <div className="meta-chip">📍 {o.distance_km} km</div>
            <div className="meta-chip">⏱️ {o.estimated_time}</div>
            <div className="meta-chip" style={{ color:'var(--gn)', fontWeight:700 }}>💰 ₹{o.total_earn}</div>
          </div>

          <div className="oc-actions">
            <button className="btn-success" style={{ flex:2, padding:13, fontSize:'1rem' }} onClick={() => accept(o.id)}>
              ✓ Accept Order
            </button>
            <button className="btn-danger" style={{ flex:1, padding:13 }} onClick={() => decline(o.id)}>
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
