"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";

const PAUSE_THRESHOLD = 140;
const EDGE_TOLERANCE = 2;
const LERP = 0.14;
const MIN_DELTA = 1.5;

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [sectionHeight, setSectionHeight] = useState(1000);

  const maxHorizontalScrollRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const currentXRef = useRef(0);
  const targetXRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // boundary accumulators
  const enterPauseAccRef = useRef(0); // dikey -> yatay giriş
  const endPauseAccRef = useRef(0); // sondan geri dönüş
  const exitPauseAccRef = useRef(0); // baştan dikeye çıkış

  // boundary state flags
  const enteredForwardRef = useRef(false);
  const leftEndRef = useRef(false);

  const applyTransform = (x: number) => {
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };

  const resetPauseState = () => {
    enterPauseAccRef.current = 0;
    endPauseAccRef.current = 0;
    exitPauseAccRef.current = 0;
    enteredForwardRef.current = false;
    leftEndRef.current = false;
  };

  const animate = () => {
    const current = currentXRef.current;
    const target = targetXRef.current;
    const diff = target - current;

    if (Math.abs(diff) < 0.1) {
      currentXRef.current = target;
      applyTransform(target);
      rafRef.current = null;
      return;
    }

    const next = current + diff * LERP;
    currentXRef.current = next;
    applyTransform(next);

    rafRef.current = window.requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(animate);
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const updateMetrics = () => {
      if (!trackRef.current) return;

      const totalWidth = trackRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalDistance = Math.max(totalWidth - viewportWidth, 0);

      maxHorizontalScrollRef.current = horizontalDistance;
      viewportHeightRef.current = viewportHeight;

      currentXRef.current = clamp(
        currentXRef.current,
        -horizontalDistance,
        0
      );
      targetXRef.current = clamp(targetXRef.current, -horizontalDistance, 0);

      applyTransform(currentXRef.current);

      setSectionHeight(
        horizontalDistance > 0 ? horizontalDistance + viewportHeight : viewportHeight
      );
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const isGalleryActive = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom > window.innerHeight;
    };

    const handleWheel = (e: WheelEvent) => {
      const maxHorizontalScroll = maxHorizontalScrollRef.current;

      if (maxHorizontalScroll <= 0) return;

      if (!isGalleryActive()) {
        resetPauseState();
        return;
      }

      const delta = normalizeWheelDelta(e);

      if (Math.abs(delta) < MIN_DELTA) return;

      const currentX = targetXRef.current;
      const scrollingDown = delta > 0;
      const scrollingUp = delta < 0;

      const atStart = currentX >= -EDGE_TOLERANCE;
      const atEnd = currentX <= -maxHorizontalScroll + EDGE_TOLERANCE;

      if (scrollingDown) {
        e.preventDefault();

        // Sondaysa aşağı devam yok
        if (atEnd) {
          targetXRef.current = -maxHorizontalScroll;
          endPauseAccRef.current = 0;
          exitPauseAccRef.current = 0;
          leftEndRef.current = false;
          startAnimation();
          return;
        }

        // Başlangıçta önce bir dur
        if (atStart && !enteredForwardRef.current) {
          enterPauseAccRef.current += Math.abs(delta);

          targetXRef.current = 0;
          startAnimation();

          if (enterPauseAccRef.current < PAUSE_THRESHOLD) {
            return;
          }

          enteredForwardRef.current = true;
          enterPauseAccRef.current = 0;
        }

        // İleri giderken diğer state'leri temizle
        endPauseAccRef.current = 0;
        exitPauseAccRef.current = 0;
        leftEndRef.current = false;

        targetXRef.current = clamp(
          currentX - delta,
          -maxHorizontalScroll,
          0
        );

        if (targetXRef.current < -EDGE_TOLERANCE) {
          enteredForwardRef.current = true;
        }

        if (targetXRef.current <= -maxHorizontalScroll + EDGE_TOLERANCE) {
          leftEndRef.current = false;
          endPauseAccRef.current = 0;
        }

        startAnimation();
        return;
      }

      if (scrollingUp) {
        // Sondan geri dönerken önce bir dur
        if (atEnd && !leftEndRef.current) {
          e.preventDefault();

          endPauseAccRef.current += Math.abs(delta);
          targetXRef.current = -maxHorizontalScroll;
          startAnimation();

          if (endPauseAccRef.current < PAUSE_THRESHOLD) {
            return;
          }

          leftEndRef.current = true;
          endPauseAccRef.current = 0;
          return;
        }

        // Hala yatay alan içindeysek önce yatay geri gel
        if (!atStart) {
          e.preventDefault();

          targetXRef.current = clamp(
            currentX - delta,
            -maxHorizontalScroll,
            0
          );

          enteredForwardRef.current = false;
          exitPauseAccRef.current = 0;

          startAnimation();
          return;
        }

        // Başa geldiğinde önce bir dur, sonra dikey yukarı çıkış
        if (atStart) {
          exitPauseAccRef.current += Math.abs(delta);
          targetXRef.current = 0;
          startAnimation();

          if (exitPauseAccRef.current < PAUSE_THRESHOLD) {
            e.preventDefault();
            return;
          }

          resetPauseState();
          return;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.gallerySection}
      style={{ height: `${sectionHeight}px` }}
    >
      <div className={styles.stickyContainer}>
        <div ref={trackRef} className={styles.galleryContent}>
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
        </div>
      </div>
    </section>
  );
}

function normalizeWheelDelta(e: WheelEvent) {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}