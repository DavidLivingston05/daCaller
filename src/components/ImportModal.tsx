import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import { motion } from "motion/react";
import { Contact } from "../types";
import { validateAndFormatIndianPhone } from "../utils/phone";

interface ImportModalProps {
  onClose: () => void;
  onImportParsed: (parsed: Contact[]) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  onLoadDemo: () => void;
}

export default function ImportModal({ onClose, onImportParsed, onToast, onLoadDemo }: ImportModalProps) {
  const [csvPasteText, setCsvPasteText] = useState("");

  const parseCSVData = (text: string): Contact[] => {
    const lines = text.split(/\r?\n/);
    const parsed: Contact[] = [];
    let startLine = 0;
    if (lines.length > 0) {
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes("name") || firstLineLower.includes("phone") || firstLineLower.includes("number") || firstLineLower.includes("status")) {
        startLine = 1;
      }
    }
    lines.slice(startLine).forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const cols = trimmed.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length >= 2) {
        const name = cols[0].replace(/^["']|["']$/g, "").trim();
        const phone = cols[1].replace(/^["']|["']$/g, "").trim();
        const statusVal = cols[2] ? cols[2].replace(/^["']|["']$/g, "").trim() : "Pending";
        let finalStatus: 'Pending' | 'Answered' | 'Missed' = "Pending";
        if (statusVal.toLowerCase() === "answered") finalStatus = "Answered";
        if (statusVal.toLowerCase() === "missed") finalStatus = "Missed";
        if (name && phone) {
          const { isValid, formatted } = validateAndFormatIndianPhone(phone);
          parsed.push({ id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`, name, phone: isValid ? formatted : phone, status: finalStatus });
        }
      }
    });
    return parsed;
  };

  const handleManualCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvPasteText.trim()) {
      onToast("Empty input text.", "error");
      return;
    }
    const parsed = parseCSVData(csvPasteText);
    if (parsed.length > 0) {
      onImportParsed(parsed);
      onToast(`Imported ${parsed.length} contacts!`, "success");
      setCsvPasteText("");
      onClose();
    } else {
      onToast("No valid contacts found.", "error");
    }
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) {
          onImportParsed(parsed);
          onToast(`Imported ${parsed.length} contacts!`, "success");
          onClose();
        } else {
          onToast("No valid contacts found in CSV.", "error");
        }
      }
    };
    reader.onerror = () => onToast("Error processing file.", "error");
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Import Recipients</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload CSV or paste records.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-center relative group mt-4">
          <input type="file" accept=".csv,text/csv,text/plain" onChange={handleCSVFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Click to upload CSV</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">Supports .csv files</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 my-3">
          <hr className="flex-1 border-slate-200 dark:border-slate-600" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">or paste rows</span>
          <hr className="flex-1 border-slate-200 dark:border-slate-600" />
        </div>

        <form onSubmit={handleManualCSVSubmit} className="flex flex-col gap-3">
          <textarea
            id="raw-csv-textbox"
            rows={4}
            placeholder={`Name, Phone, Status\nTimothy, +91 99400 55667, Pending`}
            value={csvPasteText}
            onChange={(e) => setCsvPasteText(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/20 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-400"
          />

          <div className="flex gap-2 justify-between items-center flex-wrap">
            <button type="button" onClick={() => { onLoadDemo(); onClose(); }} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              ⚡ Load Demo
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
                Cancel
              </button>
              <button id="csv-import-submit-btn" type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95">
                Import Text
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
