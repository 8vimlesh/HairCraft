import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, ShieldCheck, CalendarRange, ArrowLeft } from "lucide-react";
import BookingFlow from "./pages/booking/BookingFlow";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import LandingPage from "./pages/landing/LandingPage";

export default function App() {
  const [view, setView] = useState("landing"); // landing, customer, owner

  // For the luxury landing page, we want a fully immersive experience without the standard wrapper header/footer
  if (view === "landing") {
    return <LandingPage setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-charcoal text-gray-100 flex flex-col font-sans selection:bg-gold/30 selection:text-white">
      {/* Standard Navigation Header (Only for Booking/Owner views) */}
      <header className="border-b border-white/5 bg-charcoal/80 backdrop-blur-md sticky top-0 z-40 shadow-soft">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-4">
            {/* Back to Home Button */}
            <button 
              onClick={() => setView("landing")}
              className="w-9 h-9 rounded-xl bg-charcoal-light/50 border border-white/10 hover:border-gold/30 hover:bg-charcoal-light flex items-center justify-center text-gray-400 hover:text-gold transition-colors"
              title="Back to Website"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            
            <div 
              onClick={() => setView("customer")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-gold/5 border border-gold/20 flex items-center justify-center text-gold group-hover:border-gold/50 transition-colors">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif font-extrabold text-lg leading-none tracking-tight gold-gradient-text uppercase">
                  Hair Craft
                </h1>
                <span className="text-[9px] uppercase tracking-widest text-gray-500 block mt-0.5 font-bold">
                  Unisex Salon & Spa
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Toggle */}
          <div className="flex gap-1.5 bg-charcoal-deep border border-white/5 p-1 rounded-xl mt-3 sm:mt-0">
            <button
              onClick={() => setView("customer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                view === "customer"
                  ? "bg-charcoal-light text-white shadow-soft border border-white/10"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" /> Book Online
            </button>
            <button
              onClick={() => setView("owner")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                view === "owner"
                  ? "bg-charcoal-light text-white shadow-soft border border-white/10"
                  : "text-gray-500 hover:text-gray-300"
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
          {view === "customer" && (
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
          )}
          {view === "owner" && (
            <motion.div
              key="owner-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1 min-h-screen"
            >
              <OwnerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Standard Footer */}
      <footer className="border-t border-white/5 py-6 text-center bg-charcoal-deep">
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
