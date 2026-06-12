"use client";

import { usePathname } from "next/navigation";
import BottomNav from "../mobile/BottomNav";
import QuickActionFAB from "../mobile/QuickActionFAB";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";

export default function AppLayoutClient({ 
  children, 
  session 
}: { 
  children: React.ReactNode, 
  session: any 
}) {
  const pathname = usePathname() || "";

  // If no session OR if it's a public page, do not show the app layout
  if (!session || pathname.startsWith("/track") || pathname.startsWith("/support")) {
    return <main>{children}</main>;
  }

  return (
    <div className={styles.layout}>
      <Sidebar user={session} />
      <main className={styles.mainContent}>
        {children}
      </main>
      <BottomNav />
      <QuickActionFAB />
    </div>
  );
}
