// NewOrderModal.js
import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiClock, FiDollarSign, FiBox } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NewOrderModal({ order, onAccept, onDecline }) {
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(id); onDecline(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  async function accept() {
    setLoading(true);
    try {
      await api.post(`/orders/${order.id}/accept`);
      onAccept();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not accept order');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-ring"><FiTruck /></div>
        <h3 style={{ textAlign: 'center', marginBottom: 4 }}>New Delivery Request!</h3>
        <p style={{ textAlign: 'center', fontSize: '.84rem', color: 'var(--gr)', marginBottom: 20 }}>
          Accept within <strong style={{ color: timer < 10 ? 'var(--red)' : 'var(--or)' }}>{timer}s</strong> or it will expire
        </p>

        <div style={{ background: 'var(--lt)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--or)', marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--or)', textTransform: 'uppercase' }}>Pickup</div>
              <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{order.pickup_address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gn)', marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--gn)', textTransform: 'uppercase' }}>Delivery</div>
              <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{order.drop_address}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { icon: <FiMapPin />, val: `${order.distance_km} km` },
            { icon: <FiClock />,  val: order.estimated_time },
            { icon: <FiDollarSign />, val: `₹${order.total_earn}`, color: 'var(--gn)' },
            { icon: <FiBox />,    val: `${order.item_count} items` },
          ].map((c, i) => (
            <div key={i} className="meta-chip" style={c.color ? { color: c.color, fontWeight: 700 } : {}}>
              {c.icon}&nbsp;{c.val}
            </div>
          ))}
        </div>

        {/* timer ring */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--bd)" strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--or)" strokeWidth="4"
              strokeDasharray={`${(timer / 30) * 150.8} 150.8`}
              strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray .9s' }} />
            <text x="28" y="33" textAnchor="middle" fontFamily="Baloo 2, cursive" fontWeight="800" fontSize="14" fill="var(--or)">{timer}</text>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-success" style={{ flex: 2, padding: 14, fontSize: '1rem' }} onClick={accept} disabled={loading}>
            {loading ? <div className="spinner" style={{ margin: '0 auto' }} /> : '✓ Accept Order'}
          </button>
          <button className="btn-danger" style={{ flex: 1, padding: 14, fontSize: '.9rem' }} onClick={onDecline}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
