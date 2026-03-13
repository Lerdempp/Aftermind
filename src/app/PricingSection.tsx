"use client";

import { useRouter } from "next/navigation";
import styles from "./PricingSection.module.css";
import IconMouseScrollDown from "../../Icons/IconMouseScrollDown.svg";
import Image from "next/image";

export default function PricingSection() {
  const router = useRouter();

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
          <Image src={IconMouseScrollDown} alt="Scroll" width={20} height={20} />
          <span className={styles.scrollText}>Scroll to see our works</span>
        </div>
      </div>
    </div>
  );
}
