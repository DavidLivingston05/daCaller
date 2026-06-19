import React from "react";
import { motion } from "motion/react";
import { Contact } from "../types";
import { PhoneCall, PhoneMissed, X } from "lucide-react";

interface CallModalProps {
  contact: Contact;
  onLogLevel: (outcome: "Answered" | "Missed" | "Cancel") => void;
}

export default function CallModal({ contact, onLogLevel }: CallModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneCall className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">{contact.name}</h3>
          <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1 select-all">{contact.phone}</p>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button id="call-outcome-answered-btn" type="button" onClick={() => onLogLevel("Answered")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
            <PhoneCall className="w-4 h-4" />
            They Picked Up (Answered)
          </button>
          <button id="call-outcome-missed-btn" type="button" onClick={() => onLogLevel("Missed")}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
            <PhoneMissed className="w-4 h-4" />
            Didn't Pick Up (Missed)
          </button>
          <button id="call-outcome-cancel-btn" type="button" onClick={() => onLogLevel("Cancel")}
            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium py-3 rounded-xl transition-all mt-1 text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]">
            <X className="w-3.5 h-3.5" />
            Close Window (Cancel)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
