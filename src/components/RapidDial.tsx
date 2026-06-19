import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, PhoneCall, PhoneMissed, X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Contact } from "../types";

interface RapidDialProps {
  contacts: Contact[];
  onLogOutcome: (contact: Contact, outcome: "Answered" | "Missed") => void;
  onClose: () => void;
}

export default function RapidDial({ contacts, onLogOutcome, onClose }: RapidDialProps) {
  const pendingContacts = useMemo(
    () => contacts.filter((c) => c.status === "Pending"),
    [contacts]
  );

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [completed, setCompleted] = useState<string[]>([]);

  const current = pendingContacts[index];

  const goNext = useCallback(() => {
    if (index < pendingContacts.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }, [index, pendingContacts.length]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  }, [index]);

  const handleCall = useCallback(() => {
    if (!current) return;
    const cleanNumber = current.phone.replace(/[^+\d]/g, "");
    window.location.href = `tel:${cleanNumber}`;
  }, [current]);

  const handleOutcome = useCallback(
    (outcome: "Answered" | "Missed") => {
      if (!current) return;
      onLogOutcome(current, outcome);
      setCompleted((prev) => [...prev, current.id]);
      if (index < pendingContacts.length - 1) {
        setDirection(1);
        setIndex((i) => i + 1);
      }
    },
    [current, onLogOutcome, index, pendingContacts.length]
  );

  const remaining = pendingContacts.length - index - 1;

  if (pendingContacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Caught Up!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No pending contacts to dial.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer active:scale-95 transition-transform">
            Done
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-50 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white/70 hover:text-white p-2 cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white/60 text-sm font-medium">
          {index + 1} of {pendingContacts.length} · {remaining} remaining
        </span>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="text-white/50 hover:text-white disabled:opacity-20 p-2 cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={current.id}
                initial={{ x: direction * 120, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: direction * -120, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {current.name}
                </h2>
                {current.role && (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
                    {current.role}
                  </p>
                )}
                <p className="text-lg font-mono text-slate-500 dark:text-slate-400 mt-2 select-all">
                  {current.phone}
                </p>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={goNext}
              disabled={index >= pendingContacts.length - 1}
              className="text-white/50 hover:text-white disabled:opacity-20 p-2 cursor-pointer"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="w-full bg-white/10 rounded-full h-1 mb-6 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / pendingContacts.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleCall}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 mb-3"
          >
            <PhoneCall className="w-6 h-6" />
            Call {current.name.split(" ")[0]}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOutcome("Answered")}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Answered
            </button>
            <button
              onClick={() => handleOutcome("Missed")}
              className="bg-rose-700/80 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <PhoneMissed className="w-4 h-4" />
              Missed
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
