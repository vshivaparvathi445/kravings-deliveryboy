import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiShoppingBag, FiTruck, FiHome } from 'react-icons/fi';

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const steps = [
    { key:'placed',    icon:<FiCheck />,       label:'Order Placed',     sub:'Your order has been received',        state:'done' },
    { key:'preparing', icon:<FiShoppingBag />, label:'Preparing Order',  sub:'Restaurant is preparing your snacks', state:'done' },
    { key:'picked',    icon:<FiTruck />,        label:'Out for Delivery', sub:'Delivery partner is on the way',      state:'act'  },
    { key:'delivered', icon:<FiHome />,         label:'Delivered!',       sub:'Enjoy your snacks 🎉',                state:'pen'  },
  ];

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <div className="card">
        <div style={{ fontFamily:'Baloo 2,cursive', fontSize:'1.65rem', fontWeight:800, marginBottom:4 }}>
          Track Order 📍
        </div>
        <div style={{ color:'var(--gr)', fontSize:'.85rem', marginBottom:24 }}>
          Order #{id || 'KRV9823'} · ETA: 30–40 min
        </div>

        <div className="map-ph" style={{ borderRadius:16, marginBottom:20 }}>
          <div className="map-grid" />
          <div className="map-road-h" style={{ top:'40%' }} />
          <div className="map-road-v" style={{ left:'35%' }} />
          <div className="map-pin">📍</div>
          <div className="map-info">En route to customer · 1.2 km away</div>
        </div>

        <div className="track-steps">
          {steps.map((s, i) => (
            <div key={s.key} className={`ts ${s.state}`}>
              {i < steps.length - 1 && <div className="ts-line" />}
              <div className="ts-icon">{s.state === 'done' ? <FiCheck /> : s.icon}</div>
              <div className="ts-ct">
                <h4>{s.label}</h4>
                <p>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
