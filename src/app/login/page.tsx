"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "./actions";
import styles from "./page.module.css";
import { Lock, Mail, AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.loginBtn} disabled={pending}>
      {pending ? "Authenticating..." : "Sign In to CRM"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon} style={{ background: 'transparent', boxShadow: 'none', marginBottom: '16px' }}>
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '200px', height: 'auto' }} />
          </div>
          <h1 style={{ display: 'none' }}>TECHNEXT CRM</h1>
          <p>Please sign in to access your dashboard</p>
        </div>

        <form action={formAction} className={styles.form}>
          {state?.error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              {state.error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input type="email" name="email" placeholder="admin@technext.com" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input type="password" name="password" placeholder="••••••••" required />
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
