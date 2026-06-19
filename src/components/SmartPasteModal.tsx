import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { validateAndFormatIndianPhone, getIndianPhoneCoreDigits } from "../utils/phone";
import { Contact } from "../types";

interface SmartPasteModalProps {
  onClose: () => void;
  onAddParsed: (name: string, phone: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  contacts: Contact[];
}

export default function SmartPasteModal({ onClose, onAddParsed, onToast, contacts }: SmartPasteModalProps) {
  const [inputText, setInputText] = useState("");

  const handleParseAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = inputText.trim();
    if (!rawText) {
      onToast("Please enter a valid line format.", "error");
      return;
    }

    const phoneRegex = /(\+?[\d\s-]{7,17})/;
    const phoneMatch = rawText.match(phoneRegex);

    if (!phoneMatch) {
      onToast("Could not find a valid number.", "error");
      return;
    }

    const isolatedPhone = phoneMatch[0].trim();
    const { isValid, formatted, error } = validateAndFormatIndianPhone(isolatedPhone);
    if (!isValid) {
      onToast(error || "Invalid parsed Indian number.", "error");
      return;
    }

    const coreInput = getIndianPhoneCoreDigits(formatted);
    const existing = contacts.find(c => getIndianPhoneCoreDigits(c.phone) === coreInput);
    if (existing) {
      onToast(`Duplicate: Number already exists for "${existing.name}".`, "error");
      return;
    }

    let isolatedName = rawText.replace(isolatedPhone, "").replace(/[:,;-]/g, "").trim();
    if (!isolatedName) {
      isolatedName = "Quick Added Contact";
    }

    onAddParsed(isolatedName, formatted);
    setInputText("");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Sparkles className="w-5 h-5 fill-emerald-100" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">⚡ Smart Quick Add</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
          Paste any text containing a name and number. Our smart engine will parse and extract it.
        </p>

        <form onSubmit={handleParseAndAdd} className="flex flex-col gap-3 mt-4">
          <textarea
            id="smart-paste-textbox"
            rows={3}
            placeholder="e.g. Brother Thomas +91 98401 22334"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/30 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-400"
            required
          />

          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-600 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-1 leading-normal select-none">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Supported Formats:</span>
            <span>✓ Name followed by number</span>
            <span>✓ Delimiters like colons and commas filtered out</span>
          </div>

          <div className="flex gap-2 justify-end mt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
              Cancel
            </button>
            <button id="smart-paste-submit-btn" type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95">
              Parse & Add
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
