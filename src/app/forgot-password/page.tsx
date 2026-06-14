"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestReset } from "./actions";
import styles from "../login/page.module.css";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.loginBtn} disabled={pending}>
      {pending ? "Sending..." : "Send Reset Link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(requestReset, null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon} style={{ background: 'transparent', boxShadow: 'none', marginBottom: '16px' }}>
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '200px', height: 'auto' }} />
          </div>
          <h1 style={{ display: 'none' }}>TECHNEXT CRM</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {state?.success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#16a34a" }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Check your email</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              We've sent a password reset link to your email address.
            </p>
            <Link href="/login" style={{ color: "var(--brand-primary)", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
              Return to Login
            </Link>
          </div>
        ) : (
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

            <SubmitButton />
            
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "13px", fontWeight: "500" }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
