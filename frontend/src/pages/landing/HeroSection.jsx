import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection({ onBookClick }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 1.5 // Wait for intro to mostly finish
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section id="home" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pb-24 md:pb-0">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/60 to-charcoal/95" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col items-center text-center mt-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-4xl flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="mb-4 md:mb-6">
            <span className="text-gold tracking-[0.3em] text-xs uppercase font-semibold">The Gold Standard in Grooming</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-4 md:mb-6 leading-[1.1]">
            Luxury Hair.<br />
            Timeless Style.<br />
            <span className="gold-gradient-text italic">Exceptional Care.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-gray-300 font-sans max-w-2xl text-sm md:text-base tracking-wide leading-relaxed mb-6 md:mb-10">
            A premium hair styling and grooming experience tailored for men and women. Immerse yourself in an environment of absolute elegance and precision craft.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full sm:w-auto mb-10 md:mb-16">
            <button 
              onClick={onBookClick}
              className="btn-gold w-full sm:w-auto"
            >
              Book Appointment
            </button>
            <a 
              href="#services"
              className="btn-outline w-full sm:w-auto text-center"
            >
              Explore Services
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-16 pt-6 md:pt-8 border-t border-white/10 w-full">
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <span className="text-gold text-lg">★ 4.9 Rating</span>
              <span className="text-gray-400 text-xs tracking-widest uppercase">From 2k+ Reviews</span>
            </div>
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <span className="text-white text-lg font-serif">10,000+</span>
              <span className="text-gray-400 text-xs tracking-widest uppercase">Happy Clients</span>
            </div>
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <span className="text-white text-lg font-serif">Open Daily</span>
              <span className="text-gray-400 text-xs tracking-widest uppercase">10:00 AM – 10:00 PM</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Scroll to Discover</span>
        <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48, 48] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-gold"
          />
        </div>
      </motion.div>
    </section>
  );
}
