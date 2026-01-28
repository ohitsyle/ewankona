import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Mail, CreditCard, Building2, Check, AlertCircle, Shield } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../../context/AppContext";
import { useTheme } from "../../../context/ThemeContext";

export default function RegistrationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl } = useContext(AppContext);
  const { theme, isDarkMode } = useTheme();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  // School ID separated: year (4 digits) + number (6 digits)
  const [schoolIdYear, setSchoolIdYear] = useState("");
  const [schoolIdNumber, setSchoolIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [rfidUId, setRfidUId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [touched, setTouched] = useState({});

  const userRoleOptions = [
    { value: "student", label: "Student" },
    { value: "employee", label: "Employee" },
  ];

  // Get RFID from navigation state (passed from Register modal)
  useEffect(() => {
    if (location.state?.rfid || location.state?.rfidUId) {
      const rfidValue = location.state.rfidUId || location.state.rfid;
      console.log("✅ RFID received from modal:", rfidValue);
      setRfidUId(rfidValue);
    } else {
      console.warn("⚠️ No RFID received from location.state");
      toast.warning("No RFID provided. Please go back and scan RFID first.");
    }
  }, [location.state]);

  const getFullName = () => {
    return [firstName, middleName, lastName].filter(n => n.trim()).join(' ');
  };

  // Get combined school ID for storage (no separator)
  const getSchoolUId = () => {
    return `${schoolIdYear}${schoolIdNumber}`;
  };

  // Get formatted school ID for display (with separator)
  const getFormattedSchoolId = () => {
    if (!schoolIdYear && !schoolIdNumber) return "";
    return `${schoolIdYear || "____"}-${schoolIdNumber || "______"}`;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const getFieldError = (field) => {
    if (!touched[field]) return null;
    
    switch(field) {
      case 'firstName':
        return !firstName.trim() ? 'First name is required' : null;
      case 'lastName':
        return !lastName.trim() ? 'Last name is required' : null;
      case 'schoolIdYear':
        if (!schoolIdYear.trim()) return 'Year is required';
        if (schoolIdYear.length !== 4) return 'Year must be 4 digits';
        return null;
      case 'schoolIdNumber':
        if (!schoolIdNumber.trim()) return 'ID number is required';
        if (schoolIdNumber.length < 5) return 'ID number must be at least 5 digits';
        return null;
      case 'email':
        if (!email.trim()) return 'Email is required';
        return !validateEmail(email) ? 'Invalid email format' : null;
      case 'role':
        return !role ? 'User type is required' : null;
      default:
        return null;
    }
  };

  const isFormValid = () => {
    return firstName.trim() &&
           lastName.trim() &&
           schoolIdYear.trim() &&
           schoolIdYear.length === 4 &&
           schoolIdNumber.trim() &&
           schoolIdNumber.length >= 5 &&
           email.trim() &&
           validateEmail(email) &&
           role &&
           rfidUId;
  };

  const handleNext = () => {
    const fields = ['firstName', 'lastName', 'schoolIdYear', 'schoolIdNumber', 'email', 'role'];
    const newTouched = {};
    fields.forEach(field => newTouched[field] = true);
    setTouched(newTouched);

    if (!rfidUId || rfidUId.trim() === "") {
      toast.error("RFID is missing. Please go back to dashboard and scan RFID.");
      return;
    }

    if (isFormValid()) {
      setStep(2);
    }
  };

  // Generate 6-digit PIN
  const generateTempPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // 🔥 ACTUAL DATABASE REGISTRATION
  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Validate RFID before sending
      if (!rfidUId || rfidUId.trim() === "") {
        toast.error("RFID is required. Please scan the RFID card again.");
        navigate("/admin/treasury/dashboard");
        return;
      }

      // Generate 6-digit temporary PIN
      const tempPin = generateTempPin();

      const combinedSchoolUId = getSchoolUId();

      console.log("📤 Sending registration data:", {
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        schoolUId: combinedSchoolUId,
        email: email,
        role: role,
        rfidUId: rfidUId ? `${rfidUId.substring(0, 3)}***` : "EMPTY",
        hasPin: !!tempPin,
        endpoint: `${backendUrl}/api/treasury/register`
      });

      // 🔥 REGISTER USER TO DATABASE VIA API
      const response = await axios.post(
        `${backendUrl}/api/treasury/register`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim(),
          email: email.trim(),
          rfidUId: rfidUId.trim(),
          schoolUId: combinedSchoolUId,
          role: role,
          pin: tempPin
        },
        { withCredentials: true }
      );


      if (response.data.success) {
        console.log("✅ Registration successful:", response.data);
        
        // Store registered user data for success screen
        setRegisteredUser({
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          fullName: getFullName(),
          email: email,
          schoolUId: combinedSchoolUId,
          schoolUIdFormatted: getFormattedSchoolId(),
          role: role,
          tempPin: tempPin,
          emailSent: response.data.emailSent,
          rfidUId: rfidUId,
          userId: response.data.user?._id || response.data.userId
        });

        toast.success("User registered successfully!");
        
        // Show email status
        if (response.data.emailSent) {
          toast.info("Temporary 6-digit PIN sent to user's email");
        } else if (response.data.emailError) {
          toast.warning("User registered but email failed to send. Please provide PIN manually.");
        }

        setStep(3);
      } else {
        toast.error(response.data.message || "Failed to register user");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Server error occurred during registration");
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = () => {
    const roleMap = { student: "Student", employee: "Employee" };
    return roleMap[role] || "Not Selected";
  };

  const handleGoDashboard = () => navigate("/admin/treasury/dashboard");

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page Title Section */}
        <div className="max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleGoDashboard}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">User Registration Form</h1>
          </div>
          <div className="w-full h-[2px] bg-yellow-400"></div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-yellow-400' : 'text-slate-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s 
                      ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/50' 
                      : 'bg-slate-700 border-2 border-slate-600'
                  }`}>
                    {step > s ? <Check size={20} /> : s}
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
          {/* Step 1: Form */}
          {step === 1 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Personal Information Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-yellow-400">Personal Information</h2>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      First Name<span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none ${
                        getFieldError('firstName') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                      }`}
                      placeholder="e.g., Juan"
                    />
                    {getFieldError('firstName') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('firstName')}
                      </p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      Middle Name <span className="text-slate-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholder="e.g., Dela"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      Last Name<span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none ${
                        getFieldError('lastName') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                      }`}
                      placeholder="e.g., Cruz"
                    />
                    {getFieldError('lastName') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('lastName')}
                      </p>
                    )}
                  </div>

                  {/* User Type */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      User Type<span className="text-red-400">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      onBlur={() => handleBlur('role')}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none ${
                        getFieldError('role') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                      }`}
                    >
                      <option value="">-- Select User Type --</option>
                      {userRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {getFieldError('role') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('role')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-yellow-400">Account Details</h2>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  {/* RFID Badge */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-4 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-semibold text-xs uppercase tracking-wider">RFID Card</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xl text-white tracking-widest">
                        {rfidUId ? "*".repeat(rfidUId.length) : "Not Scanned"}
                      </div>
                      {rfidUId && (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <Check size={14} />
                          <span>Scanned</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning if no RFID */}
                  {!rfidUId && (
                    <div className="bg-red-900/20 border-l-4 border-red-400 p-3 rounded-r-xl">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-red-200 text-xs">
                          <p className="font-semibold">⚠️ Warning: No RFID detected</p>
                          <p className="mt-1">Please go back to dashboard and scan RFID card first.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* School ID - Separated Year and Number */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      School ID Number<span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Year Input (4 digits) */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={schoolIdYear}
                        onChange={(e) => {
                          const numbersOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setSchoolIdYear(numbersOnly);
                        }}
                        onBlur={() => handleBlur("schoolIdYear")}
                        className={`w-24 px-3 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none text-center font-mono ${
                          getFieldError("schoolIdYear")
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        }`}
                        placeholder="2024"
                      />
                      {/* Separator */}
                      <span className="text-slate-400 font-bold text-xl">-</span>
                      {/* Number Input (6+ digits) */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        value={schoolIdNumber}
                        onChange={(e) => {
                          const numbersOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
                          setSchoolIdNumber(numbersOnly);
                        }}
                        onBlur={() => handleBlur("schoolIdNumber")}
                        className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none font-mono ${
                          getFieldError("schoolIdNumber")
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        }`}
                        placeholder="121235"
                      />
                    </div>
                    {/* Preview of combined school ID */}
                    {(schoolIdYear || schoolIdNumber) && (
                      <p className="text-slate-400 text-xs">
                        Preview: <span className="text-yellow-400 font-mono">{getFormattedSchoolId()}</span>
                        <span className="text-slate-500 ml-2">(Saved as: {getSchoolUId() || "..."})</span>
                      </p>
                    )}
                    {getFieldError('schoolIdYear') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('schoolIdYear')}
                      </p>
                    )}
                    {getFieldError('schoolIdNumber') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('schoolIdNumber')}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold text-sm flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      Email Address<span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/50 text-white border transition-all outline-none ${
                        getFieldError('email') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                      }`}
                      placeholder="user@example.com"
                    />
                    {getFieldError('email') && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} />
                        {getFieldError('email')}
                      </p>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    disabled={!isFormValid()}
                    className="w-full py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 disabled:shadow-none mt-auto"
                  >
                    Continue to Confirmation →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Left Card - Name Details */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-yellow-400">Personal Information</h2>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <User className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Full Name</div>
                      <div className="text-white font-semibold text-sm">{getFullName()}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <div className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0">•</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">First Name</div>
                      <div className="text-white font-semibold text-sm">{firstName}</div>
                    </div>
                  </div>

                  {middleName && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                      <div className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0">•</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Middle Name</div>
                        <div className="text-white font-semibold text-sm">{middleName}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <div className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0">•</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Last Name</div>
                      <div className="text-white font-semibold text-sm">{lastName}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <div className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">User Type</div>
                      <div className="text-yellow-400 font-semibold text-sm">{getRoleDisplayName()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card - Account Details */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-yellow-400">Account Details</h2>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-3 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-semibold text-xs uppercase tracking-wider">RFID Card</span>
                    </div>
                    <div className="font-mono text-xl text-white tracking-widest">
                      {"*".repeat(rfidUId.length)}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <Building2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">School ID</div>
                      <div className="text-white font-semibold text-sm font-mono">{getFormattedSchoolId()}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                    <Mail className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                        Email Address
                      </div>
                      <div className="text-white font-semibold text-xs truncate">
                        {email}
                      </div>
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r-xl mt-auto">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-yellow-200 text-xs space-y-1">
                        <p className="font-semibold">
                          Please verify all information before confirming.
                        </p>
                        <p>
                          A temporary PIN will be generated and sent to the user's email.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
                    >
                      ← Back
                    </button>

                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Confirm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && registeredUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-green-500/30 overflow-hidden w-full max-w-lg">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-400/30 px-4 py-4 text-center">
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
                    Registration Successful
                  </h2>
                  <p className="text-slate-300">
                    User has been successfully registered
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-slate-900/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Full Name</span>
                      <span className="text-white font-semibold">
                        {registeredUser.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">School ID</span>
                      <span className="text-white font-semibold font-mono">
                        {registeredUser.schoolUIdFormatted || registeredUser.schoolUId}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white font-semibold">
                        {registeredUser.email}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">User Type</span>
                      <span className="text-yellow-400 font-semibold">
                        {getRoleDisplayName()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-slate-700">
                      <span className="text-slate-400">Account Status</span>
                      <span className="text-orange-400 font-semibold">
                        Inactive (PIN Change Required)
                      </span>
                    </div>
                  </div>

                  {/* Email Status */}
                  {registeredUser.emailSent ? (
                    <div className="bg-green-900/20 border-l-4 border-green-400 p-4 rounded-r-xl">
                      <p className="text-green-200 text-sm font-semibold">
                        Temporary PIN has been sent to the user's email.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-900/20 border-l-4 border-orange-400 p-4 rounded-r-xl">
                      <p className="text-orange-200 text-sm font-semibold">
                        Email failed to send. Provide this PIN manually:
                      </p>
                      <div className="font-mono font-bold text-2xl text-white bg-slate-900 p-3 rounded-lg mt-2 text-center tracking-widest">
                        {registeredUser.tempPin}
                      </div>
                    </div>
                  )}

                  {/* Note about activation requirement */}
                  <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                    <p className="text-blue-200 text-sm text-center mb-3">
                      The user must activate their account before they can cash in.
                    </p>
                    <button
                      onClick={handleGoDashboard}
                      className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-lg shadow-yellow-400/30 transition-all"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}