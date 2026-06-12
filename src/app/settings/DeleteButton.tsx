"use client";

import { Trash2 } from "lucide-react";
import styles from "./page.module.css";

export function DeleteButton() {
  return (
    <button type="submit" className={styles.deleteBtn} onClick={(e) => {
      if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
        e.preventDefault();
      }
    }}>
      <Trash2 size={16} /> Delete
    </button>
  );
}
