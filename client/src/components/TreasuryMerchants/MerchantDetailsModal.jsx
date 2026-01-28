// client/src/components/TreasuryMerchants/MerchantDetailsModal.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  ArrowUpCircle,
  Bus,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { fetchMerchantTransactions } from "../../services/merchantApi";
import { toast } from "react-toastify";

export default function MerchantDetailsModal({ merchant, onClose, onCashOut }) {
  const [activeTab, setActiveTab] = useState("details");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);

  // 🔒 Refs for safe polling
  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const firstLoadRef = useRef(true);

  // Shuttle service detection
  const isShuttleService =
    merchant.merchantId === "SHUTTLE" || merchant.id === "SHUTTLE";

  /**
   * ===============================
   * FETCH TRANSACTIONS
   * ===============================
   */
  const loadTransactions = async ({ silent = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!silent) {
        setLoadingTransactions(true);
      }

      setTransactionError(null);

      const response = await fetchMerchantTransactions(
        merchant.merchantId || merchant.id,
        { limit: 100 }
      );

      if (response.success) {
        setTransactions(response.transactions || []);
      } else {
        setTransactionError("Failed to load transactions");
        toast.error("Failed to load transactions");
      }
    } catch (error) {
      setTransactionError(error.message || "Failed to load transactions");
      toast.error("Failed to load transactions");
    } finally {
      if (!silent) {
        setLoadingTransactions(false);
      }
      firstLoadRef.current = false;
      isFetchingRef.current = false;
    }
  };

  /**
   * ===============================
   * AUTO-REFRESH (2s) + VISIBILITY
   * ===============================
   */
  useEffect(() => {
    if (activeTab !== "transactions") return;

    // Initial immediate load
    loadTransactions({ silent: false });

    const startPolling = () => {
      if (intervalRef.current) return;

      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          loadTransactions({ silent: true });
        }
      }, 2000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab, merchant.merchantId, merchant.id]);

  /**
   * ===============================
   * HELPERS (UNCHANGED)
   * ===============================
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeLabel = (tx) => {
    const txType = tx.type || tx.transactionType || "";
    const txStatus = tx.status || "";

    if (txStatus === "Refunded" || txStatus === "Cancelled") return "Refund";
    if (["cash-out", "cashout", "withdrawal"].includes(txType)) return "Cash-Out";
    if (["payment", "credit", "sale"].includes(txType))
      return isShuttleService ? "Fare Payment" : "Payment Received";
    if (txType === "debit") return "Refund";

    return "Transaction";
  };

  const getAmountColor = (tx) => {
    const txType = tx.type || tx.transactionType || "";
    const txStatus = tx.status || "";

    if (txStatus === "Refunded" || txStatus === "Cancelled")
      return "#F59E0B";
    if (
      ["cash-out", "cashout", "withdrawal", "debit"].includes(txType)
    )
      return "#EF4444";
    return "#10B981";
  };

  const formatAmount = (tx) => {
    const amount = Math.abs(tx.amount || 0);
    const txType = tx.type || tx.transactionType || "";
    const txStatus = tx.status || "";

    if (txStatus === "Refunded" || txStatus === "Cancelled")
      return `- ₱${amount.toFixed(2)}`;
    if (
      ["cash-out", "cashout", "withdrawal", "debit"].includes(txType)
    )
      return `- ₱${amount.toFixed(2)}`;
    return `+ ₱${amount.toFixed(2)}`;
  };

  const calculateTotalPayments = () =>
    transactions
      .filter(
        (tx) =>
          ["payment", "credit", "sale"].includes(
            tx.type || tx.transactionType || ""
          ) &&
          !["Refunded", "Cancelled"].includes(tx.status)
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  const calculateTotalCashOuts = () =>
    transactions
      .filter((tx) =>
        ["cash-out", "cashout", "withdrawal"].includes(
          tx.type || tx.transactionType || ""
        )
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  const calculateTotalRefunds = () =>
    transactions
      .filter((tx) => ["Refunded", "Cancelled"].includes(tx.status))
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  const countByType = (type) =>
    transactions.filter((tx) => {
      const txType = tx.type || tx.transactionType || "";
      const txStatus = tx.status || "";
      if (type === "payment")
        return (
          ["payment", "credit", "sale"].includes(txType) &&
          !["Refunded", "Cancelled"].includes(txStatus)
        );
      if (type === "cashout")
        return ["cash-out", "cashout", "withdrawal"].includes(txType);
      if (type === "refund")
        return ["Refunded", "Cancelled"].includes(txStatus);
      return false;
    }).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1E2347',
        borderRadius: '16px',
        border: '2px solid rgba(255, 212, 28, 0.3)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}>
        
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 212, 28, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              {isShuttleService ? (
                <Bus style={{ width: 24, height: 24, color: '#FFD41C' }} />
              ) : (
                <Store style={{ width: 24, height: 24, color: '#FFD41C' }} />
              )}
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#FBFBFB',
                margin: 0
              }}>
                {merchant.name}
              </h3>
              {isShuttleService && (
                <span style={{
                  padding: '4px 12px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#3B82F6'
                }}>
                  System Service
                </span>
              )}
            </div>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(255, 212, 28, 0.15)',
              border: '1px solid rgba(255, 212, 28, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFD41C',
              display: 'inline-block'
            }}>
              {merchant.id || merchant.merchantId}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'rgba(251, 251, 251, 0.6)',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FBFBFB'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(251, 251, 251, 0.6)'}
          >
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 212, 28, 0.2)',
          background: 'rgba(24, 29, 64, 0.5)'
        }}>
          <button
            onClick={() => setActiveTab("details")}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === "details" ? 'rgba(255, 212, 28, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === "details" ? '2px solid #FFD41C' : '2px solid transparent',
              color: activeTab === "details" ? '#FFD41C' : 'rgba(251, 251, 251, 0.6)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === "transactions" ? 'rgba(255, 212, 28, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === "transactions" ? '2px solid #FFD41C' : '2px solid transparent',
              color: activeTab === "transactions" ? '#FFD41C' : 'rgba(251, 251, 251, 0.6)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Transactions
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px'
        }}>
          
          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Financial Summary */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FBFBFB',
                  margin: '0 0 16px 0'
                }}>
                  Financial Summary
                </h4>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Current Balance */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                      <Wallet style={{ width: 16, height: 16, color: '#10B981' }} />
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        fontWeight: 600
                      }}>
                        Current Balance
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#10B981',
                      lineHeight: 1.2
                    }}>
                      ₱{(merchant.balance || 0).toLocaleString('en-PH', {
                        minimumFractionDigits: 2
                      })}
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: 'rgba(251, 251, 251, 0.4)',
                      margin: '4px 0 0 0'
                    }}>
                      Available for cash-out
                    </p>
                  </div>

                  {/* Total Collections */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                      <TrendingUp style={{ width: 16, height: 16, color: '#3B82F6' }} />
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        fontWeight: 600
                      }}>
                        Total Collections
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#3B82F6',
                      lineHeight: 1.2
                    }}>
                      ₱{(merchant.collections || 0).toLocaleString('en-PH', {
                        minimumFractionDigits: 2
                      })}
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: 'rgba(251, 251, 251, 0.4)',
                      margin: '4px 0 0 0'
                    }}>
                      All-time revenue
                    </p>
                  </div>

                  {/* Today's Transactions */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                      <ArrowUpCircle style={{ width: 16, height: 16, color: '#A855F7' }} />
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        fontWeight: 600
                      }}>
                        Today's Transactions
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#A855F7',
                      lineHeight: 1.2
                    }}>
                      {merchant.todayTx || 0}
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: 'rgba(251, 251, 251, 0.4)',
                      margin: '4px 0 0 0'
                    }}>
                      Transactions today
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FBFBFB',
                  margin: '0 0 16px 0'
                }}>
                  {isShuttleService ? "Service Information" : "Business Information"}
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {isShuttleService ? (
                      <Bus style={{ width: 20, height: 20, color: '#FFD41C', marginTop: 2 }} />
                    ) : (
                      <Store style={{ width: 20, height: 20, color: '#FFD41C', marginTop: 2 }} />
                    )}
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        marginBottom: '4px'
                      }}>
                        {isShuttleService ? "Service Name" : "Business Name"}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FBFBFB',
                        fontWeight: 500
                      }}>
                        {merchant.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Mail style={{ width: 20, height: 20, color: '#10B981', marginTop: 2 }} />
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        marginBottom: '4px'
                      }}>
                        Email
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FBFBFB',
                        fontWeight: 500
                      }}>
                        {merchant.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <MapPin style={{ width: 20, height: 20, color: '#EF4444', marginTop: 2 }} />
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        marginBottom: '4px'
                      }}>
                        Address
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FBFBFB',
                        fontWeight: 500
                      }}>
                        {merchant.address || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Phone style={{ width: 20, height: 20, color: '#A855F7', marginTop: 2 }} />
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(251, 251, 251, 0.6)',
                        marginBottom: '4px'
                      }}>
                        Phone
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FBFBFB',
                        fontWeight: 500
                      }}>
                        {merchant.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div>
              {loadingTransactions ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 0',
                  color: '#FFD41C'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255, 212, 28, 0.3)',
                    borderTopColor: '#FFD41C',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                </div>
              ) : transactionError ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0'
                }}>
                  <AlertCircle style={{
                    width: 48,
                    height: 48,
                    color: '#EF4444',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{
                    color: '#EF4444',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {transactionError}
                  </p>
                  <button
                    onClick={loadTransactions}
                    style={{
                      padding: '10px 20px',
                      background: '#FFD41C',
                      color: '#181D40',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 212, 28, 0.4)'
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : transactions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: 'rgba(251, 251, 251, 0.5)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No transactions found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Summary Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Total Payments */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px'
                      }}>
                        <ArrowUpCircle style={{ width: 16, height: 16, color: '#10B981' }} />
                        <span style={{
                          fontSize: '12px',
                          color: 'rgba(251, 251, 251, 0.6)',
                          fontWeight: 600
                        }}>
                          {isShuttleService ? "Fares" : "Payments"}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#10B981'
                      }}>
                        ₱{calculateTotalPayments().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(251, 251, 251, 0.4)',
                        marginTop: '4px'
                      }}>
                        {countByType('payment')} payments
                      </div>
                    </div>

                    {/* Total Cash-Outs */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px'
                      }}>
                        <TrendingUp style={{ width: 16, height: 16, color: '#EF4444' }} />
                        <span style={{
                          fontSize: '12px',
                          color: 'rgba(251, 251, 251, 0.6)',
                          fontWeight: 600
                        }}>
                          Cash-Outs
                        </span>
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#EF4444'
                      }}>
                        ₱{calculateTotalCashOuts().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(251, 251, 251, 0.4)',
                        marginTop: '4px'
                      }}>
                        {countByType('cashout')} cash-outs
                      </div>
                    </div>

                    {/* Total Refunds */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px'
                      }}>
                        <ArrowUpCircle style={{ width: 16, height: 16, color: '#F59E0B', transform: 'rotate(180deg)' }} />
                        <span style={{
                          fontSize: '12px',
                          color: 'rgba(251, 251, 251, 0.6)',
                          fontWeight: 600
                        }}>
                          Refunds
                        </span>
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#F59E0B'
                      }}>
                        ₱{calculateTotalRefunds().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(251, 251, 251, 0.4)',
                        marginTop: '4px'
                      }}>
                        {countByType('refund')} refunds
                      </div>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'separate',
                      borderSpacing: 0
                    }}>
                      <thead>
                        <tr style={{
                          borderBottom: '1px solid rgba(255, 212, 28, 0.2)'
                        }}>
                          <th style={{
                            textAlign: 'center',
                            color: '#FFD41C',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '12px 16px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Date & Time</th>
                          <th style={{
                            textAlign: 'center',
                            color: '#FFD41C',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '12px 16px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Details</th>
                          <th style={{
                            textAlign: 'center',
                            color: '#FFD41C',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '12px 16px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Amount</th>
                          <th style={{
                            textAlign: 'center',
                            color: '#FFD41C',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '12px 16px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => {
                          const typeLabel = getTransactionTypeLabel(tx);
                          const amountColor = getAmountColor(tx);
                          const formattedAmount = formatAmount(tx);
                          
                          return (
                            <tr 
                              key={tx.id || tx._id || idx}
                              style={{
                                borderBottom: '1px solid rgba(255, 212, 28, 0.1)',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <td style={{
                                textAlign: 'center',
                                padding: '12px 16px',
                                color: '#FBFBFB',
                                fontSize: '13px'
                              }}>
                                {formatDate(tx.createdAt || tx.date)}
                              </td>
                              
                              {/* Details Column */}
                              <td style={{
                                textAlign: 'center',
                                padding: '12px 16px',
                                fontSize: '13px'
                              }}>
                                {(() => {
                                  const txType = tx.type || tx.transactionType || '';
                                  const txStatus = tx.status || 'Completed';
                                  const customer = tx.customerName || tx.studentName || tx.adminName || 'Customer';

                                  // PRIORITY 1: Check if transaction is refunded
                                  if (txStatus === "Refunded" || txStatus === "Cancelled") {
                                    return (
                                      <div>
                                        <div style={{
                                          fontWeight: 600,
                                          color: '#F59E0B',
                                          marginBottom: '2px'
                                        }}>
                                          Payment Refunded
                                        </div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: 'rgba(251, 251, 251, 0.4)'
                                        }}>
                                          Refund to {customer}
                                        </div>
                                        {tx.notes && (
                                          <div style={{
                                            fontSize: '11px',
                                            color: 'rgba(251, 251, 251, 0.3)',
                                            fontStyle: 'italic',
                                            marginTop: '2px'
                                          }}>
                                            {tx.notes}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  // PRIORITY 2: CASH-OUT
                                  if (["cash-out", "cashout", "withdrawal"].includes(txType)) {
                                    return (
                                      <div>
                                        <div style={{
                                          fontWeight: 600,
                                          color: '#EF4444',
                                          marginBottom: '2px'
                                        }}>
                                          Cash Out
                                        </div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: 'rgba(251, 251, 251, 0.4)'
                                        }}>
                                          Processed by {tx.adminName || 'Admin'}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // PRIORITY 3: PAYMENT
                                  if (["payment", "credit", "sale"].includes(txType)) {
                                    return (
                                      <div>
                                        <div style={{
                                          fontWeight: 600,
                                          color: '#10B981',
                                          marginBottom: '2px'
                                        }}>
                                          Payment Received
                                        </div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: 'rgba(251, 251, 251, 0.4)'
                                        }}>
                                          Payment from {customer}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // PRIORITY 4: DEBIT
                                  if (txType === "debit") {
                                    return (
                                      <div>
                                        <div style={{
                                          fontWeight: 600,
                                          color: '#F59E0B',
                                          marginBottom: '2px'
                                        }}>
                                          Refund Issued
                                        </div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: 'rgba(251, 251, 251, 0.4)'
                                        }}>
                                          Refund to {customer}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // DEFAULT
                                  return (
                                    <div>
                                      <div style={{
                                        fontWeight: 600,
                                        color: '#FBFBFB',
                                        marginBottom: '2px'
                                      }}>
                                        {customer}
                                      </div>
                                      <div style={{
                                        fontSize: '11px',
                                        color: 'rgba(251, 251, 251, 0.4)'
                                      }}>
                                        ID: {tx.schoolUId || tx.userId || tx.referenceId || 'N/A'}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              <td style={{
                                padding: '12px 16px',
                                textAlign: 'center'
                              }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: amountColor,
                                  fontSize: '14px'
                                }}>
                                  {formattedAmount}
                                </span>
                              </td>

                              <td style={{
                                padding: '12px 16px',
                                textAlign: 'center'
                              }}>
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: tx.status === "Completed" 
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : tx.status === "Refunded" || tx.status === "Cancelled"
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(255, 212, 28, 0.2)',
                                  color: tx.status === "Completed" 
                                    ? '#10B981'
                                    : tx.status === "Refunded" || tx.status === "Cancelled"
                                    ? '#F59E0B'
                                    : '#FFD41C',
                                  border: `1px solid ${
                                    tx.status === "Completed" 
                                      ? 'rgba(16, 185, 129, 0.3)'
                                      : tx.status === "Refunded" || tx.status === "Cancelled"
                                      ? 'rgba(245, 158, 11, 0.3)'
                                      : 'rgba(255, 212, 28, 0.3)'
                                  }`
                                }}>
                                  {tx.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          borderTop: '1px solid rgba(255, 212, 28, 0.2)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 212, 28, 0.1)',
              border: '2px solid rgba(255, 212, 28, 0.3)',
              borderRadius: '8px',
              color: '#FFD41C',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 212, 28, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
            }}
          >
            Close
          </button>
          
          {/* Only show cash-out button for regular merchants with balance */}
          {!isShuttleService && merchant.isActive && merchant.balance > 0 && (
            <button
              onClick={() => onCashOut(merchant)}
              style={{
                padding: '12px 24px',
                background: '#FFD41C',
                border: 'none',
                borderRadius: '8px',
                color: '#181D40',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 212, 28, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 212, 28, 0.4)';
              }}
            >
              Process Cash Out
            </button>
          )}
        </div>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}