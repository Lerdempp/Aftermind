"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import styles from "./HeroSection.module.css";
import IconTeam from "../../Icons/IconTeam.svg";
import IconExposure2 from "../../Icons/IconExposure2.svg";
import IconProjects from "../../Icons/IconProjects.svg";
import Image from "next/image";

const SERVICES = [
  { id: "service1", label: "Design", model: "design" },
  { id: "service2", label: "Development", model: "development" },
  { id: "service3", label: "Animation", model: "design" },
  { id: "service4", label: "Launch Videos", model: "development" },
  { id: "service5", label: "Illustration", model: "design" },
  { id: "service6", label: "Vibe Coding", model: "development" },
];

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement>;
}

export default function HeroSection({ heroRef }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverOffset, setHoverOffset] = useState(0);
  const [activeServiceIndex, setActiveServiceIndex] = useState(-1);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const serviceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const pmRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasContainerRef.current) return;

    let mounted = true;

    async function init() {
      try {
        const coreModule = (await import("./core/index")) as any;
        const {
          PointMorph,
          registerAllTransitions,
          registerAllAnimations,
        } = coreModule;

        if (!mounted) return;

        registerAllTransitions();
        registerAllAnimations();

        const canvas = document.createElement("canvas");
        canvasContainerRef.current?.appendChild(canvas);

        const pm = new PointMorph(canvasContainerRef.current, {
          pointCount: 3500,
          radius: 3.5,
          spread: 0,
          pointSize: 0.1,
          form: "default",
          shape: "circle",
          colorMode: "solid",
          pointColor: "#00194B",
          opacity: 1,
          bgColor: "transparent",
          blendMode: "normal",
          orbitSpeed: 0.3,
          animationPreset: "none",
          animationIntensity: 0.1,
          animationSpeed: 0.8,
          autoRotate: true,
          morphSpeed: 2,
          morphEasing: "custom",
          morphTransition: "none",
          sizeAttenuation: false,
          depthFade: true,
          sparkle: false,
          fillVertexGap: true,
          pointDensity: 1.0,
          customBezier: [0, 0.12837837837837843, 0, 0.9954954954954955],
        });

        pmRef.current = pm;

        try {
          const resp = await fetch("/models/manifest.json");
          if (!resp.ok) throw new Error(`Manifest fetch failed: ${resp.status}`);

          const manifest = await resp.json();

          for (const entry of manifest) {
            if (!mounted) break;
            try {
              await pm.loadModel(`/models/${entry.file}`, entry.id);
            } catch (e) {
              console.error(`Failed to load model ${entry.id}:`, e);
            }
          }
        } catch (e) {
          console.error("Manifest load error:", e);
        }
      } catch (error) {
        console.error("PointMorph init error:", error);
      }
    }

    init();

    return () => {
      mounted = false;
      if (pmRef.current?.destroy) {
        pmRef.current.destroy();
      }
    };
  }, []);

  // Auto-loop effect
  useEffect(() => {
    if (isUserInteracting) return;

    const interval = setInterval(() => {
      setActiveServiceIndex((prev) => (prev + 1) % SERVICES.length);
    }, 3000); // Updated to 3s

    return () => clearInterval(interval);
  }, [isUserInteracting, SERVICES.length]); // Re-run when services or interaction state changes

  // Handle active service change (either auto or manual)
  useEffect(() => {
    // If user is manually hovering, handleHover handles the morph.
    // Index -1 means idle (initial state)
    if (isUserInteracting || activeServiceIndex < 0) return;

    const service = SERVICES[activeServiceIndex];
    const el = serviceRefs.current[activeServiceIndex];

    if (el && pmRef.current) {
      setHoverOffset(el.offsetTop);
      setIsHovered(true);
      pmRef.current.morphToModel(service.model);
    }
  }, [activeServiceIndex, isUserInteracting]);

  // Initial fix: Ensure the icon container is visible at the correct height on mount
  useLayoutEffect(() => {
    const el = serviceRefs.current[0];
    if (el) {
      setHoverOffset(el.offsetTop);
      setIsHovered(true); // Shows the default sphere immediately
    }
  }, []);

  const handleHover = (
    e: React.MouseEvent<HTMLSpanElement>,
    modelId: string,
    index: number
  ) => {
    setIsUserInteracting(true);
    setActiveServiceIndex(index);
    setHoverOffset(e.currentTarget.offsetTop);
    setIsHovered(true);

    if (pmRef.current) {
      try {
        pmRef.current.morphToModel(modelId);
      } catch (err) {
        console.error("Morph error:", err);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsUserInteracting(false);
    setIsHovered(false);

    if (pmRef.current) {
      try {
        pmRef.current.morphToDefault();
      } catch (e) {
        console.error("Morph to default error:", e);
      }
    }
  };

  return (
    <div ref={heroRef} className={styles.heroSection}>
      <div className={styles.heroChild1}>
        <span className={styles.title}>We are After Mind</span>
      </div>

      <div className={styles.heroChild2}>
        <div className={styles.heroChild2_1}>
          <span className={styles.subtitle}>Today includes we have</span>
          <div className={styles.heroChild2_1_2}>
            <div className={styles.iconItem}>
              <Image src={IconTeam} alt="Team" width={20} height={20} />
              <span className={styles.iconText}>
                We have professional teammates
              </span>
            </div>

            <div className={styles.iconItem}>
              <Image
                src={IconExposure2}
                alt="Experience"
                width={20}
                height={20}
              />
              <span className={styles.iconText}>4+ years experience,</span>
            </div>

            <span className={styles.iconText}>and already complete</span>

            <div className={styles.iconItem}>
              <Image src={IconProjects} alt="Projects" width={20} height={20} />
              <span className={styles.iconText}>20+ Project</span>
            </div>
          </div>
        </div>

        <div className={styles.heroChild2_2} onMouseLeave={handleMouseLeave}>
          <div
            ref={canvasContainerRef}
            className={`${styles.morphCanvas} ${isHovered ? styles.morphCanvasVisible : ""
              }`}
            style={{ transform: `translateY(${hoverOffset}px)` }}
          />

          <span className={styles.andWeDoText}>And, we do</span>

          <div className={styles.servicesContainer}>
            {SERVICES.map((service, index) => (
              <span
                key={service.id}
                ref={(el) => {
                  serviceRefs.current[index] = el;
                }}
                className={`${styles.serviceText} ${activeServiceIndex === index && !isUserInteracting
                  ? styles.serviceTextActive
                  : ""
                  }`}
                onMouseEnter={(e) => handleHover(e, service.model, index)}
              >
                {service.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}