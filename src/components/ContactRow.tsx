import React from "react";
import { Phone, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Contact } from "../types";

interface ContactRowProps {
  key?: React.Key;
  contact: Contact;
  onCall: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ContactRow({ contact, onCall, onEdit, onDelete }: ContactRowProps) {
  let badgeStyle = "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-700";
  if (contact.status === "Answered") {
    badgeStyle = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700";
  } else if (contact.status === "Missed") {
    badgeStyle = "bg-rose-50/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-700";
  }

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
      <div
        id={`contact-item-${contact.id}`}
        className="bg-white dark:bg-slate-800 relative z-10 p-4 flex items-center justify-between shadow-sm border-b border-transparent transition-colors group hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
      >
        <div
          onClick={() => onCall(contact)}
          className="flex-1 min-w-0 pr-3 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
              {contact.name}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
              {contact.status}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{contact.phone}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button id={`edit-contact-btn-${contact.id}`} type="button" onClick={() => onEdit(contact)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-90"
            title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button id={`delete-contact-btn-${contact.id}`} type="button" onClick={() => onDelete(contact.id, contact.name)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-90"
            title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          <button id={`trigger-call-btn-${contact.id}`} type="button" onClick={() => onCall(contact)}
            className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-all cursor-pointer flex items-center justify-center ml-1 active:scale-90"
            title="Call">
            <Phone className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
