"use client";

import React, { useState } from "react";
import CustomForm from "./CustomForm";
import styles from "./CustomForm.module.css";

export default function CustomScheduler() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      setStep(2);
    } else {
      alert("Please select both a date and a time.");
    }
  };

  if (step === 2) {
    return <CustomForm />;
  }

  return (
    <div className={styles.formContainer}>
      <h2 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600", color: "#00194B" }}>
        Select a Date & Time
      </h2>

      <div className={styles.field}>
        <label className={styles.label}>Date</label>
        <input
          type="date"
          className={styles.input}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Time</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          >
            <option value="" disabled hidden>Select time...</option>
            <option value="09:00">09:00 AM</option>
            <option value="09:30">09:30 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="10:30">10:30 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="11:30">11:30 AM</option>
            <option value="13:00">01:00 PM</option>
            <option value="13:30">01:30 PM</option>
            <option value="14:00">02:00 PM</option>
            <option value="14:30">02:30 PM</option>
            <option value="15:00">03:00 PM</option>
            <option value="15:30">03:30 PM</option>
            <option value="16:00">04:00 PM</option>
            <option value="16:30">04:30 PM</option>
          </select>
        </div>
      </div>

      <div className={styles.buttonsRow}>
        <button type="button" className={styles.applyButton} onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
