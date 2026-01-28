// client/src/components/TreasuryMerchants/CashOutModal.jsx
import React, { useState } from "react";
import { X, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { processCashOut } from "../../services/merchantApi";
import { toast } from "react-toastify";

export default function CashOutModal({ merchant, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const maxAmount = merchant.balance || 0;
  const quickAmounts = [1000, 2000, 5000, 10000];

  const handleQuickAmount = (amt) => setAmount(amt.toString());
  const handleMaxAmount = () => setAmount(maxAmount.toString());

  const handleNext = () => {
    const amt = parseFloat(amount);

    if (!amount || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amt > maxAmount) {
      toast.error(
        `Amount cannot exceed available balance (₱${maxAmount.toLocaleString()})`
      );
      return;
    }

    setStep(2);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const response = await processCashOut(
        merchant.merchantId || merchant.id,
        parseFloat(amount),
        notes
      );

      if (response.success) {
        setTransactionDetails(response.transaction);
        setStep(3);
        toast.success("Cash out processed successfully!");
      } else {
        toast.error(response.message || "Cash out failed");
      }
    } catch (error) {
      console.error("Cash out error:", error);
      toast.error(error.message || "Failed to process cash out");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-yellow-400">
                Process Cash Out
              </h2>
              <p className="text-sm text-white/60">{merchant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 py-6 bg-slate-900/50">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? "text-yellow-400" : "text-slate-500"}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? "bg-yellow-400 text-slate-900"
                      : "bg-slate-700 border border-slate-600"
                  }`}
                >
                  {s}
                </div>
                <span className="hidden sm:inline font-semibold">
                  {s === 1 ? "Amount" : s === 2 ? "Confirm" : "Complete"}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-12 sm:w-24 h-1 rounded ${step > s ? "bg-yellow-400" : "bg-slate-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="text-white/60 text-sm">Available Balance</div>
                <div className="text-3xl font-bold text-green-400">
                  ₱{maxAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">
                  Cash Out Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-yellow-400 outline-none"
                />

                <div className="flex gap-2 mt-3">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      disabled={amt > maxAmount}
                      className={`flex-1 py-2 rounded-lg ${
                        amt > maxAmount
                          ? "bg-slate-700/50 text-slate-500"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                    >
                      ₱{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={handleMaxAmount}
                    className="flex-1 py-2 rounded-lg bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 text-white border border-slate-600 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 py-3 bg-yellow-400 rounded-xl font-bold text-slate-900"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
                <AlertCircle className="inline mr-2 text-yellow-400" />
                Confirm details before proceeding.
              </div>

              <div className="bg-slate-900/50 p-6 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Merchant</span>
                  <span className="font-semibold">{merchant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className="font-bold text-yellow-400">
                    ₱{parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Remaining Balance</span>
                  <span className="text-green-400">
                    ₱{(maxAmount - parseFloat(amount)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Notes</span>
                  <span>{notes || "—"}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-700 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-yellow-400 rounded-xl font-bold text-slate-900"
                >
                  {loading ? "Processing..." : "Confirm Cash Out"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold text-green-400">
                Cash Out Successful
              </h3>

              <div className="bg-slate-900/50 rounded-xl p-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Transaction ID</span>
                  <span>{transactionDetails?.id || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className="text-yellow-400 font-bold">
                    ₱{parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 bg-green-500 rounded-xl font-bold text-slate-900"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
