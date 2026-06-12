import BottomNav from "../mobile/BottomNav";
import QuickActionFAB from "../mobile/QuickActionFAB";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <main>{children}</main>; // No layout for login page
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
