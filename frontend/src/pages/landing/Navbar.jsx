import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navbar({ onBookClick, onOwnerClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Contact', href: '#footer' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b border-transparent ${
        scrolled ? 'bg-charcoal/80 backdrop-blur-md border-white/10 py-4 shadow-soft' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center group-hover:border-gold transition-colors duration-500">
            <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 4c0-1.1.9-2 2-2M18 4c0-1.1-.9-2-2-2M14 4v4c0 1.1-.9 2-2 2s-2-.9-2-2V4M18 4v4c0 1.1.9 2 2 2s2-.9 2-2V4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20v-8M7 8H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1M7 14h2M12 20c-1.1 0-2-.9-2-2v-4M12 20c1.1 0 2-.9 2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-widest text-white uppercase block leading-none">Hair Craft</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold block mt-1">Premium Salon</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-sm font-sans tracking-widest uppercase text-gray-300 hover:text-white transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onOwnerClick}
              className="text-xs font-sans tracking-widest uppercase text-gray-400 hover:text-gold transition-colors font-semibold"
            >
              Owner Portal
            </button>
            <button 
              onClick={onBookClick}
              className="btn-gold py-2.5 px-6 text-xs tracking-widest uppercase"
            >
              Book Appointment
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden p-2 text-gray-300 hover:text-gold transition-colors"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-charcoal-deep/95 backdrop-blur-xl border-b border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="text-lg font-sans tracking-widest uppercase text-gray-300 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-4 pt-2">
                <button 
                  onClick={() => { setIsMobileOpen(false); onOwnerClick(); }}
                  className="text-sm font-sans tracking-widest uppercase text-gray-400 hover:text-gold transition-colors font-semibold text-left"
                >
                  Owner Portal
                </button>
                <button 
                  onClick={() => { setIsMobileOpen(false); onBookClick(); }}
                  className="btn-gold py-3 px-6 text-sm tracking-widest uppercase w-full text-center"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
