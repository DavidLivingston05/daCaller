import React, { useState } from "react";
import { X, User, Phone } from "lucide-react";
import { validateAndFormatIndianPhone, getIndianPhoneCoreDigits } from "../utils/phone";
import { Contact } from "../types";

interface AddContactModalProps {
  onClose: () => void;
  onAdd: (name: string, phone: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  contacts: Contact[];
}

export default function AddContactModal({ onClose, onAdd, onToast, contacts }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const rawPhone = phone.trim();

    if (!cleanName || !rawPhone) {
      onToast("Name and Phone fields are required.", "error");
      return;
    }

    const { isValid, formatted, error } = validateAndFormatIndianPhone(rawPhone);
    if (!isValid) {
      onToast(error || "Invalid Indian phone format. Must contain 10 digits.", "error");
      return;
    }

    // Duplicate check
    const coreInput = getIndianPhoneCoreDigits(formatted);
    const existing = contacts.find(c => getIndianPhoneCoreDigits(c.phone) === coreInput);
    if (existing) {
      onToast(`Duplicate restriction: Phone number already exists for "${existing.name}".`, "error");
      return;
    }

    onAdd(cleanName, formatted);
    setName("");
    setPhone("");
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 animate-zoom-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 text-left">Add New Contact</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DETAILS FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 text-left">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="add-contact-name-textbox"
                  type="text"
                  required
                  placeholder="e.g. Pastor Mark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 text-left">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="add-contact-phone-textbox"
                  type="text"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/20 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="add-contact-submit-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
