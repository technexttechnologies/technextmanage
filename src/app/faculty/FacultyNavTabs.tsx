"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Users, CalendarCheck, FileCheck, Clock, BookOpen } from "lucide-react";
import styles from "./layout.module.css";

export default function FacultyNavTabs() {
  const pathname = usePathname() || "";

  const tabs = [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/faculty/batches", label: "Batches & Classes", icon: GraduationCap, exact: false },
    { href: "/faculty/students", label: "Students", icon: Users, exact: false },
    { href: "/faculty/attendance", label: "Attendance", icon: CalendarCheck, exact: false },
    { href: "/faculty/assignments", label: "Assignments & Grading", icon: FileCheck, exact: false },
    { href: "/faculty/sessions", label: "Class Logs", icon: Clock, exact: false },
    { href: "/faculty/materials", label: "Study Materials", icon: BookOpen, exact: false },
  ];

  return (
    <nav className={styles.tabNav} aria-label="Faculty Portal Navigation">
      {tabs.map((tab) => {
        const isActive = tab.exact 
          ? pathname === tab.href 
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tabLink} ${isActive ? styles.active : ""}`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
