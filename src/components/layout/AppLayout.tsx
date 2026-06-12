import { getSession } from "@/lib/auth";
import AppLayoutClient from "./AppLayoutClient";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <AppLayoutClient session={session}>
      {children}
    </AppLayoutClient>
  );
}
