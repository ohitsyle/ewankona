import React, { useEffect } from "react";

export default function TransactionDetailsModal({ transaction, onClose }) {
  if (!transaction) return null;

  // ✅ Determine if this is a cash-out
  const isCashOut = transaction.transactionType === 'debit' && 
                    transaction.merchantId && 
                    transaction.viewFor === 'treasury';

  // ✅ Determine if this is a cash-in
  const isCashIn = transaction.transactionType === 'credit' && 
                   !transaction.merchantId;

  useEffect(() => {
    console.log("🔍 Modal opened with transaction data:", {
      transactionId: transaction.transactionId,
      isCashOut,
      isCashIn,
      merchantId: transaction.merchantId,
      userId: transaction.userId,
      adminName: transaction.adminName,
      viewFor: transaction.viewFor
    });
  }, [transaction]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return { bg: "bg-green-100", text: "text-green-500" };
      case "failed":
        return { bg: "bg-red-100", text: "text-red-500" };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-400" };
      case "offline":
        return { bg: "bg-gray-200", text: "text-gray-500" };
      default:
        return { bg: "bg-gray-200", text: "text-gray-500" };
    }
  };

  const statusStyle = getStatusColor(transaction.status);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1E2347] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeInScale shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50/10 border-b-2 border-yellow-400 flex justify-between items-center px-6 py-2 z-10">
          <h3 className="text-yellow-400 font-extrabold text-s uppercase tracking-wide">
            {isCashOut ? 'Merchant Cash-Out Details' : 'Cash-In Details'}
          </h3>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-200 text-red-500 hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Transaction Amount & Status */}
          <div className={`p-5 rounded-xl flex justify-between items-center bg-[#2A2F5D]`}>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-2">
                Transaction Amount
              </p>
              <p className={`text-3xl font-bold ${isCashOut ? 'text-red-400' : 'text-green-400'}`}>
                {isCashOut ? '- ' : '+ '}₱{parseFloat(transaction.amount).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-2">Status</p>
              <span
                className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Transaction Information Card */}
          <div className="p-5 rounded-xl bg-[#2A2F5D]">
            <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
              Transaction Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                  Transaction ID
                </label>
                <p className="text-[13px] font-mono text-white break-all bg-black/20 p-2 rounded-md">
                  {transaction.transactionId || transaction.id}
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                  Type
                </label>
                <p className={`text-[13px] font-bold uppercase ${
                  isCashOut ? "text-red-500" : "text-green-500"
                }`}>
                  {isCashOut ? "Merchant Cash-Out" : "Cash-In"}
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                  Date & Time
                </label>
                <p className="text-[13px] font-semibold text-white">
                  {transaction.date} at {transaction.time}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Conditional Info based on transaction type */}
          {isCashOut ? (
            /* Merchant Cash-Out Info */
            <div className="p-5 rounded-xl bg-[#2A2F5D]">
              <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
                Merchant Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Merchant ID
                  </label>
                  <p className="text-sm font-semibold text-white">{transaction.merchantId || transaction.idNumber}</p>
                </div>
                {transaction.description && (
                  <div className="col-span-2">
                    <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Description
                    </label>
                    <p className="text-sm font-semibold text-white break-all">{transaction.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Cash-In User Info */
            <div className="p-5 rounded-xl bg-[#2A2F5D]">
              <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
                User Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    ID Number
                  </label>
                  <p className="text-sm font-semibold text-white">{transaction.idNumber}</p>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Name
                  </label>
                  <p className="text-sm font-semibold text-white">{transaction.userName || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Email
                  </label>
                  <p className="text-sm font-semibold text-white break-all">{transaction.email || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Admin Information (always shown for treasury transactions) */}
          {transaction.adminName && (
            <div className="p-5 rounded-xl bg-[#2A2F5D]">
              <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
                {isCashOut ? "Processed By (Treasury Admin)" : "Processed By"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Admin Name
                  </label>
                  <p className="text-sm font-semibold text-white">{transaction.adminName}</p>
                </div>
                {transaction.adminEmail && (
                  <div className="col-span-2">
                    <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Admin Email
                    </label>
                    <p className="text-sm font-semibold text-white break-all">{transaction.adminEmail}</p>
                  </div>
                )}
                {transaction.adminSchoolId && (
                  <div>
                    <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Admin School ID
                    </label>
                    <p className="text-sm font-semibold text-white">{transaction.adminSchoolId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fadeInScale {
            animation: fadeInScale 0.3s ease forwards;
          }
        `}
      </style>
    </div>
  );
}