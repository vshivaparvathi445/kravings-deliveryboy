import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import {
  FiHome, FiTruck, FiBell, FiDollarSign, FiClock,
  FiUser, FiHeadphones, FiChevronLeft, FiChevronRight,
  FiLogOut, FiMapPin
} from 'react-icons/fi';
import NewOrderModal from './NewOrderModal';
import NotifPanel   from './NotifPanel';

export default function AppLayout() {
  const { user, logout, updateUser } = useAuth();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline]   = useState(user?.is_online || false);
  const [showNotif, setShowNotif] = useState(false);
  const [newOrder, setNewOrder]   = useState(null);
  const [unread, setUnread]       = useState(0);
  const [activeCount, setActive]  = useState(0);
  const [newCount, setNewC]       = useState(0);

  // Keep a ref mirror of newOrder so the polling interval (set up once)
  // always sees the CURRENT value instead of a stale closure over null.
  const newOrderRef = useRef(null);
  useEffect(() => { newOrderRef.current = newOrder; }, [newOrder]);

  // Track order ids the rider has declined so they don't pop up again.
  const declinedIdsRef = useRef(new Set());

  // Poll for new orders every 15s
  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, 15000);
    return () => clearInterval(id);
  }, []);

  async function fetchCounts() {
    try {
      const [actRes, newRes, notifRes] = await Promise.all([
        api.get('/orders/active'),
        api.get('/orders/new'),
        api.get('/notifications/?unread_only=true'),
      ]);
      setActive(actRes.data.orders.length);
      setNewC(newRes.data.orders.length);
      setUnread(notifRes.data.unread_count || 0);

      // Only show the modal if:
      //  - there's no modal currently showing (checked via ref, not stale state)
      //  - the order hasn't already been declined this session
      if (!newOrderRef.current) {
        const candidate = newRes.data.orders.find(
          (o) => !declinedIdsRef.current.has(o.id)
        );
        if (candidate) {
          setNewOrder(candidate);
        }
      }
    } catch (_) {}
  }

  async function handleToggleOnline() {
    try {
      const res = await api.put('/profile/toggle-online');
      const next = res.data.is_online;
      setIsOnline(next);
      updateUser({ is_online: next });
      toast.success(next ? 'You are now Online 🟢' : 'You are now Offline 🔴');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update status');
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const nav = [
    { to: '/dashboard', icon: <FiHome />,       label: 'Dashboard' },
    { to: '/active',    icon: <FiTruck />,       label: 'Active Orders',   badge: activeCount },
    { to: '/new',       icon: <FiBell />,        label: 'New Requests',    badge: newCount },
    { to: '/earnings',  icon: <FiDollarSign />,  label: 'Earnings',        section: 'Finance' },
    { to: '/history',   icon: <FiClock />,       label: 'History' },
    { to: '/profile',   icon: <FiUser />,        label: 'My Profile',      section: 'Account' },
    { to: '/support',   icon: <FiHeadphones />,  label: 'Support' },
  ];

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sb-brand">
          <div className="sb-logo">🍟</div>
          {!collapsed && (
            <div>
              <div className="sb-title">Kravings</div>
              <div className="sb-sub">Delivery Partner</div>
            </div>
          )}
        </div>

        <nav className="sb-nav">
          {nav.map((item, i) => (
            <React.Fragment key={item.to}>
              {item.section && !collapsed && (
                <div className="sb-section">{item.section}</div>
              )}
              {i === 3 && !collapsed && <div className="sb-section">Finance</div>}
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        <div className="sb-bottom">
          <div className="sb-profile" onClick={() => navigate('/profile')}>
            <div className="sb-avatar">
              {user?.full_name?.[0] || 'R'}
            </div>
            {!collapsed && (
              <div>
                <div className="sb-pname">{user?.full_name || 'Rider'}</div>
                <div className="sb-pid">{user?.partner_id}</div>
              </div>
            )}
          </div>
          <button
            className="btn-icon"
            style={{ width: '100%', color: 'rgba(255,255,255,.4)', marginTop: 6 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <FiChevronRight /> : <><FiChevronLeft /> &nbsp; Collapse</>}
          </button>
          <button
            className="btn-icon"
            style={{ width: '100%', color: 'rgba(255,255,255,.4)', marginTop: 4 }}
            onClick={() => { logout(); navigate('/login'); toast.success('Logged out!'); }}
          >
            <FiLogOut /> {!collapsed && <>&nbsp; Logout</>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="tb-greeting">
            <h2>{greeting()}, {user?.full_name?.split(' ')[0] || 'Rider'}! 👋</h2>
            <p>{activeCount > 0 ? `${activeCount} active deliveries` : 'No active deliveries'}</p>
          </div>
          <div className="tb-right">
            <div className="online-toggle" onClick={handleToggleOnline}>
              <div className={`toggle-dot ${isOnline ? 'online' : ''}`} />
              <span className={`toggle-label ${isOnline ? 'online' : ''}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button className="notif-btn" onClick={() => setShowNotif(!showNotif)}>
              <FiBell />
              {unread > 0 && <div className="notif-dot" />}
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* NOTIFICATION PANEL */}
      <NotifPanel open={showNotif} onClose={() => setShowNotif(false)} />

      {/* NEW ORDER MODAL */}
      {newOrder && (
        <NewOrderModal
          order={newOrder}
          onAccept={() => { setNewOrder(null); fetchCounts(); toast.success('Order accepted! 🏍️'); navigate('/active'); }}
          onDecline={() => {
            declinedIdsRef.current.add(newOrder.id);
            setNewOrder(null);
            toast('Order declined');
          }}
        />
      )}
    </div>
  );
}