// ═══ History.js ═══
import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function History() {
  const [orders, setOrders] = useState([]);
  const [page,   setPage]   = useState(1);
  const [total,  setTotal]  = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchHistory(); }, [page, filter]);

  async function fetchHistory() {
    try {
      const res = await api.get(`/orders/history?page=${page}&per_page=15${filter ? `&status=${filter}` : ''}`);
      setOrders(res.data.orders || []);
      setTotal(res.data.total  || 0);
    } catch (_) {
      setOrders([
        { id:1, order_number:'KRV9822', drop_address:'Asilmetta, Vijayawada', delivered_at:'2025-09-01T11:40:00', distance_km:4.1, total_earn:52, status:'delivered' },
        { id:2, order_number:'KRV9821', drop_address:'Benz Circle, VJA',      delivered_at:'2025-09-01T10:55:00', distance_km:2.8, total_earn:38, status:'delivered' },
        { id:3, order_number:'KRV9820', drop_address:'Patamata Colony',        delivered_at:'2025-09-01T10:10:00', distance_km:5.2, total_earn:60, status:'delivered' },
        { id:4, order_number:'KRV9819', drop_address:'Gandhi Nagar',           delivered_at:'2025-09-01T09:20:00', distance_km:1.9, total_earn:30, status:'delivered' },
        { id:5, order_number:'KRV9818', drop_address:'MG Road, VJA',          delivered_at:'2025-08-31T20:45:00', distance_km:3.0, total_earn:42, status:'delivered' },
        { id:6, order_number:'KRV9817', drop_address:'Suryaraopet',            delivered_at:'2025-08-31T19:30:00', distance_km:2.5, total_earn:35, status:'delivered' },
        { id:7, order_number:'KRV9816', drop_address:'Governorpet',            delivered_at:'2025-08-31T18:15:00', distance_km:4.5, total_earn:58, status:'delivered' },
        { id:8, order_number:'KRV9815', drop_address:'Labbipet',               delivered_at:'2025-08-31T17:00:00', distance_km:1.6, total_earn:28, status:'cancelled' },
      ]);
      setTotal(8);
    }
  }

  const totalEarn = orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+Number(o.total_earn),0);

  return (
    <div>
      <div className="sec-hd">
        <h3>Delivery History</h3>
        <div style={{ display:'flex', gap:8 }}>
          {['','delivered','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid var(--bd)',
                background: filter===f ? 'var(--or)' : '#fff',
                color: filter===f ? '#fff' : 'var(--gr)',
                fontWeight:700, cursor:'pointer', fontSize:'.8rem' }}>
              {f === '' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div className="card" style={{ flex:1, textAlign:'center', padding:16 }}>
          <div style={{ fontFamily:'Baloo 2,cursive', fontSize:'1.5rem', fontWeight:800 }}>{orders.filter(o=>o.status==='delivered').length}</div>
          <div style={{ fontSize:'.76rem', color:'var(--gr)', fontWeight:600 }}>Delivered</div>
        </div>
        <div className="card" style={{ flex:1, textAlign:'center', padding:16 }}>
          <div style={{ fontFamily:'Baloo 2,cursive', fontSize:'1.5rem', fontWeight:800, color:'var(--gn)' }}>₹{totalEarn}</div>
          <div style={{ fontSize:'.76rem', color:'var(--gr)', fontWeight:600 }}>Total Earned</div>
        </div>
        <div className="card" style={{ flex:1, textAlign:'center', padding:16 }}>
          <div style={{ fontFamily:'Baloo 2,cursive', fontSize:'1.5rem', fontWeight:800, color:'var(--red)' }}>{orders.filter(o=>o.status==='cancelled').length}</div>
          <div style={{ fontSize:'.76rem', color:'var(--gr)', fontWeight:600 }}>Cancelled</div>
        </div>
      </div>

      <div className="hist-table">
        <div className="ht-head">
          <div>Order ID</div><div>Drop Address</div><div>Date & Time</div>
          <div>Distance</div><div>Earned</div><div>Status</div>
        </div>
        {orders.map(o => (
          <div key={o.id} className="ht-row">
            <div className="ht-id">#{o.order_number}</div>
            <div style={{ fontSize:'.8rem', color:'var(--gr)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.drop_address}</div>
            <div style={{ fontSize:'.78rem', color:'var(--gr)' }}>
              {o.delivered_at ? new Date(o.delivered_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '–'}
            </div>
            <div style={{ fontSize:'.82rem' }}>{o.distance_km} km</div>
            <div className="ht-earn">₹{o.total_earn}</div>
            <div>
              <span className={`status-pill ${o.status==='delivered' ? 'sp-delivered' : 'sp-cancelled'}`} style={{ fontSize:'.7rem' }}>
                {o.status==='delivered' ? '✓ Delivered' : '✗ Cancelled'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {total > 15 && (
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:20 }}>
          <button className="btn-secondary" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
          <span style={{ padding:'10px 16px', fontWeight:700, color:'var(--gr)' }}>Page {page}</span>
          <button className="btn-secondary" disabled={orders.length < 15} onClick={() => setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
