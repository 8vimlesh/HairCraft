import React from 'react';
import { motion } from 'framer-motion';

export default function GallerySection() {
  const images = [
    { src: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1000&auto=format&fit=crop', alt: 'Styling', span: 'col-span-1 row-span-2' },
    { src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop', alt: 'Salon Interior', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop', alt: 'Beard Trim', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1000&auto=format&fit=crop', alt: 'Hair Spa', span: 'col-span-2 row-span-1' },
  ];

  return (
    <section id="gallery" className="py-24 bg-charcoal-deep relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-gold tracking-[0.3em] text-xs uppercase font-semibold block mb-4">The Experience</span>
            <h2 className="text-4xl md:text-6xl font-serif text-white">Visual Story</h2>
          </div>
          <p className="text-gray-400 font-sans max-w-sm text-sm tracking-wide">
            A glimpse into our luxurious spaces and the meticulous craftsmanship of our master stylists.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[250px] gap-4 md:gap-6">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`relative overflow-hidden rounded-2xl group ${img.span}`}
            >
              <div className="absolute inset-0 bg-charcoal/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
