import React from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer id="footer" className="bg-charcoal-deep border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="font-serif font-bold text-2xl tracking-widest text-white uppercase mb-6">Hair Craft</h3>
            <p className="text-gray-400 font-sans tracking-wide text-sm max-w-sm leading-relaxed">
              Elevating the standard of grooming and styling. A sanctuary where craft meets luxury, designed exclusively for those who appreciate the finer things.
            </p>
          </div>
          
          <div>
            <h4 className="text-gold tracking-[0.2em] text-xs uppercase font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-gray-400 font-sans text-sm tracking-wide">
              <li>123 Luxury Avenue, Suite 400<br/>Metropolis, NY 10012</li>
              <li>+91 99999 99999</li>
              <li>concierge@haircraft.com</li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold tracking-[0.2em] text-xs uppercase font-semibold mb-6">Hours</h4>
            <ul className="space-y-4 text-gray-400 font-sans text-sm tracking-wide">
              <li className="flex justify-between"><span>Mon - Sun</span> <span>10:00 AM - 10:00 PM</span></li>
            </ul>
            <div className="mt-8 flex gap-4">
              {['Instagram', 'Facebook', 'Twitter'].map((social) => (
                <a key={social} href="#" className="text-gray-500 hover:text-gold transition-colors text-sm uppercase tracking-widest">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
          <p>&copy; {new Date().getFullYear()} Hair Craft Salon. All Rights Reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
