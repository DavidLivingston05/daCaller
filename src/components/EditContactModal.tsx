import React, { useState, useEffect } from "react";
import { X, User, Phone } from "lucide-react";
import { Contact } from "../types";
import { validateAndFormatIndianPhone, getIndianPhoneCoreDigits } from "../utils/phone";

interface EditContactModalProps {
  contact: Contact;
  onClose: () => void;
  onUpdate: (id: string, name: string, phone: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  contacts: Contact[];
}

export default function EditContactModal({ contact, onClose, onUpdate, onToast, contacts }: EditContactModalProps) {
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);

  useEffect(() => {
    setName(contact.name);
    setPhone(contact.phone);
  }, [contact]);

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
    const existing = contacts.find(c => c.id !== contact.id && getIndianPhoneCoreDigits(c.phone) === coreInput);
    if (existing) {
      onToast(`Duplicate restriction: Phone number already exists for "${existing.name}".`, "error");
      return;
    }

    onUpdate(contact.id, cleanName, formatted);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 animate-zoom-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 text-left">Modify Contact Information</h3>
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
                  id="edit-contact-name-textbox"
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
                  id="edit-contact-phone-textbox"
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
              id="edit-contact-submit-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Apply Edits
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
