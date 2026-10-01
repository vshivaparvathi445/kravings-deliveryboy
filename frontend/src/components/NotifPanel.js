import React, { useEffect, useState } from 'react';
import { FiX, FiTruck, FiDollarSign, FiStar, FiInfo, FiAlertCircle } from 'react-icons/fi';
import api from '../api/axios';

export default function NotifPanel({ open, onClose }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (open) fetchNotifs();
  }, [open]);

  async function fetchNotifs() {
    try {
      const res = await api.get('/notifications/');
      setNotifs(res.data.notifications || []);
    } catch (_) {}
  }

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (_) {}
  }

  async function markAll() {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  }

  const iconMap = {
    order:   { icon: <FiTruck />,       cls: 'ni-or' },
    payment: { icon: <FiDollarSign />,  cls: 'ni-gn' },
    alert:   { icon: <FiAlertCircle />, cls: 'ni-red' },
    system:  { icon: <FiInfo />,        cls: 'ni-bl' },
  };

  // Sample fallback if API not connected
  const displayNotifs = notifs.length > 0 ? notifs : [
    { id:1, title:'New order assigned!', body:'Pickup from Burger Palace, 2.1km away', notif_type:'order', is_read:false, created_at: new Date().toISOString() },
    { id:2, title:'₹52 credited to wallet', body:'Order #KRV9821 delivery bonus received', notif_type:'payment', is_read:false, created_at: new Date().toISOString() },
    { id:3, title:'Customer rated you 5★', body:'"Very fast delivery, thank you!" – Ramesh K.', notif_type:'alert', is_read:true, created_at: new Date().toISOString() },
    { id:4, title:'Peak hour bonus active', body:'Earn ₹20 extra per delivery 6PM–9PM today', notif_type:'system', is_read:true, created_at: new Date().toISOString() },
  ];

  return (
    <div className={`notif-panel ${open ? 'open' : ''}`}>
      <div className="np-hd">
        <h3>Notifications</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={markAll} style={{ fontSize: '.76rem', fontWeight: 700, color: 'var(--or)' }}>Mark all read</button>
          <button className="btn-icon" onClick={onClose}><FiX /></button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {displayNotifs.map(n => {
          const { icon, cls } = iconMap[n.notif_type] || iconMap.system;
          return (
            <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
              <div className={`ni-icon ${cls}`}>{icon}</div>
              <div>
                <div className="ni-title">{n.title}</div>
                <div className="ni-body">{n.body}</div>
                <div className="ni-time">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
