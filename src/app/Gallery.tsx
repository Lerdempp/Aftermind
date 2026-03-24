"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";
import Card1 from "../../Images/Card1.svg";
import Card2 from "../../Images/Card2.svg";
import Image from "next/image";
import ZoomInIcon from "../../Icons/zoom-in.svg";
import CrossIcon from "../../Icons/cross-small.svg";

export default function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      const trackWidth = trackRef.current.scrollWidth;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      
      // Calculate layout only if not mobile
      if (!mobile) {
        setTotalDistance(Math.max(trackWidth - vw + 24, 0));
        setViewportHeight(vh);
      } else {
        setTotalDistance(0);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    let wheelTimeout: NodeJS.Timeout;
    let isLocked = false;
    let isWheeling = false;

    // "Pin" the scroll at the top of the gallery to kill any fast scrolling momentum
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      
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
  }, [isMobile]);

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

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const lenis = (window as any).__LENIS_INSTANCE__;
    if (selectedImage) {
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
    } else {
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }

    return () => {
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    };
  }, [selectedImage]);

  return (
    <>
      <div
        ref={containerRef}
        className={styles.gallerySection}
        style={isMobile ? { height: "auto" } : { height: `${sectionHeight}px` }}
      >
        <div className={styles.stickyContainer}>
          <motion.div ref={trackRef} style={isMobile ? { x: 0 } : { x }} className={styles.galleryContent}>
            <div className={styles.firstContainer}>
              <div className={styles.childContainer}>
                <div className={styles.innerChild}>
                  <img src={Card1.src} alt="C1" className={styles.cardImage} onClick={() => isMobile && setSelectedImage(Card1.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
                </div>
                <div className={styles.innerChild}>
                  <img src={Card2.src} alt="C2" className={styles.cardImage} onClick={() => isMobile && setSelectedImage(Card2.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
                </div>
              </div>

              <div className={styles.childContainer2}>
                <div className={styles.innerChild}>
                  <img src={Card1.src} alt="C1" className={styles.cardImage} onClick={() => isMobile && setSelectedImage(Card1.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
                </div>
                <div className={styles.innerChild}>
                  <img src={Card2.src} alt="C2" className={styles.cardImage} onClick={() => isMobile && setSelectedImage(Card2.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
                </div>
              </div>
            </div>

            <div className={styles.page1}>
              <img src={Card2.src} alt="C2" className={styles.page1Image} onClick={() => isMobile && setSelectedImage(Card2.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
            </div>

            <div className={styles.page}>
              <img src={Card2.src} alt="C2" className={styles.pageImage} onClick={() => isMobile && setSelectedImage(Card2.src)} style={{ cursor: isMobile ? "pointer" : "default" }} />
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.lightboxOverlay}
            onClick={() => setSelectedImage(null)}
          >
            <div className={styles.lightboxTopLeft}>
              <Image src={ZoomInIcon} alt="Zoom" width={24} height={24} />
              <span>Pinch to zoom</span>
            </div>
            
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={selectedImage}
              alt="Full screen view"
              className={styles.lightboxImage}
              onClick={(e) => e.stopPropagation()}
            />
            <button className={styles.lightboxClose} onClick={() => setSelectedImage(null)}>
              <Image src={CrossIcon} alt="Close" width={24} height={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
