import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { logout } from './userService';

const Context = createContext();

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { auth: false, username: '' };
  });

  useEffect(() => {
    const currentStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
    currentStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const loginContext = (userData, remember = false) => {
    // Validate userData
    if (!userData || typeof userData !== 'object') {
      console.error('Invalid userData provided to loginContext:', userData);
      return;
    }

    const newUser = { ...userData, auth: true };
    setUser(newUser);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(newUser));
  };

  const logoutContext = async () => {
    setUser({ username: '', auth: false });
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('wishlist'); // Clear wishlist on logout
    localStorage.removeItem('readingList'); // Clear reading list on logout

    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axios.get('/api/v1/refresh-token', { withCredentials: true });
      const { accessToken } = response.data;
      setUser((prevUser) => ({ ...prevUser, accessToken }));
    } catch (error) {
      console.error('Failed to refresh access token', document.location, error);
      logoutContext();
    }
  };

  return (
    <Context.Provider value={{ user, loginContext, logoutContext, refreshAccessToken }}>
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };