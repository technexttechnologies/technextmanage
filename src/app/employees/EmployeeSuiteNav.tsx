"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Clock, CalendarCheck, Building2, UserCheck } from "lucide-react";

export default function EmployeeSuiteNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/employees",
      label: "Staff Directory",
      icon: Users,
      isActive: pathname === "/employees",
    },
    {
      href: "/employees/attendance",
      label: "Attendance & Shifts",
      icon: Clock,
      isActive: pathname.startsWith("/employees/attendance"),
    },
    {
      href: "/employees/leaves",
      label: "Leave Approvals",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/employees/leaves"),
    },
    {
      href: "/settings/departments",
      label: "Departments",
      icon: Building2,
      isActive: pathname.startsWith("/settings/departments"),
    },
    {
      href: "/employees/portal",
      label: "My Work Portal",
      icon: UserCheck,
      isActive: pathname.startsWith("/employees/portal"),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        marginBottom: "20px",
        overflowX: "auto",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: tab.isActive ? 700 : 500,
              color: tab.isActive ? "#ffffff" : "#475569",
              backgroundColor: tab.isActive ? "#6366f1" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={15} color={tab.isActive ? "#ffffff" : "#64748b"} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
