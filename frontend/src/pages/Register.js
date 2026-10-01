import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiPhone, FiMail, FiCreditCard, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

const VEHICLES = [
  { key: 'bike',    emoji: '🏍️', label: 'Motorcycle' },
  { key: 'scooter', emoji: '🛵', label: 'Scooter'    },
  { key: 'bicycle', emoji: '🚲', label: 'Bicycle'    },
  { key: 'ev',      emoji: '⚡', label: 'E-Scooter'  },
];

const DOCS = [
  { key: 'driving_licence', icon: '🪪', label: 'Driving Licence' },
  { key: 'rc_book',         icon: '📄', label: 'RC Book'         },
  { key: 'insurance',       icon: '🛡️', label: 'Vehicle Insurance'},
  { key: 'aadhaar',         icon: '🪧', label: 'Aadhaar Card'    },
  { key: 'pan',             icon: '💳', label: 'PAN Card'        },
  { key: 'selfie',          icon: '📸', label: 'Profile Photo'   },
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [uploaded, setUploaded] = useState({});
  const [vehicle, setVehicle]   = useState('bike');

  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', mobile:'', city:'', dob:'', password:'', confirm:'',
    brand_model:'', reg_number:'', year:'', color:'', account_number:'', ifsc_code:'', bank_name:'',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: ''})); };

  // ── Validation ──
  function validateStep1() {
    const e = {};
    if (!form.first_name) e.first_name = 'Required';
    if (!form.last_name)  e.last_name  = 'Required';
    if (!form.mobile || form.mobile.replace(/\D/g,'').length < 10) e.mobile = 'Enter valid 10-digit number';
    if (!form.email)      e.email      = 'Required';
    if (!form.city)       e.city       = 'Required';
    if (form.password.length < 8)       e.password  = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm   = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  }
  function validateStep2() {
    const e = {};
    if (!form.brand_model) e.brand_model = 'Required';
    if (!form.reg_number)  e.reg_number  = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  // ── Upload doc ──
  async function handleUpload(docKey, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append('doc_type', docKey);
    fd.append('file', file);
    try {
      // Before JWT exists, store file locally and upload after register
      setUploaded(p => ({ ...p, [docKey]: file.name }));
      toast.success(`${docKey.replace('_', ' ')} ready ✓`);
    } catch (e) {
      toast.error('Upload failed');
    }
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!document.getElementById('terms-check').checked) {
      toast.error('Please accept the Terms & Conditions'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        vehicle_type: vehicle,
        dob: form.dob || undefined,
      };
      await register(payload);
      toast.success('Registration submitted! Pending admin approval 🎉');
      navigate('/pending');
    } catch (e) {
      const status = e.response?.status;
      const serverMsg = e.response?.data?.error || e.response?.data?.message;
      let msg = serverMsg;
      if (!msg) {
        if (status === 409) msg = 'Email or mobile number already registered';
        else if (status === 400) msg = 'Please fill all required fields correctly';
        else if (status === 500) msg = 'Server error. Make sure backend is running';
        else if (!e.response)   msg = 'Cannot connect to server. Check backend is running on port 5000';
        else msg = 'Registration failed. Please try again';
      }
      toast.error(msg);
      console.error('Register error details:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step indicator ──
  const StepDots = () => (
    <div className="step-row">
      {[1,2,3,4].map((s, i) => (
        <React.Fragment key={s}>
          <div className={`step-dot ${s < step ? 'done' : s === step ? 'active' : 'pending'}`}>
            {s < step ? <FiCheck size={12} /> : s}
          </div>
          {i < 3 && <div className={`step-line ${s < step ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="al-logo">
          <div className="al-logo-icon">🍟</div>
          <div><div className="al-logo-text">Kravings</div><div className="al-logo-sub">Delivery Partner Portal</div></div>
        </div>
        <div className="al-hero">
          <span className="al-hero-img">💰</span>
          <h2>Start Earning Today</h2>
          <p>Register in minutes. Flexible hours, great pay, weekly payouts.</p>
        </div>
        <div className="al-stats">
          <div className="al-stat"><div className="al-stat-num">30 min</div><div className="al-stat-lbl">Registration</div></div>
          <div className="al-stat"><div className="al-stat-num">Same Day</div><div className="al-stat-lbl">Activation</div></div>
          <div className="al-stat"><div className="al-stat-num">Weekly</div><div className="al-stat-lbl">Payouts</div></div>
        </div>
      </div>

      <div className="auth-right" style={{ width: 520, overflowY: 'auto' }}>
        <div className="auth-box" style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 14 }}>
            <Link to="/login" style={{ color: 'var(--or)', fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
          <h1>Become a Partner 🏍️</h1>
          <p className="auth-sub">Fill in your details to register as a Kravings delivery partner.</p>
          <StepDots />

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <>
              <div className="fg-row">
                <div className="fg">
                  <label>First Name</label>
                  <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Ravi" />
                  {errors.first_name && <div className="err-msg">{errors.first_name}</div>}
                </div>
                <div className="fg">
                  <label>Last Name</label>
                  <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Kumar" />
                  {errors.last_name && <div className="err-msg">{errors.last_name}</div>}
                </div>
              </div>
              <div className="fg">
                <label>Mobile Number</label>
                <div className="input-wrap">
                  <input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 98765 43210" />
                  <FiPhone className="icon" />
                </div>
                {errors.mobile && <div className="err-msg">{errors.mobile}</div>}
              </div>
              <div className="fg">
                <label>Email Address</label>
                <div className="input-wrap">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ravi@example.com" />
                  <FiMail className="icon" />
                </div>
                {errors.email && <div className="err-msg">{errors.email}</div>}
              </div>
              <div className="fg-row">
                <div className="fg">
                  <label>City</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)}>
                    <option value="">Select city</option>
                    {['Vijayawada','Guntur','Visakhapatnam','Tirupati','Nellore','Kakinada'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {errors.city && <div className="err-msg">{errors.city}</div>}
                </div>
                <div className="fg">
                  <label>Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                </div>
              </div>
              <div className="fg">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                  <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <div className="err-msg">{errors.password}</div>}
              </div>
              <div className="fg">
                <label>Confirm Password</label>
                <div className="pw-wrap">
                  <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password" />
                </div>
                {errors.confirm && <div className="err-msg">{errors.confirm}</div>}
              </div>
              <button className="btn-primary" onClick={next}>Continue to Vehicle Info →</button>
              <div className="auth-switch">Already registered? <Link to="/login">Login here</Link></div>
            </>
          )}

          {/* ── STEP 2: Vehicle ── */}
          {step === 2 && (
            <>
              <div className="fg"><label>Vehicle Type</label>
                <div className="vehicle-grid">
                  {VEHICLES.map(v => (
                    <div key={v.key} className={`v-opt ${vehicle === v.key ? 'sel' : ''}`} onClick={() => setVehicle(v.key)}>
                      <div style={{ fontSize: '1.8rem' }}>{v.emoji}</div>
                      <span className="v-lbl">{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="fg"><label>Brand & Model</label>
                <input value={form.brand_model} onChange={e => set('brand_model', e.target.value)} placeholder="Honda Activa 6G" />
                {errors.brand_model && <div className="err-msg">{errors.brand_model}</div>}
              </div>
              <div className="fg-row">
                <div className="fg"><label>Registration No.</label>
                  <input value={form.reg_number} onChange={e => set('reg_number', e.target.value.toUpperCase())} placeholder="AP39BZ4521" />
                  {errors.reg_number && <div className="err-msg">{errors.reg_number}</div>}
                </div>
                <div className="fg"><label>Year</label>
                  <select value={form.year} onChange={e => set('year', e.target.value)}>
                    <option value="">Year</option>
                    {[2024,2023,2022,2021,2020,2019,2018,2017].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg"><label>Color</label>
                <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="Pearl White" />
              </div>
              <div className="fg"><label>Bank Account Number</label>
                <div className="input-wrap">
                  <input value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="Your account number" />
                  <FiCreditCard className="icon" />
                </div>
              </div>
              <div className="fg-row">
                <div className="fg"><label>IFSC Code</label>
                  <input value={form.ifsc_code} onChange={e => set('ifsc_code', e.target.value.toUpperCase())} placeholder="HDFC0001234" />
                </div>
                <div className="fg"><label>Bank Name</label>
                  <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="HDFC Bank" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={next}>Continue to Documents →</button>
              </div>
            </>
          )}

          {/* ── STEP 3: Documents ── */}
          {step === 3 && (
            <>
              <p style={{ fontSize: '.84rem', color: 'var(--gr)', marginBottom: 16, fontWeight: 600 }}>
                Upload clear photos. All documents are encrypted and kept secure.
              </p>
              <div className="upload-grid">
                {DOCS.map(d => (
                  <label key={d.key} className={`upload-box ${uploaded[d.key] ? 'done' : ''}`}>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                      onChange={e => handleUpload(d.key, e.target.files[0])} />
                    <span className="ub-icon">{uploaded[d.key] ? '✅' : d.icon}</span>
                    <p>{d.label}</p>
                    <span>{uploaded[d.key] ? 'Uploaded ✓' : 'JPG, PNG or PDF'}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                <input id="terms-check" type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--or)', marginTop: 2, flexShrink: 0 }} />
                <label htmlFor="terms-check" style={{ fontSize: '.82rem', color: 'var(--gr)', fontWeight: 600, lineHeight: 1.5 }}>
                  I agree to Kravings' <a href="#" style={{ color: 'var(--or)', fontWeight: 700 }}>Terms & Conditions</a> and confirm all information is accurate.
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <><div className="spinner" />&nbsp;Submitting…</> : '✓ Submit Application'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}