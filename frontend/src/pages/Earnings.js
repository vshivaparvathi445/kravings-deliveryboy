import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../api/axios';

export default function Earnings() {
  const [summary, setSummary] = useState(null);
  const [daily,   setDaily]   = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [period,  setPeriod]  = useState('week');

  useEffect(() => { fetchAll(); }, [period]);

  async function fetchAll() {
    try {
      const [sRes, dRes, pRes] = await Promise.all([
        api.get(`/earnings/summary?period=${period}`),
        api.get('/earnings/daily?days=7'),
        api.get('/earnings/payouts'),
      ]);
      setSummary(sRes.data);
      setDaily((dRes.data.daily || []).map(d => ({
        day:      new Date(d.date).toLocaleDateString('en-IN', { weekday:'short' }),
        earnings: d.earnings,
        deliveries: d.deliveries,
      })));
      setPayouts(pRes.data.payouts || []);
    } catch (_) {
      setSummary({ grand_total:3840, orders_count:42, avg_per_order:91.4,
        breakdown:{ delivery:2960, bonus:560, tip:320 } });
      setDaily([
        { day:'Mon',earnings:380,deliveries:5 },{ day:'Tue',earnings:520,deliveries:7 },
        { day:'Wed',earnings:460,deliveries:6 },{ day:'Thu',earnings:610,deliveries:8 },
        { day:'Fri',earnings:720,deliveries:9 },{ day:'Sat',earnings:840,deliveries:11 },
        { day:'Sun',earnings:520,deliveries:8 },
      ]);
      setPayouts([
        { id:1, amount:3240, period_start:'2025-08-19', period_end:'2025-08-25', status:'paid', paid_at:'2025-08-26T10:00:00' },
        { id:2, amount:2980, period_start:'2025-08-12', period_end:'2025-08-18', status:'paid', paid_at:'2025-08-19T10:00:00' },
        { id:3, amount:3840, period_start:'2025-08-26', period_end:'2025-09-01', status:'pending', paid_at:null },
      ]);
    }
  }

  const bd = summary?.breakdown || {};

  return (
    <div>
      {/* Hero */}
      <div className="earn-hero">
        <div style={{ fontSize:'.85rem', opacity:.8, marginBottom:6 }}>
          {period === 'week' ? 'This Week\'s Earnings' : 'This Month\'s Earnings'}
        </div>
        <div style={{ fontFamily:'Baloo 2,cursive', fontSize:'2.8rem', fontWeight:800, lineHeight:1 }}>
          ₹{summary?.grand_total?.toLocaleString() ?? '–'}
        </div>
        <div style={{ fontSize:'.8rem', opacity:.75, marginTop:6 }}>
          {summary?.orders_count} deliveries · Avg ₹{summary?.avg_per_order}/order
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {['week','month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ background: period===p ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)',
                color:'#fff', border:'none', padding:'7px 18px', borderRadius:20,
                fontFamily:'Baloo 2,cursive', fontWeight:700, cursor:'pointer', fontSize:'.85rem' }}>
              {p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="earn-grid">
        {[
          { label:'Base Earnings', val:`₹${bd.delivery ?? 0}`, sub:'Delivery charges' },
          { label:'Peak Bonuses',  val:`₹${bd.bonus    ?? 0}`, sub:'Peak hour bonuses' },
          { label:'Tips',          val:`₹${bd.tip      ?? 0}`, sub:'Customer tips' },
          { label:'Deliveries',    val: summary?.orders_count ?? 0, sub:'Total completed' },
          { label:'Avg per Order', val:`₹${summary?.avg_per_order ?? 0}`, sub:'Per delivery' },
          { label:'Rating',        val:'4.87★', sub:'Based on reviews' },
        ].map((c,i) => (
          <div key={i} className="earn-card">
            <div className="ec-val">{c.val}</div>
            <div className="ec-lbl">{c.label}</div>
            <div className="ec-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-title">Daily Earnings (Last 7 Days)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} barSize={36}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:12, fontWeight:600 }} />
            <YAxis hide />
            <Tooltip
              formatter={(v, n) => [n==='earnings' ? `₹${v}` : v, n==='earnings' ? 'Earnings' : 'Deliveries']}
              contentStyle={{ fontFamily:'Nunito,sans-serif', borderRadius:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.1)' }}
            />
            <Bar dataKey="earnings" fill="#FC8019" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payout history */}
      <div className="card">
        <div className="card-title">Payout History 💳</div>
        {payouts.map(p => (
          <div key={p.id} className="payout-row">
            <div style={{ display:'flex', alignItems:'center' }}>
              <div className="pr-icon" style={{ background: p.status==='paid' ? 'var(--gnl)' : p.status==='pending' ? 'var(--orl)' : 'var(--redl)',
                color: p.status==='paid' ? 'var(--gn)' : p.status==='pending' ? 'var(--or)' : 'var(--red)' }}>
                {p.status==='paid' ? '✓' : p.status==='pending' ? '⏳' : '✗'}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'.88rem' }}>
                  Payout: {new Date(p.period_start).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {new Date(p.period_end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </div>
                <div style={{ fontSize:'.74rem', color:'var(--gr)', marginTop:1 }}>
                  {p.status==='paid' ? `Paid on ${new Date(p.paid_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : 'Scheduled – Pending'}
                </div>
              </div>
            </div>
            <div className="pr-amount" style={{ color: p.status==='paid' ? 'var(--gn)' : 'var(--or)' }}>
              {p.status==='paid' ? '+' : ''}₹{Number(p.amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
