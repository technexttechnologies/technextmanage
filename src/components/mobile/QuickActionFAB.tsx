"use client";

import { useState } from "react";
import { Plus, Users, Target, PhoneCall, Briefcase } from "lucide-react";
import styles from "./QuickActionFAB.module.css";
import Link from "next/link";

export default function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.fabContainer}>
        {/* Action Menu Items */}
        <div className={`${styles.actionMenu} ${isOpen ? styles.open : ""}`}>
          <Link href="/customers/new" className={styles.actionItem} onClick={() => setIsOpen(false)}>
            <span className={styles.actionLabel}>Add Customer</span>
            <div className={styles.actionIcon}><Users size={20} /></div>
          </Link>
          <Link href="/leads/new" className={styles.actionItem} onClick={() => setIsOpen(false)}>
            <span className={styles.actionLabel}>Add Lead</span>
            <div className={styles.actionIcon}><Target size={20} /></div>
          </Link>
          <Link href="/follow-ups/new" className={styles.actionItem} onClick={() => setIsOpen(false)}>
            <span className={styles.actionLabel}>Add Follow-up</span>
            <div className={styles.actionIcon}><PhoneCall size={20} /></div>
          </Link>
          <Link href="/projects/new" className={styles.actionItem} onClick={() => setIsOpen(false)}>
            <span className={styles.actionLabel}>Add Project</span>
            <div className={styles.actionIcon}><Briefcase size={20} /></div>
          </Link>
        </div>

        {/* Main FAB Button */}
        <button 
          className={`${styles.fab} ${isOpen ? styles.fabActive : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Quick Actions"
        >
          <Plus size={24} className={styles.fabIcon} />
        </button>
      </div>
    </>
  );
}
