"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [maxHorizontalScroll, setMaxHorizontalScroll] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const rawX = useMotionValue(0);

  const x = useSpring(rawX, {
    stiffness: 140,
    damping: 26,
    mass: 0.4,
  });

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const updateMetrics = () => {
      if (!trackRef.current) return;

      const totalWidth = trackRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      const horizontalDistance = Math.max(totalWidth - viewportWidth, 0);

      setMaxHorizontalScroll(horizontalDistance);
      setViewportHeight(window.innerHeight);

      const currentX = rawX.get();
      const clampedX = Math.max(-horizontalDistance, Math.min(0, currentX));
      rawX.set(clampedX);
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, [rawX]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const isGalleryActive = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom > window.innerHeight;
    };

    const handleWheel = (e: WheelEvent) => {
      if (maxHorizontalScroll <= 0) return;
      if (!isGalleryActive()) return;

      const currentX = rawX.get();
      const delta = e.deltaY;

      const atStart = currentX >= 0;
      const atEnd = currentX <= -maxHorizontalScroll;

      const scrollingDown = delta > 0;
      const scrollingUp = delta < 0;

      // Aşağı inerken yatayda sona gelmediysek scroll'u kilitle ve yataya çevir
      if (scrollingDown && !atEnd) {
        e.preventDefault();

        const nextX = currentX - delta;
        const clampedX = Math.max(-maxHorizontalScroll, Math.min(0, nextX));
        rawX.set(clampedX);
        return;
      }

      // Yukarı çıkarken yatayda başa gelmediysek scroll'u kilitle ve geri yataya çevir
      if (scrollingUp && !atStart) {
        e.preventDefault();

        const nextX = currentX - delta;
        const clampedX = Math.max(-maxHorizontalScroll, Math.min(0, nextX));
        rawX.set(clampedX);
        return;
      }

      // scrollingDown && atEnd ise aşağı devam etmesine izin verme:
      // çünkü burası sayfanın sonu gibi davranacak
      if (scrollingDown && atEnd) {
        e.preventDefault();
        return;
      }

      // scrollingUp && atStart ise normal yukarı çıkışa izin ver
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [maxHorizontalScroll, rawX]);

  // Sayfanın son section'ı gibi davranması için:
  // sticky alan (1 viewport) + yatay gidilecek mesafe kadar yükseklik yeterli
  const sectionHeight =
    maxHorizontalScroll > 0
      ? maxHorizontalScroll + viewportHeight
      : viewportHeight;

  return (
    <section
      ref={sectionRef}
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
    </section>
  );
}