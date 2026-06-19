import React, { useState } from "react";
import { X, Upload } from "lucide-react";
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
      if (
        firstLineLower.includes("name") || 
        firstLineLower.includes("phone") || 
        firstLineLower.includes("number") || 
        firstLineLower.includes("status")
      ) {
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
          parsed.push({
            id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            name,
            phone: isValid ? formatted : phone,
            status: finalStatus
          });
        }
      }
    });

    return parsed;
  };

  const handleManualCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvPasteText.trim()) {
      onToast("Format error: Empty input text.", "error");
      return;
    }
    const parsed = parseCSVData(csvPasteText);
    if (parsed.length > 0) {
      onImportParsed(parsed);
      onToast(`Successfully imported ${parsed.length} contacts!`, "success");
      setCsvPasteText("");
      onClose();
    } else {
      onToast("No valid contacts found. Check CSV format guidelines.", "error");
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
          onToast(`Successfully imported ${parsed.length} contacts!`, "success");
          onClose();
        } else {
          onToast("No valid contacts found inside uploaded CSV.", "error");
        }
      }
    };
    reader.onerror = () => {
      onToast("Error processing file.", "error");
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file path pointer
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-100 max-h-[90vh] overflow-y-auto animate-zoom-in">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Bulk Import Recipients</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">Upload data logs or copy-paste CSV records.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILE UPLOAD INTEGRATION */}
        <div className="border border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center relative group">
          <input 
            type="file" 
            accept=".csv,text/csv,text/plain" 
            onChange={handleCSVFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700 block">Click to upload CSV</span>
              <span className="text-xs text-slate-400 block mt-0.5">Supports standard .csv lists</span>
            </div>
          </div>
        </div>

        {/* OR DIVIDER */}
        <div className="flex items-center gap-3 my-0.5">
          <hr className="flex-1 border-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">or paste csv rows</span>
          <hr className="flex-1 border-slate-200" />
        </div>

        {/* OPTION 2: RAW TEXT PASTING PANEL */}
        <form onSubmit={handleManualCSVSubmit} className="flex flex-col gap-3">
          <div>
            <textarea
              id="raw-csv-textbox"
              rows={4}
              placeholder={`Name, Phone, Status
Timothy, +91 99400 55667, Pending
Phoebe, +91 93810 77889, Answered
Stephen, +91 97900 11224, Missed`}
              value={csvPasteText}
              onChange={(e) => setCsvPasteText(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 bg-slate-50/20"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 flex flex-col gap-1 leading-normal select-none">
            <span className="font-semibold text-slate-700">CSV Guidelines:</span>
            <p>Format follow: <code className="bg-white px-1 py-0.5 border rounded font-mono text-[10px] text-emerald-700">Name, Phone, Status</code>.</p>
            <p>Example: <code className="font-mono text-slate-600 block bg-slate-100 p-1 rounded">Pastor Mark, +91 9876543210, Pending</code></p>
          </div>

          <div className="flex gap-2 justify-between items-center mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ⚡ Load Demo
            </button>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                id="csv-import-submit-btn"
                type="submit" 
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Import Text
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
