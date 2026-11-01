export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GraduationCap, Shield } from "lucide-react";
import FacultyNavTabs from "./FacultyNavTabs";
import styles from "./layout.module.css";

export const metadata = {
  title: "Faculty & Training Academy Portal - TechNext",
  description: "Manage courses, batches, student rosters, daily attendance, assignments, and class logs.",
};

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const allowed = ["FACULTY", "SUPER_ADMIN", "ADMIN", "HEAD"];

  if (!session || !allowed.includes(session.role as string)) {
    redirect("/");
  }

  const roleTitle = session.role === "FACULTY" 
    ? "Faculty Member" 
    : session.role === "SUPER_ADMIN" 
    ? "Super Administrator" 
    : "Administrator";

  return (
    <div className={styles.container}>
      {/* Faculty Portal Banner */}
      <header className={styles.portalBanner}>
        <div className={styles.bannerBrand}>
          <img 
            src="https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png" 
            alt="TechNext Technologies" 
            className={styles.bannerLogo}
          />
          <div>
            <h1 className={styles.bannerTitle}>
              <GraduationCap size={24} color="#60A5FA" />
              Faculty & Training Academy Portal
            </h1>
            <p className={styles.bannerSubtitle}>
              Welcome, {session.name}. Manage student batches, daily attendance, assignments, and syllabus progress.
            </p>
          </div>
        </div>

        <div className={styles.userBadge}>
          <Shield size={14} color="#34D399" />
          <span>{roleTitle}</span>
        </div>
      </header>

      {/* Tabs */}
      <FacultyNavTabs />

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}
