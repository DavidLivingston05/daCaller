import { useMemo } from "react";
import { motion } from "motion/react";
import { PhoneCall, PhoneMissed, Clock, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Contact, CallRecord } from "../types";

interface StatsDashboardProps {
  contacts: Contact[];
  callHistory: CallRecord[];
  onClose: () => void;
}

export default function StatsDashboard({ contacts, callHistory, onClose }: StatsDashboardProps) {
  const stats = useMemo(() => {
    const total = contacts.length;
    const answered = contacts.filter((c) => c.status === "Answered").length;
    const missed = contacts.filter((c) => c.status === "Missed").length;
    const pending = contacts.filter((c) => c.status === "Pending").length;
    const rate = total > 0 ? Math.round((answered / (answered + missed)) * 100) : 0;
    const todayCalls = callHistory.filter(
      (c) => new Date(c.timestamp).toDateString() === new Date().toDateString()
    ).length;
    return { total, answered, missed, pending, rate, todayCalls };
  }, [contacts, callHistory]);

  const cards = [
    { label: "Total Contacts", value: stats.total, icon: Users, color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { label: "Answered", value: stats.answered, icon: PhoneCall, color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { label: "Missed", value: stats.missed, icon: PhoneMissed, color: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Outreach Statistics</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Answer Rate</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-200 dark:bg-slate-600 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.rate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.rate}%</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Today's Calls</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todayCalls}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {callHistory.length > 0
              ? `Last call: ${new Date(callHistory[callHistory.length - 1].timestamp).toLocaleTimeString()}`
              : "No calls logged yet"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
