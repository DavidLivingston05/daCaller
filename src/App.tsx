import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Search, X, Plus, MoreVertical, Sparkles, Download, Database, Moon, Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Contact } from "./types";
import { getIndianPhoneCoreDigits } from "./utils/phone";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import { useTheme } from "./hooks/useTheme";

import Toast from "./components/Toast";
import ContactRow from "./components/ContactRow";
import SmartPasteModal from "./components/SmartPasteModal";
import ResetModal from "./components/ResetModal";
import ImportModal from "./components/ImportModal";
import AddContactModal from "./components/AddContactModal";
import EditContactModal from "./components/EditContactModal";
import CallModal from "./components/CallModal";

const INITIAL_CONTACTS: Contact[] = [
  { id: "1", name: "Pastor Elkhana", phone: "+91 98401 23456", status: "Pending" },
  { id: "2", name: "Sister Abigail", phone: "+91 94440 98765", status: "Answered" },
  { id: "3", name: "Brother Barnabas", phone: "+91 91235 55432", status: "Pending" },
  { id: "4", name: "Deacon Joshua", phone: "+91 98840 11223", status: "Missed" },
  { id: "5", name: "Sister Naomi", phone: "+91 81220 44556", status: "Pending" }
];

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem("outreach_contacts");
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_CONTACTS; }
    }
    return INITIAL_CONTACTS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Answered" | "Missed">("All");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSmartPasteModalOpen, setIsSmartPasteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [callingContact, setCallingContact] = useState<Contact | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sortBy, setSortBy] = useState<"Status" | "Name" | "Recent">("Status");

  useEffect(() => {
    localStorage.setItem("outreach_contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const triggerToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 800));
    triggerToast("Contact list refreshed!", "success");
  }, [triggerToast]);

  const { pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

  const filteredContacts = useMemo(() => contacts
    .filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = c.name.toLowerCase().includes(query) || c.phone.replace(/\s+/g, "").includes(query.replace(/\s+/g, ""));
      if (activeTab === "All") return matchesSearch;
      return matchesSearch && c.status === activeTab;
    })
    .sort((a, b) => {
      if (sortBy === "Status") {
        const priority: Record<string, number> = { "Pending": 1, "Missed": 2, "Answered": 3 };
        const valA = priority[a.status] || 4;
        const valB = priority[b.status] || 4;
        if (valA !== valB) return valA - valB;
        return a.name.localeCompare(b.name);
      } else if (sortBy === "Name") {
        return a.name.localeCompare(b.name);
      } else {
        return b.id.localeCompare(a.id);
      }
    }), [contacts, searchQuery, activeTab, sortBy]);

  const completedCount = useMemo(() => contacts.filter((c) => c.status !== "Pending").length, [contacts]);
  const progressPercentage = useMemo(() => contacts.length > 0 ? Math.round((completedCount / contacts.length) * 100) : 0, [contacts, completedCount]);

  const counts = useMemo(() => ({
    all: contacts.length,
    pending: contacts.filter((c) => c.status === "Pending").length,
    answered: contacts.filter((c) => c.status === "Answered").length,
    missed: contacts.filter((c) => c.status === "Missed").length
  }), [contacts]);

  const handleInitiateCall = useCallback((contact: Contact) => {
    setCallingContact(contact);
    const cleanNumber = contact.phone.replace(/[^+\d]/g, "");
    window.location.href = `tel:${cleanNumber}`;
  }, []);

  const handleLogCallOutcome = useCallback((outcome: "Answered" | "Missed" | "Cancel") => {
    if (!callingContact) return;
    if (outcome === "Cancel") {
      setCallingContact(null);
      return;
    }
    setContacts((prev) =>
      prev.map((c) => (c.id === callingContact.id ? { ...c, status: outcome } : c))
    );
    triggerToast(`Logged outreach outcome as ${outcome}!`, "success");
    setCallingContact(null);
  }, [callingContact, triggerToast]);

  const handleImportParsedContacts = useCallback((importedList: Contact[]) => {
    let skippedCount = 0;
    setContacts((prev) => {
      const existingCores = new Set(prev.map((c) => getIndianPhoneCoreDigits(c.phone)));
      const filteredIncoming: Contact[] = [];
      importedList.forEach((item) => {
        const core = getIndianPhoneCoreDigits(item.phone);
        if (existingCores.has(core)) {
          skippedCount++;
        } else {
          existingCores.add(core);
          filteredIncoming.push(item);
        }
      });
      setTimeout(() => {
        if (skippedCount > 0) {
          triggerToast(`Loaded ${filteredIncoming.length} new leads. ${skippedCount} duplicates filtered out.`, "success");
        } else {
          triggerToast(`Successfully imported ${filteredIncoming.length} contacts!`, "success");
        }
      }, 50);
      return [...prev, ...filteredIncoming];
    });
  }, [triggerToast]);

  const getDuplicateCount = useCallback(() => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      coreCount[core] = (coreCount[core] || 0) + 1;
    });
    let totalDuplicates = 0;
    Object.keys(coreCount).forEach((core) => {
      if (coreCount[core] > 1) totalDuplicates += coreCount[core] - 1;
    });
    return totalDuplicates;
  }, [contacts]);

  const getDuplicateContacts = useCallback((): Contact[] => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      coreCount[core] = (coreCount[core] || 0) + 1;
    });
    return contacts.filter((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      return coreCount[core] > 1;
    });
  }, [contacts]);

  const totalDuplicates = useMemo(() => getDuplicateCount(), [getDuplicateCount]);

  const handleDeduplicateList = useCallback(() => {
    const coreSeen = new Set<string>();
    const keptContacts: Contact[] = [];
    const priority: Record<string, number> = { "Answered": 1, "Missed": 2, "Pending": 3 };
    const sortedToResolve = [...contacts].sort((a, b) => {
      const valA = priority[a.status] || 4;
      const valB = priority[b.status] || 4;
      return valA - valB;
    });
    sortedToResolve.forEach((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      if (!coreSeen.has(core)) {
        coreSeen.add(core);
        keptContacts.push(c);
      }
    });
    const keptIds = new Set(keptContacts.map((c) => c.id));
    const finalContacts = contacts.filter((c) => keptIds.has(c.id));
    setContacts(finalContacts);
    triggerToast(`Removed ${contacts.length - finalContacts.length} duplicate entries!`, "success");
  }, [contacts, triggerToast]);

  const handleLoadDemoOutreachList = useCallback(() => {
    const demoItems: Contact[] = [
      { id: `demo-${Date.now()}-1`, name: "Evangelist Timothy", phone: "+91 99400 55667", status: "Pending" },
      { id: `demo-${Date.now()}-2`, name: "Sister Phoebe", phone: "+91 93810 77889", status: "Pending" },
      { id: `demo-${Date.now()}-3`, name: "Brother Stephen", phone: "+91 97900 11224", status: "Pending" }
    ];
    setContacts((prev) => [...prev, ...demoItems]);
    triggerToast("Loaded demo list templates!", "success");
  }, [triggerToast]);

  const handleSmartAddParsed = useCallback((name: string, phone: string) => {
    const smartContact: Contact = { id: `smart-${Date.now()}`, name, phone, status: "Pending" };
    setContacts((prev) => [smartContact, ...prev]);
    triggerToast(`Smart parsed & added "${name}" to dialer!`, "success");
  }, [triggerToast]);

  const handleManualAddContact = useCallback((name: string, phone: string) => {
    const newContact: Contact = { id: `manual-${Date.now()}`, name, phone, status: "Pending" };
    setContacts((prev) => [newContact, ...prev]);
    triggerToast(`Saved new member "${name}" successfully.`, "success");
  }, [triggerToast]);

  const handleUpdateContactDetails = useCallback((id: string, name: string, phone: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, name, phone } : c)));
    triggerToast("Updated member details successfully.", "success");
    setEditingContact(null);
  }, [triggerToast]);

  const handleDeleteContactFromLedger = useCallback((id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from outreach list permanently?`)) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      triggerToast("Contact record deleted.", "success");
    }
  }, [triggerToast]);

  const handleExecuteEventsReset = useCallback(() => {
    setContacts((prev) => prev.map((c) => (c.status !== "Pending" ? { ...c, status: "Pending" } : c)));
    triggerToast("Reset all contact events to Pending!", "success");
  }, [triggerToast]);

  const handleExportBackup = useCallback(() => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
      const anchorNode = document.createElement("a");
      anchorNode.setAttribute("href", dataStr);
      anchorNode.setAttribute("download", `DaCaller_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(anchorNode);
      anchorNode.click();
      anchorNode.remove();
      triggerToast("Database backup exported safely!", "success");
      setIsActionMenuOpen(false);
    } catch { triggerToast("Backup generation error.", "error"); }
  }, [contacts, triggerToast]);

  const handleRestoreBackup = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);
        if (Array.isArray(parsed)) {
          const isValid = parsed.every(
            (item) => typeof item.name === "string" && typeof item.phone === "string" && typeof item.status === "string"
          );
          if (isValid) {
            setContacts(parsed);
            triggerToast("Database restored from JSON!", "success");
          } else {
            triggerToast("JSON validation failed.", "error");
          }
        } else {
          triggerToast("JSON backup format error.", "error");
        }
      } catch { triggerToast("Invalid format, failed parsing JSON.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
    setIsActionMenuOpen(false);
  }, [triggerToast]);

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased font-sans relative pb-16 transition-colors duration-200"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm transition-all"
          style={{ height: Math.min(pullDistance, 60) }}
        >
          <motion.div
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
            className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
          />
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div id="app" className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white select-none">DaCaller</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5 select-none">Active Dialer</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              id="smart-add-trigger-btn"
              type="button"
              onClick={() => setIsSmartPasteModalOpen(true)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              <span>Smart Add</span>
            </button>
            <button
              id="manual-add-trigger-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 inline-block mr-0.5" />
              Member
            </button>
          </div>
        </div>

        <motion.div
          layout
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2.5"
        >
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
            <span>Session Progress</span>
            <span className="text-slate-700 dark:text-slate-300">{completedCount} / {contacts.length} Completed ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <motion.div
              layout
              style={{ width: `${progressPercentage}%` }}
              className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        </motion.div>

        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              id="search-input-ledger"
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {totalDuplicates > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 shadow-xs flex flex-col gap-2 overflow-hidden"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Duplicated Numbers</h4>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 leading-relaxed mt-0.5">
                    Found <strong>{totalDuplicates} duplicate{totalDuplicates > 1 ? "s" : ""}</strong> in your database.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDeduplicateList}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Clean & Merge Duplicates
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2 shadow-sm">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none" id="filterTabs">
            {(["All", "Pending", "Missed", "Answered"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const colorMap: Record<string, string> = {
                All: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm",
                Pending: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 shadow-sm",
                Missed: "bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-700 shadow-sm",
                Answered: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 shadow-sm"
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? colorMap[tab]
                      : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {tab} ({counts[tab.toLowerCase() as keyof typeof counts]})
                </button>
              );
            })}
          </div>

          <div className="relative inline-block text-left shrink-0" ref={actionMenuRef}>
            <button
              id="action-dropdown-btn"
              type="button"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-all cursor-pointer flex items-center justify-center"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isActionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  id="backups-actionMenu"
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-40 py-1 flex flex-col items-start"
                >
                  <button type="button" onClick={() => { setIsImportModalOpen(true); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer">
                    🚀 Bulk Import CSV
                  </button>
                  <button type="button" onClick={handleExportBackup} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download Backup (.json)</span>
                  </button>
                  <button type="button" onClick={() => backupInputRef.current?.click()} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restore Backup (.json)</span>
                  </button>
                  <input type="file" ref={backupInputRef} accept=".json" onChange={handleRestoreBackup} className="hidden" />
                  <button type="button" onClick={() => { handleDeduplicateList(); setIsActionMenuOpen(false); }}
                    disabled={getDuplicateContacts().length === 0}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 ${
                      getDuplicateContacts().length > 0
                        ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer"
                        : "text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-800/50 cursor-not-allowed"
                    }`}>
                    ✨ Merge Duplicates {getDuplicateContacts().length > 0 ? `(${totalDuplicates})` : ""}
                  </button>
                  <button type="button" onClick={() => { setIsResetModalOpen(true); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-semibold transition-colors border-t border-slate-100 dark:border-slate-700 cursor-pointer">
                    🔄 Reset Events
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl flex justify-between items-center gap-2 select-none">
          <span className="truncate">Viewing {filteredContacts.length} of {contacts.length} members</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold">Sort:</span>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "Status" | "Name" | "Recent")}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs hover:border-slate-300 transition-colors"
            >
              <option value="Status">By Status</option>
              <option value="Name">Name A-Z</option>
              <option value="Recent">Recently Added</option>
            </select>
            {contacts.length === 0 && (
              <button type="button" onClick={() => { setContacts(INITIAL_CONTACTS); triggerToast("Restored template contacts!", "success"); }} className="text-emerald-600 hover:underline font-bold ml-1">
                Restore
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3" id="main-contact-waterfall-list">
          {filteredContacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-xs select-none"
            >
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No matching outreach entries found</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredContacts.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <ContactRow
                    contact={contact}
                    onCall={handleInitiateCall}
                    onEdit={(c) => setEditingContact(c)}
                    onDelete={handleDeleteContactFromLedger}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isSmartPasteModalOpen && (
          <SmartPasteModal onClose={() => setIsSmartPasteModalOpen(false)} onAddParsed={handleSmartAddParsed} onToast={triggerToast} contacts={contacts} />
        )}
        {isResetModalOpen && (
          <ResetModal onClose={() => setIsResetModalOpen(false)} onConfirm={handleExecuteEventsReset} onToast={triggerToast} />
        )}
        {isImportModalOpen && (
          <ImportModal onClose={() => setIsImportModalOpen(false)} onImportParsed={handleImportParsedContacts} onToast={triggerToast} onLoadDemo={handleLoadDemoOutreachList} />
        )}
        {callingContact && (
          <CallModal contact={callingContact} onLogLevel={handleLogCallOutcome} />
        )}
        {isAddModalOpen && (
          <AddContactModal onClose={() => setIsAddModalOpen(false)} onAdd={handleManualAddContact} onToast={triggerToast} contacts={contacts} />
        )}
        {editingContact && (
          <EditContactModal contact={editingContact} onClose={() => setEditingContact(null)} onUpdate={handleUpdateContactDetails} onToast={triggerToast} contacts={contacts} />
        )}
      </AnimatePresence>
    </div>
  );
}
