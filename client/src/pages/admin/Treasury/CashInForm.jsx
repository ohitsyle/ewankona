// client/src/pages/admin/Treasury/CashInForm.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../../../context/AppContext";
import { useTheme } from "../../../context/ThemeContext";

const STORAGE_KEY = "treasury_amount_options";

export default function CashInForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl } = useContext(AppContext);
  const { theme, isDarkMode } = useTheme();

  // Support both direct user selection and navigation from registration
  const prefilledUser = location.state?.user || null;
  const fromRegistration = location.state?.fromRegistration || false;
  const registrationUserInfo = location.state?.userInfo || null;
  const registrationRfid = location.state?.rfidUId || null;

  const [step, setStep] = useState(prefilledUser || fromRegistration ? 1 : 0);
  const [rfidUid, setRfidUid] = useState(
    prefilledUser?.rfidUid || prefilledUser?.rfid || registrationRfid || ""
  );
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);

  // Countdown state for 5-second confirmation
  const [countdown, setCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownRef = React.useRef(null);

  // User not found state
  const [userNotFound, setUserNotFound] = useState(false);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [amountOptions, setAmountOptions] = useState([]);
  const [savedAmountOptions, setSavedAmountOptions] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      setAmountOptions(saved);
      setSavedAmountOptions(saved);
    } catch {
      setAmountOptions([]);
      setSavedAmountOptions([]);
    }
  }, []);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [editStartSnapshot, setEditStartSnapshot] = useState([]);

  const fetchUserInfo = useCallback(async (userRfid) => {
    if (!userRfid) return;
    setFetchingBalance(true);
    setUserNotFound(false);
    try {
      const response = await axios.get(`${backendUrl}/api/treasury/search-user/${userRfid}`, {
        withCredentials: true
      });

      if (response.data.success) {
        const u = response.data.user;
        setUser({
          ...u,
          schoolUId: u.schoolUId || u.schoolUid || u.school_uid || u.school_id_number || u.idNumber || "N/A",
          firstName: u.firstName || u.first_name || "",
          lastName: u.lastName || u.last_name || "",
          middleName: u.middleName || u.mid_name || "",
          rfidUid: u.rfidUid || u.rfid_uid || u.rfid || "",
          isActive: u.isActive ?? u.active ?? false,
          isVerified: u.isVerified ?? u.verified ?? false
        });
        setUserNotFound(false);
      } else {
        // User not found - offer to register
        setUserNotFound(true);
        setUser(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // User not found - offer to register
        setUserNotFound(true);
        setUser(null);
      } else {
        toast.error("Failed to fetch user information");
        navigate("/admin/treasury/dashboard");
      }
    } finally {
      setFetchingBalance(false);
    }
  }, [backendUrl, navigate]);

  useEffect(() => {
    if (prefilledUser) {
      const rfidToUse = prefilledUser.rfidUid || prefilledUser.rfid_uid || prefilledUser.rfid;
      setRfidUid(rfidToUse);
      fetchUserInfo(rfidToUse);
    } else if (fromRegistration && registrationRfid) {
      // Coming from registration - fetch user info
      setRfidUid(registrationRfid);
      fetchUserInfo(registrationRfid);
    } else {
      toast.error("No user selected. Please scan RFID first.");
      navigate("/admin/treasury/dashboard");
    }
  }, [prefilledUser, fromRegistration, registrationRfid, navigate, fetchUserInfo]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const maskedRfidUid = rfidUid ? "*".repeat(rfidUid.length) : "";

  const handleNext = () => {
    if (!user) return toast.error("User information not available");
    if (!user.isActive) return toast.error("Cannot cash in. User account is inactive. Please have them activate their account first.");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Please select or enter a valid amount");
    setStep(2);
  };

  // Start the 5-second countdown
  const startCountdown = () => {
    setCountdown(5);
    setCountdownActive(true);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setCountdownActive(false);
          // Auto-confirm after countdown
          executeTransaction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel the countdown
  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdown(0);
    setCountdownActive(false);
    toast.info("Transaction cancelled");
  };

  // Navigate to register with RFID
  const handleRegisterUser = () => {
    navigate("/admin/treasury/register", {
      state: {
        rfidUId: rfidUid,
        rfid: rfidUid
      }
    });
  };

  // Called when confirm button is clicked - starts countdown
  const handleConfirm = () => {
    if (!user.isActive) {
      toast.error("Cannot cash in. User account is inactive. Please have them activate their account first.");
      setStep(1);
      return;
    }
    // Start the 5-second countdown
    startCountdown();
  };

  // Execute the actual transaction (called after countdown completes)
  const executeTransaction = async () => {
    if (!user.isActive) {
      toast.error("Cannot cash in. User account is inactive.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/treasury/cash-in`,
        { rfid: user.rfidUid || user.rfid, amount: parseFloat(amount) },
        { withCredentials: true }
      );

      if (response.data.success) {
        setTransactionData({ transaction: response.data.transaction, user: response.data.user });
        toast.success("Cash in successful! Receipt sent to user.");
        setStep(3);
      } else {
        toast.error(response.data.message || "Cash in failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during cash in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoDashboard = () => navigate("/admin/treasury/dashboard");

  const handleNewTransaction = () => {
    setStep(prefilledUser ? 1 : 0);
    setAmount("");
    setTransactionData(null);
    if (user?.rfidUid || user?.rfid) fetchUserInfo(user.rfidUid || user.rfid);
    navigate("/admin/treasury/dashboard");
  };

  // Edit mode handlers
  const handleRemoveAmount = (index) => {
    const newOptions = amountOptions.filter((_, i) => i !== index);
    setAmountOptions(newOptions);
    if (amount == amountOptions[index]) setAmount("");
  };

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };
  const handleDrop = (index) => {
  if (draggedIndex === null || draggedIndex === index) return;

  const newOptions = [...amountOptions];
  const [moved] = newOptions.splice(draggedIndex, 1);
  newOptions.splice(index, 0, moved);

  setAmountOptions(newOptions);

  // persist immediately
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newOptions));

  setDraggedIndex(null);
  setDragOverIndex(null);
};

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddAmount = () => {
    const amt = parseFloat(newAmount);
    if (!newAmount || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amountOptions.includes(amt)) {
      toast.error("This amount already exists");
      return;
    }
    if (amountOptions.length >= 6) {
      toast.error("Maximum 6 amount options allowed");
      return;
    }

    setAmountOptions([...amountOptions, amt]);
    setNewAmount("");
    setShowAddModal(false);
    toast.success("Amount added successfully");
  };

  const handleResetToEditStart = () => {
    if (!editStartSnapshot.length) return;

    if (window.confirm("Discard changes and reset?")) {
      setAmountOptions([...editStartSnapshot]);
      setAmount("");
    }
  };

  const handleDoneEditing = () => {
  console.log("DONE clicked, saving:", amountOptions);

  if (amountOptions.length !== 6) {
    return toast.error("You must have exactly 6 amounts before saving.");
  }

  setSavedAmountOptions([...amountOptions]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(amountOptions));
  setIsEditMode(false);
};

const handleStartEditing = () => {
  setEditStartSnapshot([...amountOptions]); // 👈 capture current state
  setIsEditMode(true);
};


  // Helper to display full name
  const getUserFullName = () => {
    if (!user) return "N/A";
    const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
    return parts.join(" ") || user.name || "N/A";
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page Title */}
        <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleGoDashboard}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h1 className="text-xl font-bold text-white">
            Cash In Form
          </h1>
        </div>

      {/* Full-width divider */}
        <div className="w-full h-[2px] bg-yellow-400/80"></div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-6 w-full flex-1">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-yellow-400' : 'text-slate-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s 
                      ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/50' 
                      : 'bg-slate-700 border-2 border-slate-600'
                  }`}>
                    {s}
                  </div>
                  <span className="font-semibold hidden sm:inline">
                    {s === 1 ? 'Details' : s === 2 ? 'Confirm' : 'Complete'}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-12 sm:w-24 h-1 rounded transition-all ${
                    step > s ? 'bg-yellow-400' : 'bg-slate-700'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto">
          {/* STEP 0/1 — User + Amount Selection */}
          {(step === 0 || step === 1) && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* User Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-lg font-bold text-yellow-400">User Information</h2>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  {/* RFID Badge */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-3 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-blue-300 font-semibold text-xs uppercase tracking-wider">RFID Card</span>
                    </div>
                    <div className="font-mono text-xl text-white tracking-widest">
                      {maskedRfidUid}
                    </div>
                  </div>

                  {fetchingBalance ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                      <span className="ml-3 text-slate-400">Loading user info...</span>
                    </div>
                  ) : userNotFound ? (
                    // User not found - offer to register
                    <div className="space-y-4">
                      <div className="bg-orange-900/30 border border-orange-500/50 text-orange-200 p-4 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="font-bold text-base mb-1">User Not Registered</p>
                            <p className="text-sm">This RFID card is not associated with any registered user.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                        <p className="text-blue-200 text-sm mb-3 text-center">
                          Would you like to register this user?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleRegisterUser}
                            className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Yes, Register
                          </button>
                          <button
                            onClick={handleGoDashboard}
                            className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                          >
                            No, Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : user ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                        <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Full Name</div>
                          <div className="text-white font-semibold text-sm truncate">{getUserFullName()}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                        <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">School ID</div>
                          <div className="text-white font-semibold text-sm">{user.schoolUId}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                        <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Email Address</div>
                          <div className="text-white font-semibold text-xs truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                        <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Role</div>
                          <div className="text-white font-semibold text-sm">{user.role === "student" ? "Student" : "Employee"}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-300 font-semibold text-sm">Account Status</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          user.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {user.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      {/* Inactive Account Warning */}
                      {!user.isActive && (
                        <div className="bg-red-900/30 border-l-4 border-red-500 p-3 rounded-r-xl mt-2">
                          <div className="flex gap-2">
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-red-200 text-sm">
                              <p className="font-semibold">User account is inactive</p>
                              <p className="text-xs mt-1">Please have the user activate their account by changing their temporary PIN first.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-lg">
                      <p className="font-semibold text-sm">No user selected</p>
                      <p className="text-xs">Please go back to dashboard and select a user.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-lg font-bold text-yellow-400">Select Amount</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditMode && (
                        <button
                          onClick={handleResetToEditStart}
                          className="text-yellow-400 hover:text-yellow-300 text-xs transition-colors"
                        >
                          ↻ Reset
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!isEditMode) {
                            // Enter edit mode
                            setEditStartSnapshot([...amountOptions]);
                            setIsEditMode(true);
                          } else {
                            // Done editing
                            handleDoneEditing();
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 transition-colors text-xs font-semibold ${
                          isEditMode && amountOptions.length !== 6 ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        disabled={isEditMode && amountOptions.length !== 6}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {isEditMode ? 'Done' : 'Edit'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  {/* Amount Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {amountOptions.map((amt, index) => (
                      <div
                        key={index}
                        draggable={isEditMode}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group ${
                          dragOverIndex === index ? "scale-105" : ""
                        }`}
                      >
                        <button
                          onClick={() => !isEditMode && user?.isActive && setAmount(amt.toString())}
                          disabled={(!user && !isEditMode) || fetchingBalance || (!isEditMode && !user?.isActive)}
                          className={`w-full py-3 rounded-xl font-bold text-base transition-all relative overflow-hidden ${
                            isEditMode
                              ? "bg-slate-700/50 text-white border-2 border-dashed border-yellow-400/50 cursor-move"
                              : amount == amt
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/30 scale-105"
                              : user && user.isActive
                              ? "bg-slate-700/50 text-white hover:bg-slate-600/50 hover:scale-105 border border-slate-600"
                              : "bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-600"
                          }`}
                        >
                          {isEditMode && (
                            <div className="absolute top-1.5 left-1.5">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          )}
                          ₱{amt.toLocaleString()}
                          {isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAmount(index);
                              }}
                              className="absolute top-1.5 right-1.5 p-0.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </button>
                      </div>
                    ))}

                    {amountOptions.length < 6 && isEditMode && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="py-3 rounded-xl font-bold bg-slate-700/30 text-yellow-400 hover:bg-slate-700/50 border-2 border-dashed border-yellow-400/50 transition-all flex items-center justify-center gap-1.5 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    )}
                  </div>

                  {!isEditMode && (
                    <div className="space-y-3 mt-auto">
                      {/* Custom Amount Input */}
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1.5 text-xs">
                          Or enter custom amount:
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                            ₱
                          </span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amount && !amountOptions.includes(parseFloat(amount)) ? amount : ""}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={!user || fetchingBalance || !user?.isActive}
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={handleNext}
                        disabled={!user || !amount || parseFloat(amount) <= 0 || !user.isActive}
                        className="w-full py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 disabled:shadow-none"
                      >
                        {!user?.isActive ? "⚠️ User Account Inactive" : "Continue to Confirmation →"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Summary with Countdown */}
          {step === 2 && (
            <div className="max-w-xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-6 py-2">
                  <h2 className="text-lg font-bold text-yellow-400">Confirm Transaction</h2>
                </div>

                <div className="p-4 space-y-4">
                  {/* Summary Details */}
                  <div className="bg-slate-900/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                      <span className="text-slate-400 font-medium">User</span>
                      <span className="text-white font-semibold">{getUserFullName()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                      <span className="text-slate-400 font-medium">School ID</span>
                      <span className="text-white font-semibold">{user?.schoolUId}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="text-white font-semibold text-sm">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                      <span className="text-slate-400 font-medium">RFID</span>
                      <span className="text-white font-mono">{"*".repeat(user?.rfidUid?.length || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-yellow-400 font-bold text-lg">Cash-In Amount</span>
                      <span className="text-yellow-400 font-bold text-2xl">₱{parseFloat(amount).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Countdown Active - Show countdown UI */}
                  {countdownActive ? (
                    <div className="space-y-4">
                      {/* Countdown Display */}
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 text-center">
                        <p className="text-blue-200 text-sm mb-3">Processing transaction in...</p>
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          {/* Circular countdown animation */}
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="44"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              className="text-slate-700"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="44"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={276.46}
                              strokeDashoffset={276.46 * (1 - countdown / 5)}
                              className="text-yellow-400 transition-all duration-1000 ease-linear"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-yellow-400">
                            {countdown}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">Click cancel to abort the transaction</p>
                      </div>

                      {/* Cancel Button */}
                      <button
                        onClick={cancelCountdown}
                        className="w-full py-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Transaction
                      </button>
                    </div>
                  ) : loading ? (
                    /* Loading State */
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
                      <p className="text-slate-300 font-semibold">Processing transaction...</p>
                      <p className="text-slate-500 text-sm mt-1">Please wait...</p>
                    </div>
                  ) : (
                    /* Normal Confirm State */
                    <>
                      {/* Warning Notice */}
                      <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r-xl">
                        <div className="flex gap-3">
                          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-yellow-200 text-sm space-y-1">
                            <p className="font-semibold">Please verify all details before confirming</p>
                            <p className="text-xs text-yellow-200/70">After clicking confirm, you'll have 5 seconds to cancel the transaction.</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 transition-all"
                        >
                          ✓ Confirm Transaction
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && transactionData && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-green-500/30 overflow-hidden w-full max-w-lg">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-400/30 px-4 py-4 text-center">
                  <h2 className="text-2xl font-bold text-green-400 mb-2">Transaction Successful!</h2>
                  <p className="text-slate-300">Cash-in completed successfully</p>
                </div>

                <div className="p-6 pt-0 space-y-5">
                  {/* Transaction Details */}
                  <div className="bg-slate-900/50 rounded-xl p-5 space-y-3">
                    <div className="text-center pb-3 border-b border-slate-700">
                      <div className="text-slate-400 text-sm mb-1">Amount Added</div>
                      <div className="text-green-400 text-3xl font-bold">
                        +₱{parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">User</span>
                      <span className="text-white font-semibold">{getUserFullName()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">School ID</span>
                      <span className="text-white font-semibold">{user.schoolUId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">RFID</span>
                      <span className="text-white font-mono">{maskedRfidUid}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white font-semibold">{user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Transaction ID</span>
                      <span className="text-yellow-400 font-mono text-xs">
                        {transactionData.transaction?.transactionId || transactionData.transaction?.transaction_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status</span>
                      <span className="text-green-400 font-semibold">
                        {transactionData.transaction?.status || "Completed"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleGoDashboard}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD AMOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-6 py-4">
              <h3 className="text-xl font-bold text-yellow-400">Add New Amount</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-2">Enter Amount:</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₱</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-lg font-semibold"
                    min="1"
                    step="0.01"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddAmount()}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddAmount}
                  className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 transition-all"
                >
                  Add Amount
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAmount("");
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}