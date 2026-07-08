import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import IntroAnimation from './IntroAnimation';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialSection from './TestimonialSection';
import Footer from './Footer';

export default function LandingPage({ setView }) {
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Initialize Lenis smooth scroll ONLY after intro finishes 
    // or immediately if skipped
    if (introFinished) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, [introFinished]);

  return (
    <div className="bg-charcoal min-h-screen text-gray-100 overflow-x-hidden selection:bg-gold/30 selection:text-white">
      {!introFinished && <IntroAnimation onComplete={() => setIntroFinished(true)} />}
      
      {/* Hide content until intro is done to prevent scroll jump issues */}
      <div className={`transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
        <Navbar 
          onBookClick={() => setView("customer")} 
          onOwnerClick={() => setView("owner")}
        />
        <HeroSection onBookClick={() => setView("customer")} />
        <ServicesSection />
        <GallerySection />
        <TestimonialSection />
        <Footer />
      </div>
    </div>
  );
}
