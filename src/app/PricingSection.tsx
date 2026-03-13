"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import styles from "./PricingSection.module.css";
import IconMouseScrollDown from "../../Icons/IconMouseScrollDown.svg";
import Image from "next/image";

export default function PricingSection() {
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

  const handleScheduleClick = async () => {
    const cal = await getCalApi({ namespace: "30min" });
    cal("modal", {
      calLink: "aftermind/30min",
      config: {
        layout: "month_view",
        theme: "dark",
      },
    });
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
          <Image src={IconMouseScrollDown} alt="Scroll" width={20} height={20} />
          <span className={styles.scrollText}>Scroll to see our works</span>
        </div>
      </div>
    </div>
  );
}
