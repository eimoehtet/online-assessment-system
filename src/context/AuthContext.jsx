/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { apiRoutes } from '../api/routes';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return savedUser && token ? JSON.parse(savedUser) : null;
  });
  const [loading] = useState(false);

  const login = async (email, password) => {
    const response = await apiRoutes.login({ email, password });
    const { user, token } = response.data;

    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);

    return user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
