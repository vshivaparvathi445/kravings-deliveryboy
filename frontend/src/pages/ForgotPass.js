import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPhone, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ForgotPass() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp]       = useState('');
  const [pass, setPass]     = useState('');
  const [conf, setConf]     = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    if (!mobile) { toast.error('Enter your mobile number'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { mobile, purpose: 'forgot_password' });
      toast.success('OTP sent! ' + (res.data.dev_otp ? `(dev: ${res.data.dev_otp})` : ''));
      setStep(2);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  }

  async function resetPassword() {
    if (!otp || !pass || !conf) { toast.error('Fill all fields'); return; }
    if (pass !== conf) { toast.error('Passwords do not match'); return; }
    if (pass.length < 8) { toast.error('Min 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { mobile, otp, new_password: pass });
      toast.success('Password reset! Please login 🎉');
      navigate('/login');
    } catch (e) { toast.error(e.response?.data?.error || 'Reset failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="al-logo">
          <div className="al-logo-icon">🍟</div>
          <div><div className="al-logo-text">Kravings</div><div className="al-logo-sub">Delivery Partner Portal</div></div>
        </div>
        <div className="al-hero">
          <span className="al-hero-img">🔒</span>
          <h2>Reset Your Password</h2>
          <p>We'll send an OTP to your registered mobile to help you reset.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <div style={{ marginBottom: 16 }}>
            <Link to="/login" style={{ color: 'var(--or)', fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>← Back to Login</Link>
          </div>
          <h1>Forgot Password 🔑</h1>
          <p className="auth-sub">Enter your registered mobile number to receive an OTP.</p>

          {step === 1 && (
            <>
              <div className="fg">
                <label>Registered Mobile Number</label>
                <div className="input-wrap">
                  <input type="tel" placeholder="+91 98765 43210" value={mobile} onChange={e => setMobile(e.target.value)} />
                  <FiPhone className="icon" />
                </div>
              </div>
              <button className="btn-primary" onClick={sendOTP} disabled={loading}>
                {loading ? <><div className="spinner" />&nbsp;Sending…</> : '📩 Send OTP'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="info-banner">
                <FiPhone style={{ flexShrink: 0 }} />
                OTP sent to {mobile}. Check your messages.
              </div>
              <div className="fg">
                <label>Enter OTP</label>
                <input type="text" placeholder="6-digit OTP" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value)}
                  style={{ letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center', fontWeight: 700 }} />
              </div>
              <div className="fg">
                <label>New Password</label>
                <div className="pw-wrap">
                  <input type="password" placeholder="New password" value={pass} onChange={e => setPass(e.target.value)} />
                </div>
              </div>
              <div className="fg">
                <label>Confirm Password</label>
                <div className="pw-wrap">
                  <input type="password" placeholder="Confirm password" value={conf} onChange={e => setConf(e.target.value)} />
                </div>
              </div>
              <button className="btn-primary" onClick={resetPassword} disabled={loading}>
                {loading ? <><div className="spinner" />&nbsp;Resetting…</> : '🔒 Reset Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
