"use client";

import { useRef, useEffect } from "react";
import { useScroll } from "motion/react";
import { motion } from "motion/react";
import styles from "./page.module.css";
import LedStrip from "./LedStrip";
import HeroSection from "./HeroSection";
import PricingSection from "./PricingSection";
import Gallery from "./Gallery";
import Navbar from "./Navbar";
import Lenis from "lenis";

export default function HomePage() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: galleryProgress } = useScroll({
    target: galleryRef,
    offset: ["start 1500px", "start 0px"],
  });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.15, 
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className={styles.mainWrapper}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Navbar galleryProgress={galleryProgress} heroRef={heroRef} />

        <div className={styles.page}>
          <div className={styles.container}>
            <HeroSection heroRef={heroRef} />
            <LedStrip />
            <PricingSection />
          </div>
        </div>

        <div ref={galleryRef} className={styles.galleryWrapper}>
          <Gallery />
        </div>
      </motion.div>
    </div>
  );
}