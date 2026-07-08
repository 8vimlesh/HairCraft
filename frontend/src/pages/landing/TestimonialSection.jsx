import React from 'react';
import { motion } from 'framer-motion';

export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Eleanor Richards",
      role: "Fashion Editor",
      content: "Hair Craft is not just a salon, it is a sanctuary. The attention to detail and absolute mastery over style is unparalleled. Truly a five-star experience.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
    },
    {
      name: "James Harrington",
      role: "Architect",
      content: "The precision of the cuts and the premium atmosphere make every visit exceptional. It's the only place I trust for a flawless royal shave and styling.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
    },
    {
      name: "Sophia Laurent",
      role: "Creative Director",
      content: "From the moment you walk in, you are treated like royalty. The Keratin treatment completely transformed my hair. Pure luxury.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
    }
  ];

  return (
    <section id="reviews" className="py-32 bg-charcoal relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-gold tracking-[0.3em] text-xs uppercase font-semibold block mb-4">Testimonials</span>
          <h2 className="text-4xl md:text-6xl font-serif text-white">Client Acclaim</h2>
          <div className="w-16 h-px bg-gold mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className="card-glass flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} className="w-4 h-4 text-gold fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 font-sans tracking-wide text-sm leading-relaxed mb-8 italic">
                  "{t.content}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-gold/30" />
                <div>
                  <h4 className="text-white font-serif tracking-wide">{t.name}</h4>
                  <p className="text-gold text-xs uppercase tracking-widest mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
