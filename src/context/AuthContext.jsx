/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRoutes } from '../api/routes';
import { clearAuthTokens, setAuthTokens } from '../api/client';

const AuthContext = createContext(null);
let restoreSessionPromise = null;

const restoreExistingSession = () => {
  const csrfToken = localStorage.getItem('csrfToken');
  if (!csrfToken) return Promise.resolve(null);

  if (!restoreSessionPromise) {
    restoreSessionPromise = apiRoutes.refresh(csrfToken)
      .then((response) => response.data)
      .finally(() => {
        restoreSessionPromise = null;
      });
  }

  return restoreSessionPromise;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = (data) => {
    setAuthTokens(data);
    setUser(data.user);
    return data.user;
  };

  const clearSession = () => {
    clearAuthTokens();
    setUser(null);
  };

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const session = await restoreExistingSession();
        if (mounted && session) applySession(session);
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const onUnauthorized = () => mounted && clearSession();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    restore();
    return () => {
      mounted = false;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const response = await apiRoutes.login({ email, password });
    return applySession(response.data);
  };

  const logout = async () => {
    try {
      await apiRoutes.logout(localStorage.getItem('csrfToken'));
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
