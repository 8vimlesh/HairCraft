import React from 'react';
import { motion } from 'framer-motion';

export default function ServicesSection() {
  const femaleServices = [
    "Hair Cut", "Hair Colour", "Facial", "De-Tan", "Hair Spa", "Hair Styling"
  ];

  const maleServices = [
    "Hair Cut", "Beard Cut", "Hair and Beard Cut", "Hair Colour", 
    "Hair Spa", "Beard Colour", "Clean Shave", "Facial", "De-Tan", "Massage"
  ];

  return (
    <section id="services" className="py-24 bg-charcoal relative overflow-hidden">
      {/* Soft background light */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-gold tracking-[0.3em] text-xs uppercase font-semibold block mb-4">Our Expertise</span>
          <h2 className="text-4xl md:text-6xl font-serif text-white">Signature Services</h2>
          <div className="w-16 h-px bg-gold mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Female Services */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-3xl font-serif text-white">For Her</h3>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {femaleServices.map((service, index) => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="card-glass group cursor-pointer"
                >
                  <p className="text-gray-300 font-sans tracking-wide text-sm group-hover:text-gold transition-colors duration-300">{service}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Male Services */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-3xl font-serif text-white">For Him</h3>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {maleServices.map((service, index) => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02, duration: 0.5 }}
                  className="card-glass group cursor-pointer"
                >
                  <p className="text-gray-300 font-sans tracking-wide text-sm group-hover:text-gold transition-colors duration-300">{service}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
