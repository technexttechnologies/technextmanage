"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "./actions";
import styles from "../login/page.module.css";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.loginBtn} disabled={pending}>
      {pending ? "Resetting..." : "Reset Password"}
    </button>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  // Need to bind the token to the action
  const resetWithToken = resetPassword.bind(null, token || "");
  const [state, formAction] = useFormState(resetWithToken, null);

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div className={styles.error} style={{ justifyContent: "center", marginBottom: "24px" }}>
          <AlertCircle size={16} />
          Invalid or missing reset token.
        </div>
        <Link href="/forgot-password" className={styles.loginBtn} style={{ display: "inline-block", textDecoration: "none", boxSizing: "border-box" }}>
          Request New Link
        </Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#16a34a" }}>
          <CheckCircle2 size={48} />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Password Reset Complete</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
          Your password has been successfully updated.
        </p>
        <Link href="/login" className={styles.loginBtn} style={{ display: "inline-block", textDecoration: "none", width: "100%", boxSizing: "border-box" }}>
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>New Password</label>
        <div className={styles.inputWrapper}>
          <Lock size={18} className={styles.inputIcon} />
          <input type="password" name="password" placeholder="••••••••" required minLength={6} />
        </div>
      </div>
      
      <div className={styles.inputGroup}>
        <label>Confirm Password</label>
        <div className={styles.inputWrapper}>
          <Lock size={18} className={styles.inputIcon} />
          <input type="password" name="confirmPassword" placeholder="••••••••" required minLength={6} />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon} style={{ background: 'transparent', boxShadow: 'none', marginBottom: '16px' }}>
            <img src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png" alt="TECHNEXT Logo" style={{ width: '200px', height: 'auto' }} />
          </div>
          <h1 style={{ display: 'none' }}>TECHNEXT CRM</h1>
          <p>Create a new secure password</p>
        </div>

        <Suspense fallback={<div style={{ textAlign: "center" }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
