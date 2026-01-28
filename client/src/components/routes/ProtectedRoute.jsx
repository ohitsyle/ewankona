import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { isLoggedin, userData, loadingUserData } = useContext(AppContext);

  console.log('🔒 ProtectedRoute check:', {
    isLoggedin,
    loadingUserData,
    accountType: userData?.accountType,
    isActive: userData?.isActive,
    userData
  });

  // While checking auth status
  if (loadingUserData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  // Check 1: User logged in?
  if (!isLoggedin) {
    console.log('❌ Not logged in, redirecting to /login');
    return <Navigate to="/login" />;
  }

  // Check 2: Only for users (not admins)
  if (userData?.accountType === "user") {
    console.log('👤 User account detected, checking isActive status');

    // Check 3: Has changed PIN?
    // Only redirect if isActive is explicitly false, not if undefined
    if (userData.isActive === false) {
      console.log('⚠️ User not active, redirecting to /change-pin');
      return <Navigate to="/change-pin" />;
    }
  }

  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;