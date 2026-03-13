"use client";

import { useRef, useEffect } from "react";
import { useScroll } from "motion/react";
import styles from "./page.module.css";
import LedStrip from "./LedStrip";
import HeroSection from "./HeroSection";
import PricingSection from "./PricingSection";
import Gallery from "./Gallery";
import Navbar from "./Navbar";
import Lenis from "lenis";

export default function HomePage() {
  const galleryRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: galleryProgress } = useScroll({
    target: galleryRef,
    offset: ["start 500px", "start 50px"],  // Gallery viewport'a 100px girmişken başlar, 200px girmişken biter
  });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
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
      <Navbar galleryProgress={galleryProgress} />

      {/* Üst Kısım: Scale edilen bölüm */}
      <div className={styles.page}>
        <div className={styles.container}>
          <HeroSection />
          <LedStrip />
          <PricingSection />
        </div>
      </div>

      {/* Galeri Kısmı: Scale edilmeyen, bağımsız bölüm */}
      <div ref={galleryRef} className={styles.galleryWrapper}>
        <Gallery />
      </div>
    </div>
  );
}