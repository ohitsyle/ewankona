// client/src/context/AppContext.jsx
// Authentication context for user and admin state management
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);

  // Backend URL for API calls
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Check for existing auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      // Check for admin token
      const adminToken = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');

      if (adminToken && adminData && adminData !== 'undefined' && adminData !== 'null') {
        try {
          const parsedAdminData = JSON.parse(adminData);
          setUserData({
            ...parsedAdminData,
            accountType: 'admin'
          });
          setIsLoggedin(true);
          setLoadingUserData(false);
          return;
        } catch (parseError) {
          console.error('Failed to parse admin data, clearing invalid data:', parseError);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
        }
      }

      // Check for user token
      const userToken = localStorage.getItem('userToken');
      const userDataStored = localStorage.getItem('userData');

      if (userToken && userDataStored && userDataStored !== 'undefined' && userDataStored !== 'null') {
        try {
          const parsedUserData = JSON.parse(userDataStored);
          setUserData({
            ...parsedUserData,
            accountType: 'user'
          });
          setIsLoggedin(true);
          setLoadingUserData(false);
          return;
        } catch (parseError) {
          console.error('Failed to parse user data, clearing invalid data:', parseError);
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
        }
      }

      // No auth found
      setIsLoggedin(false);
      setUserData(null);
      setLoadingUserData(false);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedin(false);
      setUserData(null);
      setLoadingUserData(false);
    }
  };

  const loginUser = (data, token, isAdmin = false) => {
    if (isAdmin) {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(data));
      setUserData({ ...data, accountType: 'admin' });
    } else {
      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify(data));
      setUserData({ ...data, accountType: 'user' });
    }
    setIsLoggedin(true);
  };

  const logoutUser = () => {
    // Clear all auth data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');

    setUserData(null);
    setIsLoggedin(false);
  };

  const updateUserData = (newData) => {
    const accountType = userData?.accountType || 'user';

    if (accountType === 'admin') {
      localStorage.setItem('adminData', JSON.stringify(newData));
    } else {
      localStorage.setItem('userData', JSON.stringify(newData));
    }

    setUserData({ ...newData, accountType });
  };

  return (
    <AppContext.Provider
      value={{
        backendUrl,
        userData,
        isLoggedin,
        loadingUserData,
        loginUser,
        logoutUser,
        updateUserData,
        checkAuthStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
