import React, { useEffect, useState } from 'react';
import { FiUser, FiTruck, FiCreditCard, FiFileText, FiBarChart2, FiSave } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [perf,    setPerf]    = useState(null);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ first_name:'', last_name:'', city:'', current_password:'', new_password:'' });

  useEffect(() => {
    fetchPerf();
    if (user) setForm(f => ({ ...f, first_name: user.full_name?.split(' ')[0] || '', last_name: user.full_name?.split(' ').slice(1).join(' ') || '' }));
  }, [user]);

  async function fetchPerf() {
    try {
      const res = await api.get('/profile/performance');
      setPerf(res.data);
    } catch (_) {
      setPerf({ completion_rate:98, acceptance_rate:94, avg_rating:4.87, total_deliveries:420 });
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await api.put('/profile/', form);
      updateUser(res.data.rider);
      toast.success('Profile updated ✅');
      setEditing(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
  }

  const docs = [
    { label:'Driving Licence', status:'verified' },
    { label:'RC Book',         status:'verified' },
    { label:'Vehicle Insurance',status:'expired' },
    { label:'Aadhaar Card',    status:'verified' },
    { label:'PAN Card',        status:'verified' },
    { label:'Selfie',          status:'verified' },
  ];

  const dsMap = { verified:'ds-ok', expired:'ds-exp', pending:'ds-pend', rejected:'ds-exp' };
  const dsLabel = { verified:'✓ Valid', expired:'⚠ Expiring', pending:'⏳ Pending', rejected:'✗ Rejected' };

  return (
    <div>
      {/* Hero */}
      <div className="profile-hero">
        <div className="ph-avatar">{user?.full_name?.[0] || 'R'}</div>
        <div style={{ zIndex:1 }}>
          <div className="ph-name">{user?.full_name || 'Rider'}</div>
          <div className="ph-id">{user?.partner_id} · Since {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}</div>
          <div className="ph-badges">
            <div className="ph-badge gold">⭐ {perf?.avg_rating || 4.87} Rating</div>
            <div className="ph-badge">🏅 Gold Partner</div>
            <div className="ph-badge">🔥 {perf?.total_deliveries || 420} Deliveries</div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Personal Info */}
        <div className="pro-card">
          <div className="pro-card-title"><FiUser />Personal Info
            <button className="btn-icon" style={{ marginLeft:'auto', color:'var(--or)' }} onClick={() => setEditing(!editing)}>
              {editing ? '✕' : '✏️ Edit'}
            </button>
          </div>
          {editing ? (
            <form onSubmit={saveProfile}>
              <div className="fg-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="fg"><label>First Name</label><input value={form.first_name} onChange={e => setForm(p=>({...p,first_name:e.target.value}))} /></div>
                <div className="fg"><label>Last Name</label><input value={form.last_name} onChange={e => setForm(p=>({...p,last_name:e.target.value}))} /></div>
              </div>
              <div className="fg"><label>City</label>
                <select value={form.city} onChange={e => setForm(p=>({...p,city:e.target.value}))}>
                  {['Vijayawada','Guntur','Visakhapatnam','Tirupati','Nellore'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label>Current Password (to change password)</label><input type="password" value={form.current_password} onChange={e=>setForm(p=>({...p,current_password:e.target.value}))} placeholder="Leave blank to keep same" /></div>
              <div className="fg"><label>New Password</label><input type="password" value={form.new_password} onChange={e=>setForm(p=>({...p,new_password:e.target.value}))} placeholder="Min 8 characters" /></div>
              <button type="submit" className="btn-primary" style={{ padding:12, fontSize:'.9rem' }}>
                <FiSave /> Save Changes
              </button>
            </form>
          ) : (
            <>
              {[
                { l:'Full Name',   v: user?.full_name || '–' },
                { l:'Mobile',      v: user?.mobile    || '–' },
                { l:'Email',       v: user?.email     || '–' },
                { l:'City',        v: user?.city      || '–' },
                { l:'Partner ID',  v: user?.partner_id || '–' },
                { l:'Status',      v: user?.status    || '–' },
              ].map((r,i) => (
                <div key={i} className="info-row">
                  <span className="info-lbl">{r.l}</span>
                  <span className="info-val" style={r.l==='Status' ? { color:'var(--gn)', textTransform:'capitalize' } : {}}>{r.v}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Performance */}
        <div className="pro-card">
          <div className="pro-card-title"><FiBarChart2 />Performance</div>
          {[
            { label:'Acceptance Rate', val: perf?.acceptance_rate || 94, bar:'bar-gn', color:'var(--gn)' },
            { label:'Completion Rate', val: perf?.completion_rate || 98, bar:'bar-or', color:'var(--or)' },
            { label:'Customer Rating', val: Math.round((perf?.avg_rating || 4.87) / 5 * 100), bar:'bar-bl', color:'var(--bl)', display:`${perf?.avg_rating || 4.87}★` },
          ].map((p,i) => (
            <div key={i} className="perf-bar">
              <div className="perf-label">
                <span>{p.label}</span>
                <span style={{ color: p.color }}>{p.display || `${p.val}%`}</span>
              </div>
              <div className="bar-track"><div className={`bar-fill ${p.bar}`} style={{ width:`${p.val}%` }} /></div>
            </div>
          ))}
          <div style={{ marginTop:16, display:'flex', gap:12 }}>
            {[
              { label:'Total Orders', val: perf?.total_deliveries || 420 },
              { label:'Delivered',    val: perf?.delivered        || 412 },
              { label:'Cancelled',    val: perf?.cancelled        || 8   },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:'center', background:'var(--lt)', borderRadius:12, padding:14 }}>
                <div style={{ fontFamily:'Baloo 2,cursive', fontWeight:800, fontSize:'1.4rem' }}>{s.val}</div>
                <div style={{ fontSize:'.72rem', color:'var(--gr)', fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle */}
        <div className="pro-card">
          <div className="pro-card-title"><FiTruck />Vehicle Details</div>
          <div style={{ background:'var(--lt)', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ fontSize:'2.2rem' }}>🏍️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'.72rem', color:'var(--gr)', fontWeight:600 }}>Vehicle</div>
              <div style={{ fontWeight:700 }}>Honda Activa 6G</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'.72rem', color:'var(--gr)', fontWeight:600 }}>Reg No.</div>
              <div style={{ fontWeight:700 }}>AP39BZ4521</div>
            </div>
          </div>
          {[{ l:'Type', v:'Scooter' },{ l:'Year', v:'2022' },{ l:'Color', v:'Pearl White' }].map((r,i) => (
            <div key={i} className="info-row"><span className="info-lbl">{r.l}</span><span className="info-val">{r.v}</span></div>
          ))}
          <div style={{ marginTop:14 }}>
            <div className="info-row"><span className="info-lbl">Bank Account</span><span className="info-val">HDFC ••••4321</span></div>
            <div className="info-row"><span className="info-lbl">IFSC</span><span className="info-val">HDFC0001234</span></div>
          </div>
        </div>

        {/* Documents */}
        <div className="pro-card">
          <div className="pro-card-title"><FiFileText />Documents</div>
          {docs.map((d,i) => (
            <div key={i} className="doc-row">
              <span>{d.label}</span>
              <span className={`doc-status ${dsMap[d.status]}`}>{dsLabel[d.status]}</span>
            </div>
          ))}
          <button className="btn-primary" style={{ marginTop:16, padding:12, fontSize:'.88rem' }}
            onClick={() => toast.success('Opening document upload…')}>
            📎 Upload / Update Documents
          </button>
        </div>
      </div>

      <div style={{ textAlign:'center', marginTop:24 }}>
        <button onClick={logout} style={{ background:'none', border:'2px solid var(--red)', color:'var(--red)', padding:'11px 28px', borderRadius:30, fontFamily:'Baloo 2,cursive', fontSize:'.95rem', fontWeight:700, cursor:'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
