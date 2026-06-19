import React from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div
      id="toast-notification"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-sm rounded-xl shadow-xl border p-4 transition-all duration-300 flex items-start gap-3 animate-bounce-short bg-white ${
        type === "success" 
          ? "border-emerald-100 bg-[#FCFDFD]" 
          : "border-rose-100 bg-[#FDFCFc]"
      }`}
    >
      <div 
        className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
          type === "success" 
            ? "bg-emerald-50 text-emerald-600" 
            : "bg-rose-50 text-rose-600"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 leading-snug">{message}</p>
      </div>

      <button 
        id="toast-close-btn"
        type="button" 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
