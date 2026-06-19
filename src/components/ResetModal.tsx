import React, { useState } from "react";

interface ResetModalProps {
  onClose: () => void;
  onConfirm: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}

export default function ResetModal({ onClose, onConfirm, onToast }: ResetModalProps) {
  const [resetConfirmInput, setResetConfirmInput] = useState("");

  const handleExecuteReset = () => {
    if (resetConfirmInput.trim() === "Reset") {
      onConfirm();
      setResetConfirmInput("");
      onClose();
    } else {
      onToast('Please type "Reset" exactly to confirm system reset execution.', "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 animate-zoom-in">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Reset All Events?</h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            This will revert all <span className="text-emerald-600 font-semibold">Answered</span> and{" "}
            <span className="text-rose-600 font-semibold">Missed</span> records back to{" "}
            <span className="text-amber-600 font-semibold">Pending</span> to allow calling again.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Type <span className="text-slate-900 font-bold">Reset</span> to confirm:
          </label>
          <input
            id="reset-confirm-textbox"
            type="text"
            placeholder="Reset"
            value={resetConfirmInput}
            onChange={(e) => setResetConfirmInput(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-center font-bold tracking-wide placeholder:font-normal placeholder:text-slate-300"
          />
        </div>

        <div className="flex gap-2 justify-end mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="reset-confirm-submit-btn"
            type="button"
            onClick={handleExecuteReset}
            disabled={resetConfirmInput !== "Reset"}
            className={`flex-1 py-2 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm ${
              resetConfirmInput === "Reset"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
