"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";

export default function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const trackWidth = trackRef.current.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setTotalDistance(Math.max(trackWidth - vw, 0));
      setViewportHeight(vh);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let wheelTimeout: NodeJS.Timeout;
    let isLocked = false;
    let isWheeling = false;

    // "Pin" the scroll at the top of the gallery to kill any fast scrolling momentum
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      
      const offsetTop = containerRef.current.offsetTop;
      const currentScrollY = window.scrollY;
      
      isWheeling = true;
      clearTimeout(wheelTimeout);

      // Lock is released after 150ms of no wheel events
      wheelTimeout = setTimeout(() => {
        isWheeling = false;
        isLocked = false;
      }, 150);

      if (isLocked) {
        if (e.deltaY < 0) {
          isLocked = false; // Allow scrolling back up
        } else {
          e.preventDefault(); // Kill the momentum down
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, []);

  // Use framer motion for horizontal scroll hijacking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const DELAY_PX = 300; // Small delay before horizontal track starts moving
  const sectionHeight =
    totalDistance > 0
      ? totalDistance + viewportHeight + DELAY_PX
      : viewportHeight || 800;

  const startFraction = sectionHeight > 0 ? DELAY_PX / sectionHeight : 0;
  
  const x = useTransform(
    scrollYProgress,
    [0, startFraction, 1],
    [0, 0, -totalDistance],
  );

  return (
    <div
      ref={containerRef}
      className={styles.gallerySection}
      style={{ height: `${sectionHeight}px` }}
    >
      <div className={styles.stickyContainer}>
        <motion.div ref={trackRef} style={{ x }} className={styles.galleryContent}>
          <div className={styles.firstContainer}>
            <div className={styles.childContainer}>
              <div className={styles.innerChild}>
                <img src={Card1.src} alt="C1" className={styles.cardImage} />
              </div>
              <div className={styles.innerChild}>
                <img src={Card2.src} alt="C2" className={styles.cardImage} />
              </div>
            </div>

            <div className={styles.childContainer2}>
              <div className={styles.innerChild}>
                <img src={Card1.src} alt="C1" className={styles.cardImage} />
              </div>
              <div className={styles.innerChild}>
                <img src={Card2.src} alt="C2" className={styles.cardImage} />
              </div>
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
    </div>
  );
}
