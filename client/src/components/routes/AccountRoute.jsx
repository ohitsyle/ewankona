// client/src/components/routes/AccountRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";

export default function AccountRoute({ children }) {
  const { isLoggedin, userData, loadingUserData } = useContext(AppContext);

  if (loadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1340] text-white">
        Loading...
      </div>
    );
  }

  if (!isLoggedin) return <Navigate to="/login" />;

  const role = userData?.role;
  const accountType = userData?.accountType;

  // ✅ Users: student & employee
  if (
    accountType === "user" &&
    (role === "student" || role === "employee")
  ) {
    return children;
  }

  // ✅ Admins: treasury & accounting
  if (
    accountType === "admin" &&
    (role === "treasury" || role === "accounting")
  ) {
    return children;
  }

  // ❌ Everyone else
  return <Navigate to="/users-dashboard" replace />;
}
