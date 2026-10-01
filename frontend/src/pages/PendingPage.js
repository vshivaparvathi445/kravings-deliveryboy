import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function PendingPage({ status }) {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // Auto-check status every 30 seconds
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.status === 'active') {
          window.location.href = '/dashboard';
        }
      } catch (_) {}
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await api.get('/auth/me');
      if (res.data.status === 'active') {
        window.location.href = '/dashboard';
      } else {
        alert('Your account is still under review. Please wait.');
      }
    } catch (_) {}
    setChecking(false);
  };

  const configs = {
    pending: {
      emoji:    '⏳',
      color:    '#FC8019',
      bg:       '#fff4ea',
      title:    'Application Under Review',
      subtitle: 'Your account is pending admin approval',
      message:  'Our team is verifying your documents and details. This usually takes 24–48 hours. You will receive an SMS once your account is approved.',
      steps: [
        { done: true,  icon: '✅', label: 'Application Submitted'       },
        { done: true,  icon: '✅', label: 'Documents Uploaded'          },
        { done: false, icon: '🔍', label: 'Admin Verification (In Progress)' },
        { done: false, icon: '🚀', label: 'Account Activated'           },
      ],
      showCheck: true,
    },
    suspended: {
      emoji:    '🚫',
      color:    '#ef4444',
      bg:       '#fef2f2',
      title:    'Account Suspended',
      subtitle: 'Your account has been temporarily suspended',
      message:  'Your account has been suspended due to a policy violation or complaint. Please contact our support team for more information and to resolve this issue.',
      steps: [],
      showCheck: false,
    },
    rejected: {
      emoji:    '❌',
      color:    '#ef4444',
      bg:       '#fef2f2',
      title:    'Application Rejected',
      subtitle: 'Your application could not be approved',
      message:  'Unfortunately your application has been rejected. This may be due to invalid documents or incomplete information. Please contact support or register again with correct details.',
      steps: [],
      showCheck: false,
    },
  };

  const cfg = configs[status] || configs.pending;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9fafb 0%, #fff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 48, height: 48, background: '#FC8019', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 6px 20px rgba(252,128,25,.3)' }}>🍟</div>
        <div>
          <div style={{ fontFamily: 'Baloo 2, cursive', fontSize: '1.6rem', fontWeight: 800, color: '#FC8019', lineHeight: 1 }}>Kravings</div>
          <div style={{ fontSize: '.72rem', color: '#6b7280' }}>Delivery Partner Portal</div>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '40px 36px',
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.1)',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        {/* Emoji icon */}
        <div style={{
          width: 90, height: 90, background: cfg.bg,
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '2.8rem',
          margin: '0 auto 24px',
          animation: status === 'pending' ? 'pulse 2s infinite' : 'none',
        }}>
          {cfg.emoji}
        </div>

        <h1 style={{ fontFamily: 'Baloo 2, cursive', fontSize: '1.7rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          {cfg.title}
        </h1>
        <p style={{ fontSize: '.9rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
          {cfg.subtitle}
        </p>
        <p style={{ fontSize: '.88rem', color: '#9ca3af', marginBottom: 28, lineHeight: 1.7 }}>
          {cfg.message}
        </p>

        {/* Partner info */}
        <div style={{ background: '#f9fafb', borderRadius: 14, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.85rem' }}>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Name</span>
            <span style={{ fontWeight: 700 }}>{user?.full_name || '–'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.85rem' }}>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Partner ID</span>
            <span style={{ fontWeight: 700, color: '#FC8019' }}>{user?.partner_id || '–'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Status</span>
            <span style={{
              fontWeight: 700, padding: '2px 12px', borderRadius: 20, fontSize: '.78rem',
              background: cfg.bg, color: cfg.color,
            }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        {/* Steps for pending */}
        {cfg.steps.length > 0 && (
          <div style={{ marginBottom: 28, textAlign: 'left' }}>
            {cfg.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? '#f0fdf4' : i === 2 ? '#fff4ea' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem',
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '.88rem', fontWeight: 600,
                  color: step.done ? '#16a34a' : i === 2 ? '#FC8019' : '#9ca3af',
                }}>
                  {step.label}
                  {i === 2 && <span style={{ fontSize: '.75rem', marginLeft: 6, animation: 'blink 1s infinite' }}>●</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cfg.showCheck && (
            <button
              onClick={checkNow}
              disabled={checking}
              style={{
                background: '#FC8019', color: '#fff', border: 'none',
                padding: '13px 20px', borderRadius: 13,
                fontFamily: 'Baloo 2, cursive', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(252,128,25,.3)',
                opacity: checking ? .7 : 1,
              }}
            >
              {checking ? '⏳ Checking…' : '🔄 Check Approval Status'}
            </button>
          )}

          <button
            onClick={() => window.open('tel:+911800000000')}
            style={{
              background: '#eff6ff', color: '#3b82f6', border: '1.5px solid #bfdbfe',
              padding: '12px 20px', borderRadius: 13,
              fontFamily: 'Baloo 2, cursive', fontWeight: 700, fontSize: '.95rem',
              cursor: 'pointer',
            }}
          >
            📞 Contact Support
          </button>

          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            style={{
              background: 'none', color: '#6b7280',
              border: '1.5px solid #e5e7eb',
              padding: '11px 20px', borderRadius: 13,
              fontFamily: 'Baloo 2, cursive', fontWeight: 700, fontSize: '.92rem',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        {/* Auto-check note */}
        {status === 'pending' && (
          <p style={{ marginTop: 20, fontSize: '.76rem', color: '#9ca3af' }}>
            🔄 This page automatically checks every 30 seconds and will redirect you once approved.
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
