import React from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <motion.div
      id="toast-notification"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-sm rounded-xl shadow-xl border p-4 flex items-start gap-3 bg-white dark:bg-slate-800 ${
        type === "success"
          ? "border-emerald-100 dark:border-emerald-800"
          : "border-rose-100 dark:border-rose-800"
      }`}
    >
      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
        type === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
      }`}>
        {type === "success" ? <CheckCircle className="w-4 h-4 stroke-[2.5]" /> : <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{message}</p>
      </div>

      <button id="toast-close-btn" type="button" onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
