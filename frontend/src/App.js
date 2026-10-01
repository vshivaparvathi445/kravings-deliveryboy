import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login        from './pages/Login';
import Register     from './pages/Register';
import ForgotPass   from './pages/ForgotPass';
import Dashboard    from './pages/Dashboard';
import ActiveOrders from './pages/ActiveOrders';
import NewRequests  from './pages/NewRequests';
import Earnings     from './pages/Earnings';
import History      from './pages/History';
import Profile      from './pages/Profile';
import TrackOrder   from './pages/TrackOrder';
import Support      from './pages/Support';
import PendingPage  from './pages/PendingPage';
import AppLayout    from './components/AppLayout';
import OnlineToggle  from './components/OnlineToggle';


/* ── Loading spinner ── */
function LoadingScreen() {
  return (
    <div className="loading-page">
      <div className="loading-logo">🍟</div>
      <div className="loading-text">Loading Kravings…</div>
    </div>
  );
}

/* ── Only logged-out users ── */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return children;
  // Redirect based on status
  if (user.status === 'active') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/pending" replace />;
}

/* ── Only logged-in + ACTIVE users ── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  // Pending / suspended / rejected → block dashboard
  if (user.status === 'pending')   return <Navigate to="/pending"   replace />;
  if (user.status === 'suspended') return <Navigate to="/suspended" replace />;
  if (user.status === 'rejected')  return <Navigate to="/rejected"  replace />;
  return children;
}

/* ── Pending users only ── */
function PendingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'active') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"            element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"         element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"  element={<PublicRoute><ForgotPass /></PublicRoute>} />

      {/* Pending / Suspended / Rejected screens */}
      <Route path="/pending"   element={<PendingRoute><PendingPage status="pending"   /></PendingRoute>} />
      <Route path="/suspended" element={<PendingRoute><PendingPage status="suspended" /></PendingRoute>} />
      <Route path="/rejected"  element={<PendingRoute><PendingPage status="rejected"  /></PendingRoute>} />

      {/* Private – ACTIVE users only */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index              element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="active"      element={<ActiveOrders />} />
        <Route path="new"         element={<NewRequests />} />
        <Route path="earnings"    element={<Earnings />} />
        <Route path="history"     element={<History />} />
        <Route path="profile"     element={<Profile />} />
        <Route path="track/:id"   element={<TrackOrder />} />
        <Route path="support"     element={<Support />} />
        <Route path="online-toggle" element={<OnlineToggle />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: '0.88rem' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
