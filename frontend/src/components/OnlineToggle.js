// ═══ OnlineToggle.js ═══
// Swiggy-partner-app style ON/OFF switch.
// Place this file in: src/components/OnlineToggle.js
//
// Usage from src/pages/ActiveOrders.js (or your dashboard/layout file):
//   import OnlineToggle from '../components/OnlineToggle';
//   <OnlineToggle />

import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OnlineToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await api.get('/profile/');
      setIsOnline(!!res.data.is_online);
    } catch (error) {
      console.error('Failed to load online status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);

    // optimistic UI update — flip immediately, revert on failure
    const previous = isOnline;
    setIsOnline(!previous);

    try {
      const res = await api.put('/profile/toggle-online');
      setIsOnline(res.data.is_online);
      toast.success(
        res.data.is_online ? "You're Online! 🟢" : "You're Offline"
      );
    } catch (error) {
      setIsOnline(previous); // revert on error
      toast.error(error.response?.data?.error || 'Could not update status');
    } finally {
      setToggling(false);
    }
  }

  if (loading) return null;

  return (
    <div style={wrapperStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a' }}>
          {isOnline ? "You're Online" : "You're Offline"}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          {isOnline ? 'Receiving new orders' : 'Tap to go online'}
        </span>
      </div>

      <button
        onClick={handleToggle}
        disabled={toggling}
        aria-label="Toggle online status"
        style={{
          position: 'relative',
          width: 56,
          height: 30,
          borderRadius: 30,
          border: 'none',
          cursor: toggling ? 'not-allowed' : 'pointer',
          background: isOnline ? '#16a34a' : '#d1d5db',
          transition: 'background 0.25s ease',
          padding: 0,
          flexShrink: 0,
          opacity: toggling ? 0.7 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: isOnline ? 29 : 3,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.25s ease',
          }}
        />
      </button>
    </div>
  );
}

const wrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 18px',
  borderRadius: 16,
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: 16,
};