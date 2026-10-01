import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('kravings_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('kravings_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { access_token, rider } = res.data;
    localStorage.setItem('kravings_token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(rider);
    return rider;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { access_token, rider } = res.data;
    localStorage.setItem('kravings_token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(rider);
    return rider;
  };

  const logout = () => {
    localStorage.removeItem('kravings_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
