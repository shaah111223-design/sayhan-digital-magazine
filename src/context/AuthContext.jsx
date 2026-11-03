import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

async function safeApiRequest(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(`Unable to connect to the server (${networkErr.message}). Please ensure the backend is running.`);
  }

  const rawText = await res.text();
  let data = {};
  
  try {
    if (rawText && rawText.trim().length > 0) {
      data = JSON.parse(rawText);
    }
  } catch {
    throw new Error(`Server returned unexpected non-JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status code ${res.status}`);
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('yr_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('yr_auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      safeApiRequest('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(data => {
          setUser(data.user);
          localStorage.setItem('yr_auth_user', JSON.stringify(data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Normal User Login
  const login = async (email, password) => {
    const data = await safeApiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('yr_auth_token', data.token);
    localStorage.setItem('yr_auth_user', JSON.stringify(data.user));
    return data;
  };

  // Dedicated Super Admin Login (Sayhan)
  const adminLogin = async (email, password) => {
    const data = await safeApiRequest('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('yr_auth_token', data.token);
    localStorage.setItem('yr_auth_user', JSON.stringify(data.user));
    return data;
  };

  // User Registration
  const register = async (fullName, email, phone, password) => {
    const data = await safeApiRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, phone, password })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('yr_auth_token', data.token);
    localStorage.setItem('yr_auth_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('yr_auth_token');
    localStorage.removeItem('yr_auth_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await safeApiRequest('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data.user);
      localStorage.setItem('yr_auth_user', JSON.stringify(data.user));
    } catch (e) {
      console.warn('Failed to refresh user:', e);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    adminLogin,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
