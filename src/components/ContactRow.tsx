import React from "react";
import { Phone, Pencil, Trash2 } from "lucide-react";
import { Contact } from "../types";

interface ContactRowProps {
  key?: React.Key;
  contact: Contact;
  onCall: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ContactRow({ contact, onCall, onEdit, onDelete }: ContactRowProps) {
  // Status-based high visibility Indian-market style configurations
  let badgeStyle = "bg-amber-50 text-amber-800 border-amber-200/60";
  if (contact.status === "Answered") {
    badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200/60";
  } else if (contact.status === "Missed") {
    badgeStyle = "bg-rose-50/60 text-rose-800 border-rose-200/60";
  }

  return (
    <div 
      className="relative overflow-hidden bg-slate-50 border border-slate-100 rounded-xl"
      style={{ contentVisibility: "auto" }}
    >
      {/* FOREGROUND CARDBACK */}
      <div
        id={`contact-item-${contact.id}`}
        className="bg-white relative z-10 p-4 flex items-center justify-between shadow-sm border-b border-transparent transition-colors group hover:bg-slate-50/50"
      >
        {/* Contact Info (Click to Call) */}
        <div 
          onClick={() => onCall(contact)}
          className="flex-1 min-w-0 pr-3 cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-base group-hover:text-emerald-600 transition-colors truncate">
              {contact.name}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
              {contact.status}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{contact.phone}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id={`edit-contact-btn-${contact.id}`}
            type="button"
            onClick={() => onEdit(contact)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 rounded-lg transition-all cursor-pointer flex items-center justify-center"
            title="Edit Profile"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          <button
            id={`delete-contact-btn-${contact.id}`}
            type="button"
            onClick={() => onDelete(contact.id, contact.name)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center justify-center"
            title="Delete Recipient"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            id={`trigger-call-btn-${contact.id}`}
            type="button"
            onClick={() => onCall(contact)}
            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer flex items-center justify-center ml-1"
            title="Telephony Standard Dial"
          >
            <Phone className="w-4 h-4 fill-current text-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
