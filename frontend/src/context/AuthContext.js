import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('anikahon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('anikahon_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('anikahon_user', JSON.stringify(userData));
  };
  
  const loginAdmin = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('anikahon_admin', JSON.stringify(adminData));
  };
  
  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('anikahon_user');
  };
  
  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('anikahon_admin');
  };

  return (
    <AuthContext.Provider value={{ user, admin, loginUser, loginAdmin, logoutUser, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}