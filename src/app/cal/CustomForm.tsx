"use client";

import React, { useState } from "react";
import styles from "./CustomForm.module.css";

export default function CustomForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    source: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Submit logic goes here
    alert("Form submitted! (Backend integration pending)");
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter name here..."
          className={styles.input}
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter email here..."
          className={styles.input}
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>What Service you're looking for?</label>
        <div className={styles.selectWrapper}>
          <select
            name="service"
            className={styles.select}
            value={formData.service}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>Select services here...</option>
            <option value="web-development">Web Development</option>
            <option value="ui-ux">UI/UX Design</option>
            <option value="branding">Branding</option>
          </select>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.infoIcon}>i</div>
          <span>Currently project cost <span className={styles.boldPrice}>$8,000</span></span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>How did you hear about us?</label>
        <div className={styles.selectWrapper}>
          <select
            name="source"
            className={styles.select}
            value={formData.source}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>X/Twitter</option>
            <option value="twitter">X/Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="google">Google Search</option>
            <option value="referral">Referral</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Anything else we should know?</label>
        <input
          type="text"
          name="notes"
          placeholder="Enter details here..."
          className={styles.input}
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <div className={styles.buttonsRow}>
        <button type="button" className={styles.cancelButton} onClick={() => window.history.back()}>
          Cancel
        </button>
        <button type="submit" className={styles.applyButton}>
          Apply
        </button>
      </div>
    </form>
  );
}
