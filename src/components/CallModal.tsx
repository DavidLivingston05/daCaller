import React from "react";
import { Contact } from "../types";

interface CallModalProps {
  contact: Contact;
  onLogLevel: (outcome: "Answered" | "Missed" | "Cancel") => void;
}

export default function CallModal({ contact, onLogLevel }: CallModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 animate-zoom-in">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Calling via DaCaller...
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1 truncate">
            {contact.name}
          </h3>
          <p className="text-sm font-mono text-slate-500 mt-0.5 select-all">
            {contact.phone}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <button 
            id="call-outcome-answered-btn"
            type="button"
            onClick={() => onLogLevel("Answered")} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
          >
            They Picked Up (Answered)
          </button>
          
          <button 
            id="call-outcome-missed-btn"
            type="button"
            onClick={() => onLogLevel("Missed")} 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm cursor-pointer text-sm"
          >
            Didn't Pick Up (Missed)
          </button>
          
          <button 
            id="call-outcome-cancel-btn"
            type="button"
            onClick={() => onLogLevel("Cancel")} 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-xl transition-colors mt-2 text-xs cursor-pointer"
          >
            Close Window (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
}
