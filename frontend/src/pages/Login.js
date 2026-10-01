import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.identifier) e.identifier = 'Please enter your mobile or email';
    if (!form.password)   e.password   = 'Please enter your password';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.identifier, form.password);

       

      toast.success('Welcome back to Kravings! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="al-logo">
          <div className="al-logo-icon">🍟</div>
          <div><div className="al-logo-text">Kravings</div><div className="al-logo-sub">Delivery Partner Portal</div></div>
        </div>
        <div className="al-hero">
          <span className="al-hero-img">🏍️</span>
          <h2>Deliver Fast,<br />Earn More Every Day</h2>
          <p>Join thousands of delivery partners earning great income with Kravings across Andhra Pradesh.</p>
        </div>
        <div className="al-stats">
          <div className="al-stat"><div className="al-stat-num">₹800+</div><div className="al-stat-lbl">Daily Avg</div></div>
          <div className="al-stat"><div className="al-stat-num">2,400+</div><div className="al-stat-lbl">Riders</div></div>
          <div className="al-stat"><div className="al-stat-num">4.8★</div><div className="al-stat-lbl">Rating</div></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h1>Welcome Back! 👋</h1>
          <p className="auth-sub">Login to your Kravings Delivery Partner account to start accepting orders.</p>

          <div className="info-banner">
            <FiUser style={{ flexShrink: 0, marginTop: 2 }} />
            Use your registered mobile number or email to login.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label>Mobile Number or Email</label>
              <div className="input-wrap">
                <input type="text" placeholder="+91 98765 43210 or email" value={form.identifier}
                  onChange={e => set('identifier', e.target.value)} />
                <FiUser className="icon" />
              </div>
              {errors.identifier && <div className="err-msg">{errors.identifier}</div>}
            </div>

            <div className="fg">
              <label>Password</label>
              <div className="pw-wrap">
                <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password}
                  onChange={e => set('password', e.target.value)} />
                <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <div className="err-msg">{errors.password}</div>}
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" />&nbsp;Logging in…</> : '🚀 Login to Dashboard'}
            </button>
          </form>

          <div className="auth-switch">
            New delivery partner? <Link to="/register">Register here →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
