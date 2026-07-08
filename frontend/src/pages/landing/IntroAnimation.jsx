import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function IntroAnimation({ onComplete }) {
  const containerRef = useRef(null);
  const lineRef = useRef(null);
  const logoRef = useRef(null);
  const textRef = useRef(null);
  const subtextRef = useRef(null);
  const lightRef = useRef(null);
  const bgRef = useRef(null);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    // Check if already visited
    const hasVisited = localStorage.getItem('hc_intro_seen');
    if (hasVisited) {
      setSkip(true);
      onComplete();
      return;
    }
    
    // Lock scroll during intro
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        localStorage.setItem('hc_intro_seen', 'true');
        document.body.style.overflow = 'auto';
        onComplete();
      }
    });

    // 1. Black screen is default.
    // 2. Gold line appears
    tl.to(lineRef.current, {
      scaleY: 1,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    // 3. Line expands into logo
    .to(lineRef.current, {
      scaleX: 100, // expand horizontally
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut'
    }, '+=0.2')
    .fromTo(logoRef.current, 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    )
    // 4. Text reveals
    .fromTo([textRef.current, subtextRef.current],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' },
      '-=0.2'
    )
    // 5. Golden light sweep
    .fromTo(lightRef.current,
      { left: '-100%' },
      { left: '200%', duration: 1.2, ease: 'power1.inOut' },
      '-=0.2'
    )
    // 6. Background transition to blurred salon
    .to(bgRef.current, {
      opacity: 0.4,
      duration: 1.5,
      ease: 'power2.inOut'
    })
    // 7 & 8. Fade out entire intro to reveal homepage
    .to(containerRef.current, {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut'
    }, '+=0.5');

    return () => {
      document.body.style.overflow = 'auto';
      tl.kill();
    };
  }, [onComplete]);

  if (skip) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal pointer-events-none"
    >
      {/* Background Image that fades in */}
      <div 
        ref={bgRef}
        className="absolute inset-0 opacity-0 bg-cover bg-center blur-md"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-charcoal/60" />

      {/* Intro Elements */}
      <div className="relative z-10 flex flex-col items-center">
        {/* The thin gold line */}
        <div 
          ref={lineRef} 
          className="w-px h-32 bg-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-y-0 origin-center"
        />
        
        {/* Logo Container */}
        <div ref={logoRef} className="relative overflow-hidden mb-6 opacity-0">
          <div className="w-16 h-16 rounded-full border border-gold/50 flex items-center justify-center bg-charcoal-light/50 backdrop-blur-sm">
            <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 4c0-1.1.9-2 2-2M18 4c0-1.1-.9-2-2-2M14 4v4c0 1.1-.9 2-2 2s-2-.9-2-2V4M18 4v4c0 1.1.9 2 2 2s2-.9 2-2V4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20v-8M7 8H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1M7 14h2M12 20c-1.1 0-2-.9-2-2v-4M12 20c1.1 0 2-.9 2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Light sweep effect */}
          <div 
            ref={lightRef}
            className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
          />
        </div>

        <h1 ref={textRef} className="text-3xl md:text-5xl font-serif text-white tracking-widest uppercase opacity-0 mb-3 text-center">
          Hair Craft Salon
        </h1>
        <p ref={subtextRef} className="text-gold/80 font-sans tracking-widest text-xs md:text-sm uppercase opacity-0 text-center">
          Crafting Confidence, One Style at a Time.
        </p>
      </div>
    </div>
  );
}
