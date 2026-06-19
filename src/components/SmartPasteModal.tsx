import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { validateAndFormatIndianPhone, getIndianPhoneCoreDigits } from "../utils/phone";
import { Contact } from "../types";

interface SmartPasteModalProps {
  onKeepValidPlaceholder?: string;
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

    // Regexp to isolate modern standard phone structures with optional code prefixes
    const phoneRegex = /(\+?[\d\s-]{7,17})/;
    const phoneMatch = rawText.match(phoneRegex);

    if (!phoneMatch) {
      onToast("Could not find a valid number prefix. Format correctly.", "error");
      return;
    }

    const isolatedPhone = phoneMatch[0].trim();

    const { isValid, formatted, error } = validateAndFormatIndianPhone(isolatedPhone);
    if (!isValid) {
      onToast(error || "Invalid parsed Indian number. Must contain 10 digits.", "error");
      return;
    }

    // Duplicate check
    const coreInput = getIndianPhoneCoreDigits(formatted);
    const existing = contacts.find(c => getIndianPhoneCoreDigits(c.phone) === coreInput);
    if (existing) {
      onToast(`Duplicate restriction: Phone number already exists for "${existing.name}".`, "error");
      return;
    }
    
    // Purge clean phone delimiters to generate name
    let isolatedName = rawText
      .replace(isolatedPhone, "")
      .replace(/[:,;-]/g, "")
      .trim();


    // Default fallbacks in case name was omitted or empty
    if (!isolatedName) {
      isolatedName = "Quick Added Contact";
    }

    onAddParsed(isolatedName, formatted);
    setInputText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 animate-zoom-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Sparkles className="w-5 h-5 fill-emerald-100" />
            <h3 className="text-lg font-bold text-slate-900">⚡ Smart Quick Add</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Paste any text string containing a name and dial number. Our smart engine will parse and extract it.
        </p>

        {/* INPUT FORM CONTAINER */}
        <form onSubmit={handleParseAndAdd} className="flex flex-col gap-3">
          <div>
            <textarea
              id="smart-paste-textbox"
              rows={3}
              placeholder="e.g. Brother Thomas +91 98401 22334"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-slate-300 placeholder:font-normal bg-slate-50/30"
              required
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/80 text-[11px] text-slate-500 flex flex-col gap-1 leading-normal select-none">
            <span className="font-semibold text-slate-700">Supported Formats:</span>
            <span>✓ Name followed by number matching standard codes</span>
            <span>✓ Delimiters like colons and commas automatically filtered out</span>
          </div>

          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="smart-paste-submit-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Parse & Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
