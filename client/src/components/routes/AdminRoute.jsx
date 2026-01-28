// client/src/components/routes/AdminRoute.jsx
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppContext } from "../../context/AppContext.jsx";

export default function AdminRoute({ children, allowedRoles }) {
  const { userData, isLoggedin, loadingUserData } = useContext(AppContext);
  const location = useLocation();

  if (loadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1340]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isLoggedin) {
    return <Navigate to="/login" replace />;
  }

  if (userData?.accountType !== "admin") {
    return <Navigate to="/users-dashboard" replace />;
  }

  const validAdminRoles = [
    "treasury",
    "accounting",
    "sysad",
    "motorpool",
    "merchant"
  ];

  if (!validAdminRoles.includes(userData?.role)) {
    return <Navigate to="/users-dashboard" replace />;
  }

  // If route specifies allowed roles, enforce it
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    const roleRedirects = {
      treasury: "/treasury/dashboard",
      accounting: "/accounting/home",
      sysad: "/sysad/dashboard",
      motorpool: "/motorpool/dashboard",
      merchant: "/merchant/dashboard"
    };

    return <Navigate to={roleRedirects[userData.role]} replace />;
  }

  // ✅ Do NOT force redirect based on path anymore
  // This allows /treasury/* and /accounting/* to be shared

  return children;
}
