"use client";

import { useTransition } from "react";
import { updateExpenseStatus } from "../actions";
import styles from "../page.module.css";

export default function StatusDropdown({ id, currentStatus, isAdmin }: { id: string, currentStatus: string, isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) {
    return (
      <span className={`${styles.badge} ${styles[currentStatus.toLowerCase()] || ''}`}>
        {currentStatus}
      </span>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(() => {
      updateExpenseStatus(id, newStatus);
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className={styles.select}
      style={{ padding: "4px 8px", fontSize: "12px", width: "auto" }}
    >
      <option value="PENDING">PENDING</option>
      <option value="APPROVED">APPROVED</option>
      <option value="PAID">PAID</option>
    </select>
  );
}
