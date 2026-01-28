// client/src/components/UserDashboard/Feedback.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { submitFeedback, getReportToOptions } from "../../services/concernsApi";

export default function Feedback() {
  const { theme, isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [reportTo, setReportTo] = useState("");
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [concernId, setConcernId] = useState("");
  const [reportToOptions, setReportToOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ✅ Fetch report to options when modal opens
  useEffect(() => {
    if (showModal && reportToOptions.length === 0) {
      fetchReportToOptions();
    }
  }, [showModal]);

  const fetchReportToOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getReportToOptions();
      if (response.success) {
        // ✅ Store the full option objects
        setReportToOptions(response.options);
        console.log('✅ Loaded report-to options:', response.options);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
      // Fallback to default options
      setReportToOptions([
        { value: "ITSO", label: "ITSO" },
        { value: "Campus Café", label: "Campus Café" },
        { value: "NU Shuttle Service", label: "NU Shuttle Service" }
      ]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setReportTo("");
    setSubject("");
    setFeedback("");
    setRating(0);
    setHoveredStar(0);
    setShowSuccess(false);
    setConcernId("");
  };

  const handleSubmit = async () => {
    if (!reportTo) {
      return;
    }

    if (rating === 0) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitFeedback({
        reportTo,
        subject: subject || undefined,
        feedback: feedback || undefined,
        rating
      });

      if (response.success) {
        setConcernId(response.concernId);
        setShowSuccess(true);

        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      setShowSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = reportTo && rating > 0;

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
          💬
        </div>

        {/* Header */}
        <div className="relative z-10 mb-3">
          <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide">
            How are we doing?
          </div>
        </div>

        {/* Description */}
        <div className="relative z-10 mb-4">
          <p style={{ color: theme.text.secondary }} className="text-sm">
            Rate your experience and help us improve!
          </p>
        </div>

        {/* Button */}
        <div className="relative z-10">
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: theme.accent.primary,
              color: theme.accent.secondary
            }}
            className="font-semibold px-5 py-2.5 text-sm rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-md"
          >
            Share Feedback
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            style={{
              background: theme.bg.card,
              borderColor: theme.border.primary
            }}
            className="rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border"
          >
            {/* Modal Header */}
            <div
              style={{ borderColor: theme.border.primary }}
              className="p-5 border-b flex justify-between items-center"
            >
              <h3 style={{ color: theme.accent.primary }} className="text-lg font-bold">
                {showSuccess ? "✅ Thank You!" : "💬 Share Your Feedback"}
              </h3>
              <button
                onClick={closeModal}
                style={{ color: theme.text.secondary }}
                className="hover:opacity-75 transition-opacity"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {showSuccess ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 style={{ color: theme.text.primary }} className="text-xl font-bold mb-2">Feedback Submitted!</h4>
                  <p style={{ color: theme.text.secondary }} className="text-sm mb-2">
                    Your feedback will help us improve your experience.
                  </p>
                  {concernId && (
                    <p style={{ color: theme.accent.primary }} className="text-xs font-mono mt-3">
                      Reference ID: {concernId}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Report To Dropdown */}
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block font-semibold text-sm mb-2">
                      Report To: <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                      disabled={submitting || loadingOptions}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFD41C] focus:ring-2 focus:ring-[#FFD41C]/20 disabled:opacity-50 transition-all"
                    >
                      <option value="">
                        {loadingOptions ? 'Loading...' : 'Select department or merchant'}
                      </option>
                      {reportToOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block font-semibold text-sm mb-2">
                      Subject: <span style={{ color: theme.text.tertiary }} className="text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={submitting}
                      placeholder="What would you like to share?"
                      maxLength={100}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                      className="w-full border rounded-lg px-4 py-3 placeholder:text-white/40 focus:outline-none focus:border-[#FFD41C] focus:ring-2 focus:ring-[#FFD41C]/20 disabled:opacity-50 transition-all"
                    />
                    <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">{subject.length}/100 characters</p>
                  </div>

                  {/* Feedback Text Area */}
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block font-semibold text-sm mb-2">
                      Tell us more about your experience: <span style={{ color: theme.text.tertiary }} className="text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={submitting}
                      placeholder="Share your thoughts here..."
                      rows={4}
                      maxLength={500}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                      className="w-full border rounded-lg px-4 py-3 placeholder:text-white/40 focus:outline-none focus:border-[#FFD41C] focus:ring-2 focus:ring-[#FFD41C]/20 resize-none disabled:opacity-50 transition-all"
                    />
                    <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">{feedback.length}/500 characters</p>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block font-semibold text-sm mb-2">
                      How would you rate your overall experience? <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !submitting && setRating(star)}
                          onMouseEnter={() => !submitting && setHoveredStar(star)}
                          onMouseLeave={() => !submitting && setHoveredStar(0)}
                          disabled={submitting}
                          className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-10 h-10"
                            fill={star <= (hoveredStar || rating) ? "#FFD41C" : "none"}
                            stroke="#FFD41C"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p style={{ color: theme.text.secondary }} className="text-xs mt-2 text-center">
                        You rated: {rating} star{rating !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            {!showSuccess && (
              <div
                style={{ borderColor: theme.border.primary }}
                className="flex justify-end gap-3 px-6 py-4 border-t"
              >
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: theme.text.primary
                  }}
                  className="px-6 py-2.5 rounded-lg hover:opacity-80 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  disabled={!isFormValid || submitting}
                  onClick={handleSubmit}
                  style={{
                    background: (!isFormValid || submitting) ? '#6B7280' : theme.accent.primary,
                    color: (!isFormValid || submitting) ? '#D1D5DB' : theme.accent.secondary
                  }}
                  className="px-6 py-2.5 rounded-lg font-semibold transition hover:opacity-90 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}