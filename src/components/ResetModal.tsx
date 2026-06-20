import React, { useState } from "react";
import { motion } from "motion/react";

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
      onToast('Type "Reset" exactly to confirm.', "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-700"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset All Events?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            This will revert <span className="text-emerald-600 font-semibold">Answered</span>,{" "}
            <span className="text-rose-600 font-semibold">Missed</span>, and{" "}
            <span className="text-violet-600 font-semibold">Wrong Number</span> records back to{" "}
            <span className="text-amber-600 font-semibold">Pending</span> to allow calling again.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Type <span className="text-slate-900 dark:text-white font-bold">Reset</span> to confirm:
          </label>
          <input id="reset-confirm-textbox" type="text" placeholder="Reset"
            value={resetConfirmInput} onChange={(e) => setResetConfirmInput(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-center font-bold tracking-wide bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
            Cancel
          </button>
          <button id="reset-confirm-submit-btn" type="button" onClick={handleExecuteReset}
            disabled={resetConfirmInput !== "Reset"}
            className={`flex-1 py-2 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 ${
              resetConfirmInput === "Reset"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}>
            Confirm Reset
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
