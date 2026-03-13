"use client";

import { useScroll, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import styles from "./Navbar.module.css";

interface NavbarProps {
  galleryProgress: any;
}

// Animasyon konfigürasyonu - Tüm değerler buradan ayarlanabilir
const ANIMATION_CONFIG = {
  navbar: {
    startProgress: 0,  // Animasyonun başladığı scroll progress (0-1 arası)
    endProgress: 1,    // Animasyonun bittiği scroll progress (0-1 arası)
    startPosition: 212,   // Başlangıç pozisyonu (px)
    endPosition: -226,    // Bitiş pozisyonu (px)
  },
  logo: {
    startProgress: 0,  // Logo scale başlangıcı
    endProgress: 0.5,    // Logo scale bitişi
    startScale: 1,        // Başlangıç boyutu
    endScale: 1.33,       // Bitiş boyutu (1.33 = %33 büyüme)
  },
  button: {
    startProgress: 0.7,   // Butonun görünmeye başladığı progress
    endProgress: 1,     // Butonun tam görünür olduğu progress
    slideDistance: 20,    // Sağdan kayma mesafesi (px)
  },
};

export default function Navbar({ galleryProgress }: NavbarProps) {
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 720]);

  // Cal.com embed initialization
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "dark", // Dark theme kullanarak koyu görünüm
      });
    })();
  }, []);

  const handleScheduleClick = async () => {
    const cal = await getCalApi({ namespace: "30min" });
    cal("modal", {
      calLink: "aftermind/30min",
      config: {
        layout: "month_view",
        theme: "dark", // Dark theme
      },
    });
  };

  // Navbar pozisyon animasyonu
  const navbarLeft = useTransform(
    galleryProgress,
    [0, ANIMATION_CONFIG.navbar.startProgress, ANIMATION_CONFIG.navbar.endProgress],
    [
      ANIMATION_CONFIG.navbar.startPosition,
      ANIMATION_CONFIG.navbar.startPosition,
      ANIMATION_CONFIG.navbar.endPosition,
    ]
  );

  // Logo scale animasyonu
  const logoScale = useTransform(
    galleryProgress,
    [ANIMATION_CONFIG.logo.startProgress, ANIMATION_CONFIG.logo.endProgress],
    [ANIMATION_CONFIG.logo.startScale, ANIMATION_CONFIG.logo.endScale]
  );

  // Button animasyonları
  const buttonOpacity = useTransform(
    galleryProgress,
    [ANIMATION_CONFIG.button.startProgress, ANIMATION_CONFIG.button.endProgress],
    [0, 1]
  );

  const buttonX = useTransform(
    galleryProgress,
    [ANIMATION_CONFIG.button.startProgress, ANIMATION_CONFIG.button.endProgress],
    [ANIMATION_CONFIG.button.slideDistance, 0]
  );

  const buttonPointerEvents = useTransform(buttonOpacity, (v) =>
    v > 0.02 ? "auto" : "none"
  );

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      className={styles.navbar}
      style={{
        left: navbarLeft,
        right: 24,
      }}
    >
      <motion.div
        className={styles.logoIcon}
        onClick={handleLogoClick}
        style={{
          cursor: "pointer",
          scale: logoScale,
        }}
      >
        <svg viewBox="0 0 24 24" className={styles.logoBase}>
          <circle cx="12" cy="12" r="12" fill="#00194B" />
        </svg>

        <motion.svg
          viewBox="0 0 24 24"
          style={{
            rotate,
            transformOrigin: "12px 12px",
          }}
          className={styles.logoArc}
        >
          <path
            d="M 3.5 12 A 8.5 8.5 0 0 0 12 20.5"
            stroke="#F7F7F8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.svg>
      </motion.div>

      <motion.button
        className={styles.scheduleButton}
        onClick={handleScheduleClick}
        style={{
          opacity: buttonOpacity,
          x: buttonX,
          pointerEvents: buttonPointerEvents as any,
        }}
      >
        Schedule Call
      </motion.button>
    </motion.div>
  );
}
