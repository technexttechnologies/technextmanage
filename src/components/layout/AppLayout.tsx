import BottomNav from "../mobile/BottomNav";
import QuickActionFAB from "../mobile/QuickActionFAB";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
      <BottomNav />
      <QuickActionFAB />
    </div>
  );
}
