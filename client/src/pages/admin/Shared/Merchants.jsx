// client/src/pages/admin/Shared/Merchants.jsx
// Shared Merchants page for Treasury and Accounting modules
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { getMerchants, updateMerchantStatus } from "../../../services/treasuryApi";
import { toast } from "react-toastify";

import Header from "../../../components/layouts/Header";
import Footer from "../../../components/layouts/Footer";
import Navbar from "../../../components/layouts/Navbar";

export default function Merchants() {
  const { theme, isDarkMode } = useTheme();
  const location = useLocation();
  const isTreasury = location.pathname.startsWith("/treasury");

  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        ...(filterStatus !== "" && { isActive: filterStatus === "active" })
      };

      const response = await getMerchants(params);
      setMerchants(response.merchants || response.data || []);
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMerchants();
  };

  const handleToggleStatus = async (merchantId, currentStatus) => {
    try {
      await updateMerchantStatus(merchantId, !currentStatus);
      toast.success("Merchant status updated");
      fetchMerchants();
    } catch (error) {
      console.error("Failed to update merchant status:", error);
      toast.error("Failed to update merchant status");
    }
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        <Navbar />

        {/* Page Header */}
        <div
          className="mb-5 p-3 rounded-lg"
          style={{
            background: `rgba(${baseColor}, 0.1)`,
            borderBottom: `2px solid ${theme.accent.primary}`,
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.accent.primary }}
          >
            🛒 Merchants Management
          </h1>
        </div>

        {/* Filters */}
        <div
          className="mb-4 p-4 rounded-lg"
          style={{
            background: theme.bg.card,
            border: `1px solid rgba(${baseColor}, 0.2)`
          }}
        >
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="flex-1 px-3 py-2 rounded-md outline-none"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={handleSearch}
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
              }}
              className="px-6 py-2 rounded-md font-semibold hover:opacity-80 transition"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Merchants Grid */}
        {loading ? (
          <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
            Loading merchants...
          </div>
        ) : merchants.length === 0 ? (
          <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
            No merchants found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchants.map((merchant) => (
              <div
                key={merchant._id}
                className="p-4 rounded-lg"
                style={{
                  background: theme.bg.card,
                  border: `1px solid rgba(${baseColor}, 0.2)`
                }}
              >
                {/* Merchant Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>
                    {merchant.name || "Unnamed Merchant"}
                  </h3>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: merchant.isActive ? '#10B981' : '#EF4444',
                      color: '#fff'
                    }}
                  >
                    {merchant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Merchant Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.text.secondary }}>Email:</span>
                    <span style={{ color: theme.text.primary }}>{merchant.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.text.secondary }}>Phone:</span>
                    <span style={{ color: theme.text.primary }}>{merchant.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.text.secondary }}>Location:</span>
                    <span style={{ color: theme.text.primary }}>{merchant.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.text.secondary }}>Total Sales:</span>
                    <span className="font-semibold" style={{ color: theme.accent.primary }}>
                      ₱{(merchant.totalSales || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleToggleStatus(merchant._id, merchant.isActive)}
                  style={{
                    background: merchant.isActive ? '#EF4444' : '#10B981',
                    color: '#fff'
                  }}
                  className="w-full py-2 rounded-md font-semibold hover:opacity-80 transition text-sm"
                >
                  {merchant.isActive ? '🚫 Deactivate' : '✅ Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
