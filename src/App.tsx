import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search, X, Plus, MoreVertical, Sparkles, Download, Database, Moon, Sun,
  PhoneCall, BarChart3, List, Radio, Wifi, WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Contact, CallRecord, SortOption, TabOption, ViewMode } from "./types";
import { getIndianPhoneCoreDigits } from "./utils/phone";
import { useTheme } from "./hooks/useTheme";
import { useVirtualScroll, ROW_HEIGHT } from "./hooks/useVirtualScroll";
import { api } from "./api";

import Toast from "./components/Toast";
import ContactRow from "./components/ContactRow";
import SmartPasteModal from "./components/SmartPasteModal";
import ResetModal from "./components/ResetModal";
import ImportModal from "./components/ImportModal";
import AddContactModal from "./components/AddContactModal";
import EditContactModal from "./components/EditContactModal";
import CallModal from "./components/CallModal";
import RapidDial from "./components/RapidDial";
import StatsDashboard from "./components/StatsDashboard";

const CACHE_KEYS = {
  contacts: "outreach_contacts",
  history: "outreach_call_history",
};

function fromAPI(c: any): Contact {
  return {
    id: c._id || c.id,
    name: c.name,
    phone: c.phone,
    status: c.status || "Pending",
    role: c.role || "",
    lastCalledAt: c.lastCalledAt,
    callCount: c.callCount || 0,
  };
}

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabOption>("All");
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
  const [sortBy, setSortBy] = useState<SortOption>("Status");
  const [containerHeight, setContainerHeight] = useState(600);

  // --- Load from MongoDB on mount, fall back to localStorage cache ---
  useEffect(() => {
    (async () => {
      try {
        const res = await api.contacts.list();
        if (res?.contacts && res.contacts.length > 0) {
          const mapped = res.contacts.map(fromAPI);
          setContacts(mapped);
          localStorage.setItem(CACHE_KEYS.contacts, JSON.stringify(mapped));
          setIsOnline(true);
        } else {
          // Server online but empty — use cache or init
          const cached = localStorage.getItem(CACHE_KEYS.contacts);
          if (cached) {
            try { setContacts(JSON.parse(cached)); } catch { }
          }
          setIsOnline(true);
        }
      } catch {
        setIsOnline(false);
        const cached = localStorage.getItem(CACHE_KEYS.contacts);
        if (cached) {
          try { setContacts(JSON.parse(cached)); } catch { }
        }
      }
      setLoading(false);
    })();
  }, []);

  // --- Persist to localStorage cache whenever state changes ---
  useEffect(() => {
    if (contacts.length > 0 || !loading) {
      localStorage.setItem(CACHE_KEYS.contacts, JSON.stringify(contacts));
    }
  }, [contacts, loading]);

  useEffect(() => {
    localStorage.setItem(CACHE_KEYS.history, JSON.stringify(callHistory));
  }, [callHistory]);

  useEffect(() => {
    const updateHeight = () => setContainerHeight(window.innerHeight - 340);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
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

  // --- Add call record (MongoDB + local) ---
  const addCallRecord = useCallback(async (contact: Contact, outcome: "Answered" | "Missed") => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id
          ? { ...c, status: outcome, lastCalledAt: Date.now(), callCount: (c.callCount || 0) + 1 }
          : c
      )
    );
    const record: CallRecord = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      outcome,
      timestamp: Date.now(),
    };
    setCallHistory((prev) => [...prev, record]);
    // Fire-and-forget to API
    api.contacts.update(contact.id, { status: outcome, lastCalledAt: Date.now(), callCount: (contact.callCount || 0) + 1 })
      .catch(() => setIsOnline(false));
    api.history.create(record).catch(() => {});
  }, []);

  // --- Filter + sort ---
  const filteredContacts = useMemo(() => {
    let result = searchQuery.trim()
      ? contacts.filter((c) => {
          const q = searchQuery.toLowerCase().trim();
          return c.name.toLowerCase().includes(q) || c.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
        })
      : [...contacts];

    if (activeTab !== "All") {
      result = result.filter((c) => c.status === activeTab);
    }

    result.sort((a, b) => {
      if (sortBy === "Status") {
        const p: Record<string, number> = { Pending: 1, Missed: 2, Answered: 3 };
        const va = p[a.status] || 4;
        const vb = p[b.status] || 4;
        return va !== vb ? va - vb : a.name.localeCompare(b.name);
      } else if (sortBy === "Name") {
        return a.name.localeCompare(b.name);
      }
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [contacts, searchQuery, activeTab, sortBy]);

  const completedCount = useMemo(() => contacts.filter((c) => c.status !== "Pending").length, [contacts]);
  const progressPercentage = useMemo(() => contacts.length > 0 ? Math.round((completedCount / contacts.length) * 100) : 0, [contacts, completedCount]);

  const counts = useMemo(() => ({
    all: contacts.length,
    pending: contacts.filter((c) => c.status === "Pending").length,
    answered: contacts.filter((c) => c.status === "Answered").length,
    missed: contacts.filter((c) => c.status === "Missed").length,
  }), [contacts]);

  const { containerRef, onScroll, visibleItems, paddingTop, paddingBottom } = useVirtualScroll(filteredContacts, containerHeight);

  // --- Retry queue: failed operations retried every 10s ---
  const [syncQueue, setSyncQueue] = useState<(() => Promise<void>)[]>([]);
  const addToQueue = useCallback((fn: () => Promise<void>) => {
    setSyncQueue((prev) => [...prev, fn]);
  }, []);

  useEffect(() => {
    if (syncQueue.length === 0) return;
    const timer = setInterval(async () => {
      const remaining: (() => Promise<void>)[] = [];
      for (const task of syncQueue) {
        try { await task(); } catch { remaining.push(task); }
      }
      setSyncQueue(remaining);
      if (remaining.length === 0) {
        setIsOnline(true);
        triggerToast("All changes synced to database!", "success");
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [syncQueue, triggerToast]);

  const queueSyncContacts = useCallback((payload: any[]) => {
    addToQueue(async () => {
      const res = await api.contacts.sync(payload);
      if (res?.contacts) {
        setContacts(res.contacts.map(fromAPI));
      } else throw new Error("sync failed");
    });
  }, [addToQueue]);

  const getDuplicateCount = useCallback(() => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => { const core = getIndianPhoneCoreDigits(c.phone); coreCount[core] = (coreCount[core] || 0) + 1; });
    return Object.values(coreCount).reduce((t, v) => v > 1 ? t + v - 1 : t, 0);
  }, [contacts]);

  const getDuplicateContacts = useCallback((): Contact[] => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => { const core = getIndianPhoneCoreDigits(c.phone); coreCount[core] = (coreCount[core] || 0) + 1; });
    return contacts.filter((c) => { const core = getIndianPhoneCoreDigits(c.phone); return coreCount[core] > 1; });
  }, [contacts]);

  const totalDuplicates = useMemo(() => getDuplicateCount(), [getDuplicateCount]);

  // --- Handlers: API-first. Local state only updates AFTER successful MongoDB write ---

  const handleInitiateCall = useCallback((contact: Contact) => {
    setCallingContact(contact);
    const cleanNumber = contact.phone.replace(/[^+\d]/g, "");
    window.location.href = `tel:${cleanNumber}`;
  }, []);

  const handleLogCallOutcome = useCallback((outcome: "Answered" | "Missed" | "Cancel") => {
    if (!callingContact) return;
    if (outcome === "Cancel") { setCallingContact(null); return; }
    addCallRecord(callingContact, outcome);
    triggerToast(`Logged outcome as ${outcome}!`, "success");
    setCallingContact(null);
  }, [callingContact, addCallRecord, triggerToast]);

  const handleRapidLogOutcome = useCallback((contact: Contact, outcome: "Answered" | "Missed") => {
    addCallRecord(contact, outcome);
    triggerToast(`Logged "${contact.name}" as ${outcome}!`, "success");
  }, [addCallRecord, triggerToast]);

  const handleManualAddContact = useCallback(async (name: string, phone: string) => {
    const res = await api.contacts.create({ name, phone, status: "Pending" });
    if (res?.contact) {
      setContacts((prev) => [fromAPI(res.contact), ...prev]);
      triggerToast(`Saved "${name}" to database!`, "success");
      setIsOnline(true);
    } else {
      // Offline: keep in queue
      const tempId = `offline-${Date.now()}`;
      const offline: Contact = { id: tempId, name, phone, status: "Pending" };
      setContacts((prev) => [offline, ...prev]);
      setIsOnline(false);
      triggerToast("Saved locally. Will sync to database when online.", "success");
      addToQueue(async () => {
        const r = await api.contacts.create({ name, phone, status: "Pending" });
        if (r?.contact) {
          setContacts((prev) => prev.map((c) => (c.id === tempId ? fromAPI(r.contact) : c)));
        } else throw new Error("retry failed");
      });
    }
  }, [triggerToast, addToQueue]);

  const handleSmartAddParsed = useCallback(async (name: string, phone: string) => {
    await handleManualAddContact(name, phone);
  }, [handleManualAddContact]);

  const handleUpdateContactDetails = useCallback(async (id: string, name: string, phone: string) => {
    setEditingContact(null);
    const res = await api.contacts.update(id, { name, phone });
    if (res?.contact) {
      setContacts((prev) => prev.map((c) => (c.id === id ? fromAPI(res.contact) : c)));
      triggerToast("Updated successfully.", "success");
      setIsOnline(true);
    } else {
      setIsOnline(false);
      triggerToast("Update failed. Will retry.", "error");
      addToQueue(async () => {
        const r = await api.contacts.update(id, { name, phone });
        if (r?.contact) {
          setContacts((prev) => prev.map((c) => (c.id === id ? fromAPI(r.contact) : c)));
        } else throw new Error("retry failed");
      });
    }
  }, [triggerToast, addToQueue]);

  const handleDeleteContactFromLedger = useCallback((id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    api.contacts.delete(id).then((res) => {
      if (res?.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        triggerToast("Contact deleted from database.", "success");
        setIsOnline(true);
      } else {
        setIsOnline(false);
        triggerToast("Delete failed. Will retry.", "error");
      }
    }).catch(() => {
      setIsOnline(false);
      triggerToast("Delete failed. Will retry.", "error");
    });
  }, [triggerToast]);

  const handleImportParsedContacts = useCallback(async (importedList: Contact[]) => {
    const allCurrent = [...contacts, ...importedList];
    const res = await api.contacts.sync(allCurrent);
    if (res?.contacts) {
      setContacts(res.contacts.map(fromAPI));
      triggerToast(`Imported ${importedList.length} contacts to database!`, "success");
      setIsOnline(true);
    } else {
      setIsOnline(false);
      triggerToast("Import saved locally. Will sync when online.", "success");
      setContacts((prev) => [...importedList, ...prev]);
      queueSyncContacts([...importedList, ...contacts]);
    }
  }, [contacts, triggerToast, queueSyncContacts]);

  const handleDeduplicateList = useCallback(async () => {
    const res = await api.contacts.dedup();
    if (res?.success) {
      const fresh = await api.contacts.list();
      if (fresh?.contacts) {
        setContacts(fresh.contacts.map(fromAPI));
        setIsOnline(true);
      }
      triggerToast(`Merged ${res.removed || 0} duplicates!`, "success");
    } else {
      setIsOnline(false);
      triggerToast("Dedup failed. Will retry when online.", "error");
    }
  }, [triggerToast]);

  const handleLoadDemoOutreachList = useCallback(async () => {
    const demos = [
      { name: "Evangelist Timothy", phone: "+91 99400 55667", status: "Pending" },
      { name: "Sister Phoebe", phone: "+91 93810 77889", status: "Pending" },
      { name: "Brother Stephen", phone: "+91 97900 11224", status: "Pending" },
    ];
    const allCurrent = [...contacts, ...demos.map((d, i) => ({ ...d, id: `demo-${Date.now()}-${i}` } as Contact))];
    const res = await api.contacts.sync(allCurrent);
    if (res?.contacts) {
      setContacts(res.contacts.map(fromAPI));
      triggerToast("Loaded demo list to database!", "success");
      setIsOnline(true);
    } else {
      setIsOnline(false);
      setContacts((prev) => [...demos.map((d, i) => ({ ...d, id: `demo-${Date.now()}-${i}` } as Contact)), ...prev]);
      triggerToast("Demo list saved locally. Will sync.", "success");
      queueSyncContacts(allCurrent);
    }
  }, [contacts, triggerToast, queueSyncContacts]);

  const handleExecuteEventsReset = useCallback(async () => {
    const res = await api.contacts.reset();
    if (res?.success) {
      const fresh = await api.contacts.list();
      if (fresh?.contacts) setContacts(fresh.contacts.map(fromAPI));
      triggerToast("Reset all events to Pending!", "success");
      setIsOnline(true);
    } else {
      setIsOnline(false);
      setContacts((prev) => prev.map((c) => c.status !== "Pending" ? { ...c, status: "Pending", lastCalledAt: undefined } : c));
      triggerToast("Reset saved locally. Will sync.", "success");
    }
  }, [triggerToast]);

  const handleExportBackup = useCallback(() => {
    try {
      const payload = JSON.stringify({ contacts, callHistory }, null, 2);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(payload);
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `DaCaller_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(a); a.click(); a.remove();
      triggerToast("Backup exported!", "success");
      setIsActionMenuOpen(false);
    } catch { triggerToast("Backup error.", "error"); }
  }, [contacts, callHistory, triggerToast]);

  const handleRestoreBackup = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const restored = parsed.contacts || (Array.isArray(parsed) ? parsed : []);
        if (restored.length > 0) {
          setContacts(restored);
          const res = await api.contacts.sync(restored);
          if (res?.contacts) setContacts(res.contacts.map(fromAPI));
          triggerToast("Database restored!", "success");
        } else {
          triggerToast("Invalid backup format.", "error");
        }
      } catch { triggerToast("Failed parsing backup.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
    setIsActionMenuOpen(false);
  }, [triggerToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased font-sans relative pb-20 transition-colors duration-200">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "rapid" && (
          <RapidDial contacts={contacts} onLogOutcome={handleRapidLogOutcome} onClose={() => setViewMode("list")} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "stats" && (
          <StatsDashboard contacts={contacts} callHistory={callHistory} onClose={() => setViewMode("list")} />
        )}
      </AnimatePresence>

      <div id="app" className="max-w-lg mx-auto px-4 pt-4 pb-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white select-none leading-tight">DaCaller</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase select-none flex items-center gap-1">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
                {contacts.length} contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 gap-0.5">
              <button onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                title="List View"><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("rapid")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "rapid" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                title="Rapid Dial"><Radio className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("stats")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "stats" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                title="Statistics"><BarChart3 className="w-4 h-4" /></button>
            </div>
            <button onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle theme">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.div layout className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
            <span>Outreach Progress</span>
            <span className="text-slate-700 dark:text-slate-300">{completedCount}/{contacts.length} ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
            <motion.div layout style={{ width: `${progressPercentage}%` }}
              className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              transition={{ type: "spring", stiffness: 100 }} />
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input id="search-input-ledger" type="text" placeholder="Search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:placeholder-slate-500 transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setIsSmartPasteModalOpen(true)}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0">
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {totalDuplicates > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-3 flex items-center justify-between overflow-hidden">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ {totalDuplicates} duplicate{totalDuplicates > 1 ? "s" : ""}
              </p>
              <button onClick={handleDeduplicateList}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95">
                Merge
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none" id="filterTabs">
            {(["All", "Pending", "Missed", "Answered"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const colors: Record<string, string> = {
                All: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm",
                Pending: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700",
                Missed: "bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-700",
                Answered: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700",
              };
              return (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive ? colors[tab] : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                  {tab} {counts[tab.toLowerCase() as keyof typeof counts]}
                </button>
              );
            })}
          </div>

          <div className="relative shrink-0" ref={actionMenuRef}>
            <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {isActionMenuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-40 py-1">
                  <button onClick={() => { setIsImportModalOpen(true); setIsActionMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer">🚀 Bulk Import CSV</button>
                  <button onClick={handleExportBackup}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700">
                    <Download className="w-3 h-3" /> Backup</button>
                  <button onClick={() => backupInputRef.current?.click()}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5">
                    <Database className="w-3 h-3" /> Restore</button>
                  <input type="file" ref={backupInputRef} accept=".json" onChange={handleRestoreBackup} className="hidden" />
                  <button onClick={() => { handleDeduplicateList(); setIsActionMenuOpen(false); }}
                    disabled={getDuplicateContacts().length === 0}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 ${getDuplicateContacts().length > 0 ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}>
                    ✨ Merge Duplicates {getDuplicateContacts().length > 0 ? `(${totalDuplicates})` : ""}
                  </button>
                  <button onClick={() => { setIsResetModalOpen(true); setIsActionMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-semibold transition-colors border-t border-slate-100 dark:border-slate-700 cursor-pointer">🔄 Reset Events</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl flex justify-between items-center select-none">
          <span>{filteredContacts.length} of {contacts.length}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider">Sort:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
              <option value="Status">Status</option>
              <option value="Name">Name</option>
              <option value="Recent">Recent</option>
            </select>
          </div>
        </div>

        <div ref={containerRef} onScroll={onScroll}
          className="overflow-y-auto will-change-transform" id="main-contact-waterfall-list"
          style={{ height: containerHeight }}>
          <div style={{ paddingTop, paddingBottom }}>
            {filteredContacts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {searchQuery ? "No matching contacts" : "No contacts yet. Tap + to add one."}
                </p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleItems.map((contact, i) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.005, type: "spring", stiffness: 300, damping: 25 }}
                    style={{ minHeight: ROW_HEIGHT }}
                  >
                    <ContactRow
                      contact={contact}
                      onCall={handleInitiateCall}
                      onEdit={(c) => setEditingContact(c)}
                      onDelete={handleDeleteContactFromLedger}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
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
