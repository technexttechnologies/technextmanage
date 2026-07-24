import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import styles from "./page.module.css";
import { sendInternalMail } from "../actions";

export default async function ComposeMailPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/erp/mail" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <h1>Compose Mail</h1>
        </div>
      </header>

      <div className={styles.formCard}>
        <form action={sendInternalMail} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="to">To</label>
            <input 
              type="email" 
              id="to" 
              name="to" 
              required 
              className={styles.input} 
              placeholder="Enter email address or select from list"
              list="user-emails" 
            />
            <datalist id="user-emails">
              {users.map(u => (
                <option key={u.id} value={u.email}>{u.name}</option>
              ))}
            </datalist>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cc">Cc (Optional)</label>
              <input type="email" id="cc" name="cc" className={styles.input} placeholder="cc@example.com" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="bcc">Bcc (Optional)</label>
              <input type="email" id="bcc" name="bcc" className={styles.input} placeholder="bcc@example.com" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" name="subject" required className={styles.input} placeholder="Mail subject" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="body">Message</label>
            <textarea id="body" name="body" required className={styles.textarea} rows={12} placeholder="Write your message here..."></textarea>
          </div>

          <div className={styles.formActions}>
            <Link href="/erp/mail" className={styles.btnCancel}>Cancel</Link>
            <button type="submit" className={styles.btnSubmit}>
              <Send size={18} /> Send Mail
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
