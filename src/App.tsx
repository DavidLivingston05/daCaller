import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  Plus,
  MoreVertical,
  Sparkles,
  Download,
  Database
} from "lucide-react";
import { Contact } from "./types";
import { getIndianPhoneCoreDigits } from "./utils/phone";


// Sub-components
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
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem("outreach_contacts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse contacts", e);
      }
    }
    return INITIAL_CONTACTS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Answered" | "Missed">("All");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Modals visibility states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSmartPasteModalOpen, setIsSmartPasteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Selected contact tracking variables for reactive prompts
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [callingContact, setCallingContact] = useState<Contact | null>(null);

  // Notification notification system
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sortBy, setSortBy] = useState<"Status" | "Name" | "Recent">("Status");

  // Sync contacts database automatically to standard Client-Side storage
  useEffect(() => {
    localStorage.setItem("outreach_contacts", JSON.stringify(contacts));
  }, [contacts]);

  // Auto-dismiss notification system timeouts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle external clicks to close Action drop-down menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  // Contacts dynamic filter mapping and sorting calculation
  const filteredContacts = contacts
    .filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = c.name.toLowerCase().includes(query) || c.phone.replace(/\s+/g, "").includes(query.replace(/\s+/g, ""));
      if (activeTab === "All") return matchesSearch;
      return matchesSearch && c.status === activeTab;
    })
    .sort((a, b) => {
      if (sortBy === "Status") {
        const priority: Record<string, number> = {
          "Pending": 1,
          "Missed": 2,
          "Answered": 3
        };
        const valA = priority[a.status] || 4;
        const valB = priority[b.status] || 4;
        if (valA !== valB) return valA - valB;
        return a.name.localeCompare(b.name);
      } else if (sortBy === "Name") {
        return a.name.localeCompare(b.name);
      } else {
        // "Recent": Sort newly added ones first
        return b.id.localeCompare(a.id);
      }
    });

  // Calculate current session outreach statistics progress metrics
  const completedCount = contacts.filter((c) => c.status !== "Pending").length;
  const progressPercentage = contacts.length > 0 ? Math.round((completedCount / contacts.length) * 100) : 0;

  // Counts for badge navigation headers
  const counts = {
    all: contacts.length,
    pending: contacts.filter((c) => c.status === "Pending").length,
    answered: contacts.filter((c) => c.status === "Answered").length,
    missed: contacts.filter((c) => c.status === "Missed").length
  };

  // Telephony Standard Call Protocol Dispatch
  const handleInitiateCall = (contact: Contact) => {
    setCallingContact(contact);
    const cleanNumber = contact.phone.replace(/[^+\d]/g, "");
    window.location.href = `tel:${cleanNumber}`;
  };

  // Log active state results
  const handleLogCallOutcome = (outcome: "Answered" | "Missed" | "Cancel") => {
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
  };

  // Advanced Bulk import CSV array addition callback
  const handleImportParsedContacts = (importedList: Contact[]) => {
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
          triggerToast(`Loaded ${filteredIncoming.length} new leads. ${skippedCount} duplicates filtered out automatically.`, "success");
        } else {
          triggerToast(`Successfully imported ${filteredIncoming.length} contacts!`, "success");
        }
      }, 50);

      return [...prev, ...filteredIncoming];
    });
  };

  // Find duplicates in the existing contact array dynamically
  const getDuplicateCount = () => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      coreCount[core] = (coreCount[core] || 0) + 1;
    });

    let totalDuplicates = 0;
    Object.keys(coreCount).forEach((core) => {
      if (coreCount[core] > 1) {
        totalDuplicates += coreCount[core] - 1;
      }
    });
    return totalDuplicates;
  };

  // Helper function to identify all contacts with the same phone base digits
  const getDuplicateContacts = (): Contact[] => {
    const coreCount: Record<string, number> = {};
    contacts.forEach((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      coreCount[core] = (coreCount[core] || 0) + 1;
    });

    return contacts.filter((c) => {
      const core = getIndianPhoneCoreDigits(c.phone);
      return coreCount[core] > 1;
    });
  };

  const totalDuplicates = getDuplicateCount();

  // Deduplicate contact ledger preserving non-Pending status where possible
  const handleDeduplicateList = () => {
    const coreSeen = new Set<string>();
    const keptContacts: Contact[] = [];

    const priority: Record<string, number> = {
      "Answered": 1,
      "Missed": 2,
      "Pending": 3
    };

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
    triggerToast(`Removed ${contacts.length - finalContacts.length} duplicate entries. Dialer list is now clean!`, "success");
  };

  // Load standard Demo template profiles
  const handleLoadDemoOutreachList = () => {
    const demoItems: Contact[] = [
      { id: `demo-${Date.now()}-1`, name: "Evangelist Timothy", phone: "+91 99400 55667", status: "Pending" },
      { id: `demo-${Date.now()}-2`, name: "Sister Phoebe", phone: "+91 93810 77889", status: "Pending" },
      { id: `demo-${Date.now()}-3`, name: "Brother Stephen", phone: "+91 97900 11224", status: "Pending" }
    ];
    setContacts((prev) => [...prev, ...demoItems]);
    triggerToast("Successfully loaded demo list templates!", "success");
  };

  // Smart Add Line Parser Adding Callback
  const handleSmartAddParsed = (name: string, phone: string) => {
    const smartContact: Contact = {
      id: `smart-${Date.now()}`,
      name,
      phone,
      status: "Pending"
    };
    setContacts((prev) => [smartContact, ...prev]);
    triggerToast(`Smart parsed & added "${name}" to dialing ledger!`, "success");
  };

  // Manual Creation callback
  const handleManualAddContact = (name: string, phone: string) => {
    const newContact: Contact = {
      id: `manual-${Date.now()}`,
      name,
      phone,
      status: "Pending"
    };
    setContacts((prev) => [newContact, ...prev]);
    triggerToast(`Saved new member "${name}" successfully.`, "success");
  };

  // Edit contact update logic
  const handleUpdateContactDetails = (id: string, name: string, phone: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, phone } : c))
    );
    triggerToast("Updated member parameters successfully.", "success");
    setEditingContact(null);
  };

  // Contact Delete Option
  const handleDeleteContactFromLedger = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from outreach list permanently?`)) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      triggerToast("Contact record deleted.", "success");
    }
  };

  // Reset Events to default "Pending"
  const handleExecuteEventsReset = () => {
    setContacts((prev) =>
      prev.map((c) => (c.status !== "Pending" ? { ...c, status: "Pending" } : c))
    );
    triggerToast("Successfully reset all contact event indicators to Pending!", "success");
  };

  // Export internal backup data as JSON file
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
      const anchorNode = document.createElement("a");
      anchorNode.setAttribute("href", dataStr);
      anchorNode.setAttribute("download", `DaCaller_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(anchorNode);
      anchorNode.click();
      anchorNode.remove();
      triggerToast("Local JSON database backup exported safely!", "success");
      setIsActionMenuOpen(false);
    } catch (e) {
      triggerToast("Backup generation error.", "error");
    }
  };

  // Restore database backups securely
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            triggerToast("Lead database restored successfully from JSON!", "success");
          } else {
            triggerToast("JSON validation failed: Invalid properties schema.", "error");
          }
        } else {
          triggerToast("JSON backup format error: Expected an array.", "error");
        }
      } catch (err) {
        triggerToast("Invalid format, failed parsing JSON.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear file selector target
    setIsActionMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans relative pb-16">
      
      {/* Dynamic Slide Toaster System */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Outreach Dashboard Engine */}
      <div id="app" className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Banner Section Header */}
        <div className="flex justify-between items-center bg-transparent">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 select-none">DaCaller</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5 select-none">Active Dialer</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="smart-add-trigger-btn"
              type="button"
              onClick={() => setIsSmartPasteModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              <span>Smart Add</span>
            </button>
            <button
              id="manual-add-trigger-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              + Member
            </button>
          </div>
        </div>

        {/* Dynamic Outreach Session Tracker Bar Card */}
        <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 select-none">
            <span>Session Progress</span>
            <span className="text-slate-700">{completedCount} / {contacts.length} Completed ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${progressPercentage}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
          </div>
        </div>

        {/* Search Ledger Bar */}
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
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* DUPLICATE DETECTOR ACTIVE ALERT BANNER */}
        {totalDuplicates > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">Duplicated Numbers Registered</h4>
                <p className="text-[11px] text-amber-700/90 leading-relaxed mt-0.5">
                  We found <strong className="text-amber-950 font-extrabold">{totalDuplicates} duplicate contact number{totalDuplicates > 1 ? "s" : ""}</strong> in your database. This could result in dial redundancies.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-0.5">
              <button
                type="button"
                onClick={handleDeduplicateList}
                className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1 hover:shadow-sm"
              >
                Clean & Merge Duplicates
              </button>
            </div>
          </div>
        )}

        {/* Filters and Backups control ribbon */}
        <div className="flex items-center justify-between gap-2 bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
          
          {/* Navigation Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none" id="filterTabs">
            <button 
              type="button"
              onClick={() => setActiveTab("All")}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "All" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All ({counts.all})
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab("Pending")}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "Pending" 
                  ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Pending ({counts.pending})
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab("Missed")}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "Missed" 
                  ? "bg-rose-100 text-rose-800 border border-rose-200 shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Missed ({counts.missed})
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab("Answered")}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "Answered" 
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Answered ({counts.answered})
            </button>
          </div>

          {/* Backup Database Dropdown settings */}
          <div className="relative inline-block text-left shrink-0 animate-fade-in" ref={actionMenuRef}>
            <button 
              id="action-dropdown-btn"
              type="button"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} 
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center justify-center" 
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isActionMenuOpen && (
              <div 
                id="backups-actionMenu" 
                className="absolute right-0 mt-2 w-52 bg-white border border-slate-250 rounded-xl shadow-lg z-40 py-1 flex flex-col items-start border-slate-200/90"
              >
                <button 
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(true);
                    setIsActionMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  🚀 Bulk Import CSV
                </button>
                
                <button 
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer flex items-center gap-1.5 border-t border-slate-100/70"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Backup (.json)</span>
                </button>

                <button 
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Restore Backup (.json)</span>
                </button>

                <input 
                  type="file"
                  ref={backupInputRef}
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />

                <button 
                  type="button"
                  onClick={() => {
                    handleDeduplicateList();
                    setIsActionMenuOpen(false);
                  }}
                  disabled={getDuplicateContacts().length === 0}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors border-t border-slate-100 flex items-center gap-1.5 ${
                    getDuplicateContacts().length > 0 
                      ? "text-amber-700 hover:bg-amber-50 cursor-pointer" 
                      : "text-slate-400 bg-slate-50/50 cursor-not-allowed"
                  }`}
                >
                  ✨ Merge All Duplicates {getDuplicateContacts().length > 0 ? `(${totalDuplicates})` : ""}
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setIsActionMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors border-t border-slate-100 cursor-pointer"
                >
                  🔄 Reset Events
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Display Metrics summary label */}
        <div className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100/90 px-3 py-1.5 rounded-xl flex justify-between items-center gap-2 select-none">
          <span className="truncate">Viewing {filteredContacts.length} of {contacts.length} total members</span>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Sort:</span>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "Status" | "Name" | "Recent")}
              className="bg-white border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-520 focus:border-transparent cursor-pointer shadow-xs hover:border-slate-300 transition-colors"
            >
              <option value="Status">By Status (All priority)</option>
              <option value="Name">Name A-Z</option>
              <option value="Recent">Recently Added</option>
            </select>
            {contacts.length === 0 && (
              <button 
                type="button"
                onClick={() => {
                  setContacts(INITIAL_CONTACTS);
                  triggerToast("Restored template contacts demo list!", "success");
                }}
                className="text-emerald-600 hover:underline font-bold ml-1"
              >
                Restore
              </button>
            )}
          </div>
        </div>

        {/* Responsive, Touch swipeable contact waterfall list */}
        <div className="flex flex-col gap-3" id="main-contact-waterfall-list">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs select-none">
              <p className="text-xs font-semibold text-slate-400">No matching outreach entries found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <ContactRow 
                key={contact.id}
                contact={contact}
                onCall={handleInitiateCall}
                onEdit={(c) => setEditingContact(c)}
                onDelete={handleDeleteContactFromLedger}
              />
            ))
          )}
        </div>

      </div>

      {/* --- Smart Paste Modal Widget --- */}
      {isSmartPasteModalOpen && (
        <SmartPasteModal
          onClose={() => setIsSmartPasteModalOpen(false)}
          onAddParsed={handleSmartAddParsed}
          onToast={triggerToast}
          contacts={contacts}
        />
      )}

      {/* --- Reset Action Confirmation Modal Widget --- */}
      {isResetModalOpen && (
        <ResetModal
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleExecuteEventsReset}
          onToast={triggerToast}
        />
      )}

      {/* --- Advanced File / Text Bulk CSV Import Modal Widget --- */}
      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportParsed={handleImportParsedContacts}
          onToast={triggerToast}
          onLoadDemo={handleLoadDemoOutreachList}
        />
      )}

      {/* --- Mobile Telephony Protocol Outgoing Dialer Overlay Modal Widget --- */}
      {callingContact && (
        <CallModal
          contact={callingContact}
          onLogLevel={handleLogCallOutcome}
        />
      )}

      {/* --- Add New Contact Profile modal --- */}
      {isAddModalOpen && (
        <AddContactModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleManualAddContact}
          onToast={triggerToast}
          contacts={contacts}
        />
      )}

      {/* --- Edit Contact Profile info modal --- */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onUpdate={handleUpdateContactDetails}
          onToast={triggerToast}
          contacts={contacts}
        />
      )}

    </div>
  );
}
