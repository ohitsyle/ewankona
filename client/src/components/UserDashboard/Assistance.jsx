// client/src/components/UserDashboard/Assistance.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { submitAssistanceReport, getReportToOptions } from "../../services/concernsApi";

export default function Assistance() {
  const { theme, isDarkMode } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [reportTo, setReportTo] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState(""); // ✅ NEW: For selected merchant
  const [subject, setSubject] = useState("");
  const [concern, setConcern] = useState("");
  const [otherConcern, setOtherConcern] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [merchantOptions, setMerchantOptions] = useState([]); // ✅ NEW: Store merchant list
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ✅ UPDATED: Fixed report to options (no individual merchants)
  const reportToOptions = [
    { value: "ITSO", label: "ITSO" },
    { value: "Treasury Office", label: "Treasury Office" },
    { value: "NU Shuttle Service", label: "NU Shuttle Service" },
    { value: "Merchants", label: "Merchants" } // ✅ Single "Merchants" option
  ];

  // ✅ Concern options for ITSO and Treasury
  const ITSOConcerns = [
    "The system doesn't recognize my ID / Unable to tap ID",
    "My RFID card is damaged or not working",
    "Others"
  ];

  const treasuryConcerns = [
    "Cash-in transaction not reflected in account",
    "Incorrect amount loaded to account",
    "Account balance discrepancy after cash-in",
    "Others"
  ];

  const isShuttleService = reportTo === "NU Shuttle Service";
  const isMerchants = reportTo === "Merchants"; // ✅ NEW: Check if Merchants selected

  // ✅ Get concerns based on selection
  const getConcerns = () => {
    if (reportTo === "ITSO") return ITSOConcerns;
    if (reportTo === "Treasury Office") return treasuryConcerns;
    return [];
  };

  const concerns = getConcerns();

  // ✅ Fetch merchant options when modal opens
  useEffect(() => {
    if (showPopup && merchantOptions.length === 0) {
      fetchMerchantOptions();
    }
  }, [showPopup]);

  const fetchMerchantOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getReportToOptions();
      if (response.success) {
        // ✅ Extract only merchants from options
        const merchants = response.options.filter(
          opt => !["ITSO", "Treasury Office", "NU Shuttle Service"].includes(opt.value)
        );
        setMerchantOptions(merchants);
        console.log('✅ Loaded merchant options:', merchants);
      }
    } catch (error) {
      console.error('Failed to fetch merchant options:', error);
      setMerchantOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeModal = () => {
    setShowPopup(false);
    setReportTo("");
    setSelectedMerchant("");
    setSubject("");
    setConcern("");
    setOtherConcern("");
    setPlateNumber("");
    setShowSuccess(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const reportData = {
        reportTo: isMerchants ? selectedMerchant : reportTo, // ✅ Use selected merchant if Merchants chosen
        concern: isShuttleService ? "Shuttle Service Concern" : concern,
        subject: isMerchants ? subject : (concern === "Others" ? subject : concern),
        otherConcern: isShuttleService ? otherConcern : (isMerchants ? otherConcern : (concern === "Others" ? otherConcern : "")),
        plateNumber: isShuttleService ? plateNumber : undefined
      };

      const response = await submitAssistanceReport(reportData);

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setShowSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Form validation
  const isFormValid = reportTo && (
    isShuttleService 
      ? (plateNumber.trim() && otherConcern.trim()) 
      : isMerchants
        ? (selectedMerchant && subject.trim() && otherConcern.trim())
        : (concern && (concern !== "Others" || (subject.trim() && otherConcern.trim())))
  );

  return (
    <>
      {/* CARD */}
      <div
        style={{
          background: theme.bg.card,
          borderColor: theme.border.primary
        }}
        className="p-6 rounded-2xl border relative overflow-hidden transition-all duration-300"
      >
        {/* Background Icon */}
        <div className="absolute right-4 top-4 text-[40px] opacity-15">
          🆘
        </div>

        {/* Header */}
        <div className="relative z-10 mb-3">
          <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide">
            Need Assistance?
          </div>
        </div>

        {/* Description */}
        <div className="relative z-10 mb-4">
          <p style={{ color: theme.text.secondary }} className="text-sm">
            Submit a report and we'll assist you promptly.
          </p>
        </div>

        {/* Button */}
        <div className="relative z-10">
          <button
            onClick={() => setShowPopup(true)}
            style={{
              background: theme.accent.primary,
              color: theme.accent.secondary
            }}
            className="font-semibold px-5 py-2.5 text-sm rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-md"
          >
            Submit Report
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2347] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-yellow-50/10 border-b-2 border-yellow-400 flex justify-between items-center px-6 py-2 z-10">
              <h3 className="text-yellow-400 font-extrabold text-s tracking-wide">
                We're here to help – what's the concern?
              </h3>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {showSuccess ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-green-500 mb-2">Report submitted successfully!</h4>
                  <p className="text-white/60 text-sm">We'll get back to you soon.</p>
                </div>
              ) : (
                <>
                  {/* ✅ Report To Dropdown - Fixed options */}
                  <div>
                    <label className="block text-yellow-400 font-semibold text-sm mb-2">
                      Report To: <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={reportTo}
                      onChange={(e) => {
                        setReportTo(e.target.value);
                        setSelectedMerchant("");
                        setConcern("");
                        setOtherConcern("");
                        setSubject("");
                        setPlateNumber("");
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    >
                      <option value="" className="bg-[#1E2347]">
                        Select department or merchant category
                      </option>
                      {reportToOptions.map((option, index) => (
                        <option key={index} value={option.value} className="bg-[#1E2347]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ✅ NEW: Merchant Selection Dropdown (shows when "Merchants" is selected) */}
                  {isMerchants && (
                    <div>
                      <label className="block text-yellow-400 font-semibold text-sm mb-2">
                        Select Merchant: <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedMerchant}
                        onChange={(e) => setSelectedMerchant(e.target.value)}
                        disabled={loadingOptions}
                        className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 disabled:opacity-50"
                      >
                        <option value="" className="bg-[#1E2347]">
                          {loadingOptions ? 'Loading merchants...' : 'Select a merchant'}
                        </option>
                        {merchantOptions.map((merchant, index) => (
                          <option key={index} value={merchant.value} className="bg-[#1E2347]">
                            {merchant.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ✅ NU Shuttle Service Fields */}
                  {isShuttleService ? (
                    <>
                      <div>
                        <label className="block text-yellow-400 font-semibold text-sm mb-2">
                          Plate Number: <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                          placeholder="e.g., ABC 1234"
                          className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-yellow-400 font-semibold text-sm mb-2">
                          Concern: <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={otherConcern}
                          onChange={(e) => setOtherConcern(e.target.value)}
                          placeholder="Please describe your concerns about the shuttle service..."
                          rows={4}
                          className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none"
                        />
                      </div>
                    </>
                  ) : isMerchants ? (
                    // ✅ NEW: Merchant concern fields (Subject + Details)
                    selectedMerchant && (
                      <>
                        <div>
                          <label className="block text-yellow-400 font-semibold text-sm mb-2">
                            Subject: <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief description of your concern"
                            className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                          />
                        </div>

                        <div>
                          <label className="block text-yellow-400 font-semibold text-sm mb-2">
                            Details: <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            value={otherConcern}
                            onChange={(e) => setOtherConcern(e.target.value)}
                            placeholder="Please describe your concern in detail..."
                            rows={4}
                            className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none"
                          />
                        </div>
                      </>
                    )
                  ) : (
                    // ✅ ITSO & Treasury Office Fields
                    <>
                      {reportTo && concerns.length > 0 && (
                        <div>
                          <label className="block text-yellow-400 font-semibold text-sm mb-2">
                            What's your concern? <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={concern}
                            onChange={(e) => setConcern(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                          >
                            <option value="" className="bg-[#1E2347]">Select a concern</option>
                            {concerns.map((concernOption, index) => (
                              <option key={index} value={concernOption} className="bg-[#1E2347]">
                                {concernOption}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {concern === "Others" && (
                        <>
                          <div>
                            <label className="block text-yellow-400 font-semibold text-sm mb-2">
                              Subject: <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              placeholder="Brief description of your concern"
                              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="block text-yellow-400 font-semibold text-sm mb-2">
                              Details: <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              value={otherConcern}
                              onChange={(e) => setOtherConcern(e.target.value)}
                              placeholder="Please describe your concern in detail..."
                              rows={4}
                              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {!showSuccess && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={!isFormValid || loading}
                  onClick={handleSubmit}
                  className={`px-6 py-2.5 rounded-md font-semibold transition ${
                    !isFormValid || loading
                      ? "bg-gray-400 text-gray-300 cursor-not-allowed"
                      : "bg-[#FFD41C] text-[#121C52] hover:bg-[#e6c019]"
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}