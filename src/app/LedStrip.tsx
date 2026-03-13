import { motion } from "motion/react";
import styles from "./LedStrip.module.css";

export default function LedStrip() {
  const ellipseCount = 158;
  
  return (
    <div className={styles.ledStripWrapper}>
      <div className={styles.ledStrip}>
        {Array.from({ length: ellipseCount }).map((_, i) => (
          <motion.svg
            key={i} 
            className={styles.ellipse}
            width="2"
            height="2"
            viewBox="0 0 2 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
              opacity: [0.04, Math.random() * 0.2 + 0.04, 0.1]
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          >
            <circle cx="1" cy="1" r="1" fill="#00194B"/>
          </motion.svg>
        ))}
      </div>
      <div className={styles.ledStrip}>
        {Array.from({ length: ellipseCount }).map((_, i) => (
          <motion.svg
            key={i} 
            className={styles.ellipse}
            width="2"
            height="2"
            viewBox="0 0 2 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
              opacity: [0.04, Math.random() * 0.2 + 0.04, 0.1]
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          >
            <circle cx="1" cy="1" r="1" fill="#00194B"/>
          </motion.svg>
        ))}
      </div>
    </div>
  );
}
