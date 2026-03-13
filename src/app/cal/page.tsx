"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import styles from "./page.module.css";

export default function CalPage() {
  const router = useRouter();

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#00194B" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <motion.div 
      className={styles.calPageWrapper}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className={styles.headerWrapper}>
        <button 
          onClick={() => router.push("/")}
          className={styles.backButton}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00194B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className={styles.titleAccent}>Book a 30 min call.</h1>
        <h1 className={styles.titleBlack}>And we'll reach out.</h1>
      </div>

      <div className={styles.calendarContainer}>
        <Cal
          namespace="30min"
          calLink="aftermind/30min"
          style={{ width: "100%", height: "700px" }}
          config={{ layout: "month_view", theme: "light" }}
        />
      </div>
    </motion.div>
  );
}
