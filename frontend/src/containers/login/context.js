import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { logout } from './userService';

const Context = createContext();
const SECRET_KEY = process.env.REACT_APP_STORAGE_SECRET;

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
        try {
            const bytes = CryptoJS.AES.decrypt(savedUser, SECRET_KEY);
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch {
            return { auth: false, username: '' };
        }
    }
    return { auth: false, username: '' };
  });

  const loginContext = (userData, remember = false) => {
    if (!userData || typeof userData !== 'object') return;
    const newUser = { ...userData, auth: true };
    setUser(newUser);
    
    // Mã hóa trước khi lưu
    const storage = remember ? localStorage : sessionStorage;
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(newUser), SECRET_KEY).toString();
    storage.setItem('user', encryptedData);
  };

  const logoutContext = async () => {
    setUser({ username: '', auth: false });
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('wishlist'); 
    localStorage.removeItem('readingList'); 

    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Context.Provider value={{ user, loginContext, logoutContext }}>
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };