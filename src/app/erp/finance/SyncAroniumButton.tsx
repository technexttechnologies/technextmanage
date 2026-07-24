"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { triggerLocalSync } from "../integrations/aronium/actions";

export default function SyncAroniumButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerLocalSync();
      alert("Aronium Sync completed! Page will now update.");
    } catch (e: any) {
      alert("Sync failed: " + e.message);
    }
    setIsSyncing(false);
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        color: "var(--primary)",
        border: "1px solid var(--primary)",
        padding: "8px 16px",
        borderRadius: "8px",
        fontWeight: 600,
        cursor: isSyncing ? "not-allowed" : "pointer",
        opacity: isSyncing ? 0.7 : 1,
        transition: "all 0.2s"
      }}
    >
      <RefreshCw size={16} className={isSyncing ? "spin-animation" : ""} />
      {isSyncing ? "Syncing..." : "Sync Aronium"}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
