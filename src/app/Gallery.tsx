"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { useScroll, useTransform, motion } from "motion/react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";

export default function Gallery() {
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateMetrics = () => {
      setWindowWidth(window.innerWidth);
      if (scrollRef.current) {
        setScrollWidth(scrollRef.current.scrollWidth);
      }
    };
    
    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => window.removeEventListener("resize", updateMetrics);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });
  
  // Add a settling phase: horizontal movement only starts after 15% of scroll progress
  // This creates a "landing" effect where the section pins first, then slides
  const x = useTransform(
    scrollYProgress, 
    [0, 0.04, 1], // 0-15% = settled/pinned, 15-100% = horizontal scroll
    [0, 0, -(scrollWidth - windowWidth)]
  );

  return (
    <section 
      ref={targetRef} 
      className={styles.gallerySection} 
      style={{ height: scrollWidth > 0 ? `${scrollWidth}px` : "200vh" }}
    >
      <div className={styles.stickyContainer}>
        <motion.div ref={scrollRef} style={{ x }} className={styles.galleryContent}>
          <div className={styles.firstContainer}>
            <div className={styles.childContainer}>
              <div className={styles.innerChild}><img src={Card1.src} alt="C1" className={styles.cardImage} /></div>
              <div className={styles.innerChild}><img src={Card2.src} alt="C2" className={styles.cardImage} /></div>
            </div>
            <div className={styles.childContainer2}>
              <div className={styles.innerChild}><img src={Card1.src} alt="C1" className={styles.cardImage} /></div>
              <div className={styles.innerChild}><img src={Card2.src} alt="C2" className={styles.cardImage} /></div>
            </div>
          </div>

          <div className={styles.page1}>
            <img src={Card2.src} alt="C2" className={styles.page1Image} />
          </div>

          <div className={styles.page}>
            <img src={Card2.src} alt="C2" className={styles.pageImage} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}