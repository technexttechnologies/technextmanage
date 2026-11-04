import React from "react";
import ErpNavHeader from "@/components/erp/ErpNavHeader";

export const metadata = {
  title: "TechNext Enterprise ERP",
  description: "Centralized Enterprise Operations, Finance, Assets, Vendors and POS Integration",
};

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", width: "100%" }}>
      <ErpNavHeader />
      <div style={{ flex: 1, width: "100%" }}>
        {children}
      </div>
    </div>
  );
}
