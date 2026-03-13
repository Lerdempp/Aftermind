"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";

const DELAY_PX = 300;

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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

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
        <motion.div
          ref={trackRef}
          style={{ x }}
          className={styles.galleryContent}
        >
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
