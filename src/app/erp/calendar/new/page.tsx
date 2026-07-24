import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import styles from "./page.module.css";
import { addEvent } from "../actions";

export default async function AddEventPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/erp/calendar" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Add Event</h1>
        </div>
      </header>

      <div className={styles.formCard}>
        <form action={addEvent} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Event Title</label>
            <input type="text" id="title" name="title" required className={styles.input} placeholder="e.g., Team Sync" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Event Type</label>
              <select id="type" name="type" required className={styles.input}>
                <option value="MEETING">Meeting</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="HR">HR Activity</option>
                <option value="EVENT">Company Event</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="date">Date</label>
              <input type="date" id="date" name="date" required className={styles.input} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="startTime">Start Time (Optional)</label>
              <input type="time" id="startTime" name="startTime" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endTime">End Time (Optional)</label>
              <input type="time" id="endTime" name="endTime" className={styles.input} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="location">Location (Optional)</label>
              <input type="text" id="location" name="location" className={styles.input} placeholder="e.g., Conf Room 1" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="meetLink">Meet Link (Optional)</label>
              <input type="url" id="meetLink" name="meetLink" className={styles.input} placeholder="https://meet.google.com/..." />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description (Optional)</label>
            <textarea id="description" name="description" className={styles.textarea} rows={4} placeholder="Event details..."></textarea>
          </div>

          <div className={styles.formActions}>
            <Link href="/erp/calendar" className={styles.btnCancel}>Cancel</Link>
            <button type="submit" className={styles.btnSubmit}>
              <CalendarPlus size={18} /> Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
