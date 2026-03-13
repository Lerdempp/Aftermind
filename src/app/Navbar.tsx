"use client";

import { useScroll, useTransform, motion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCalApi } from "@calcom/embed-react";
import styles from "./Navbar.module.css";

interface NavbarProps {
  galleryProgress: any;
  heroRef: React.RefObject<HTMLDivElement>;
}

const ANIMATION_CONFIG = {
  logo: {
    startProgress: 0.65,  // 2 scroll gecikmeli
    endProgress: 1,
    startScale: 1,
    endScale: 1.33,
    endViewportPercent: 0.03,
  },
  button: {
    startProgress: 0.90,  // 2 scroll gecikmeli
    endProgress: 1,
    slideDistance: 20,
  },
};

const NAVBAR_PADDING_X = 24;

export default function Navbar({ galleryProgress, heroRef }: NavbarProps) {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 720]);

  const [logoStartX, setLogoStartX] = useState(0);
  const [logoEndX, setLogoEndX] = useState(0);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "dark",
      });
    })();
  }, []);

  useEffect(() => {
    const updateLogoPositions = () => {
      const heroLeft =
        heroRef.current?.getBoundingClientRect().left ?? NAVBAR_PADDING_X;

      const startX = heroLeft - NAVBAR_PADDING_X + 24;
      const endLeft =
        window.innerWidth * ANIMATION_CONFIG.logo.endViewportPercent;
      const endX = endLeft - NAVBAR_PADDING_X;

      setLogoStartX(startX);
      setLogoEndX(endX);
    };

    updateLogoPositions();
    window.addEventListener("resize", updateLogoPositions);

    return () => {
      window.removeEventListener("resize", updateLogoPositions);
    };
  }, [heroRef]);

  const logoScale = useTransform(
    galleryProgress,
    [ANIMATION_CONFIG.logo.startProgress, ANIMATION_CONFIG.logo.endProgress],
    [ANIMATION_CONFIG.logo.startScale, ANIMATION_CONFIG.logo.endScale]
  );

  const logoX = useTransform(
    galleryProgress,
    [ANIMATION_CONFIG.logo.startProgress, ANIMATION_CONFIG.logo.endProgress],
    [logoStartX, logoEndX]
  );

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

  const backgroundColor = useTransform(
    galleryProgress,
    [0.95, 1],
    ["white", "rgba(255, 0, 0, 0)"]
  );

  const handleScheduleClick = () => {
    router.push("/cal");
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const lenis = (window as any).__LENIS_INSTANCE__;
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      className={styles.navbar}
      style={{ backgroundColor }}
      suppressHydrationWarning
    >
      <motion.div
        className={styles.logoIcon}
        onClick={handleLogoClick}
        style={{
          cursor: "pointer",
          scale: logoScale,
          x: logoX,
        }}
        suppressHydrationWarning
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
        suppressHydrationWarning
      >
        Schedule Call
      </motion.button>
    </motion.div>
  );
}
