import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/client';

const AuthContext = createContext();

// Local profile (name + role) stored in the browser — no login server.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    api.auth.me().then((me) => {
      setUser(me);
      setIsLoadingAuth(false);
    });
  }, []);

  const updateUser = async (data) => {
    const me = await api.auth.updateMe(data);
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: true,
      isLoadingAuth,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
