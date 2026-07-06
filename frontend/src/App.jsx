import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, ShieldCheck, Sparkles, CalendarRange } from "lucide-react";
import BookingFlow from "./components/BookingFlow";
import OwnerDashboard from "./pages/owner/OwnerDashboard";

export default function App() {
  const [view, setView] = useState("customer"); // customer or owner

  return (
    <div className="min-h-screen bg-charcoal-deep text-gray-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-white/5 bg-charcoal/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div 
            onClick={() => setView("customer")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:border-gold/50 transition-colors">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight gold-gradient-text uppercase">
                Hair Craft
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 block mt-0.5 font-bold">
                Unisex Salon & Spa
              </span>
            </div>
          </div>

          {/* Navigation Toggle */}
          <div className="flex gap-1.5 bg-charcoal-dark border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setView("customer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                view === "customer"
                  ? "bg-gold text-black shadow-gold-glow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" /> Book Online
            </button>
            <button
              onClick={() => setView("owner")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                view === "owner"
                  ? "bg-gold text-black shadow-gold-glow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Owner Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {view === "customer" ? (
            <motion.div
              key="customer-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1"
            >
              <BookingFlow />
            </motion.div>
          ) : (
            <motion.div
              key="owner-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1"
            >
              <OwnerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center bg-charcoal/20">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Hair Craft Salon &copy; {new Date().getFullYear()} &middot; Built for Excellence
          </p>
          <p className="text-[9px] text-gray-600">
            Open daily: 10:00 AM &ndash; 10:00 PM &middot; Standard Slot duration: 30 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}
