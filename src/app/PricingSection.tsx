"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./PricingSection.module.css";
import IconMouseScrollDown from "../../Icons/IconMouseScrollDown.svg";
import IconSwipe from "../../Icons/swipe.svg";
import Image from "next/image";

export default function PricingSection() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleScheduleClick = () => {
    router.push("/cal");
  };

  return (
    <div className={styles.pricingSection}>
      <div className={styles.pricingChild1}>
        <span className={styles.priceText}>$8,000</span>
        <span className={styles.startingText}>starting from</span>
      </div>
      <div className={styles.pricingChild2}>
        <div className={styles.pricingChild2_1} onClick={handleScheduleClick}>
          <span className={styles.buttonText}>Schedule Call</span>
        </div>
        <div className={styles.pricingChild2_2}>
          <Image src={isMobile ? IconSwipe : IconMouseScrollDown} alt={isMobile ? "Swipe" : "Scroll"} width={20} height={20} />
          <span className={styles.scrollText}>{isMobile ? "Swipe to see our works" : "Scroll to see our works"}</span>
        </div>
      </div>
    </div>
  );
}
