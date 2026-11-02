export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../page.module.css";
import ProductForm from "@/components/inventory/ProductForm";

export const metadata = {
  title: "Add Inventory Item or Service | TechNext ERP",
  description: "Create a new inventory product, hardware unit, or billable service.",
};

export default function NewProductPage() {
  return (
    <div className={styles.container} style={{ maxWidth: "900px" }}>
      <header className={styles.header}>
        <div>
          <Link 
            href="/inventory" 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "6px 12px" }}
          >
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          <h1 className={styles.title}>Add New Inventory Item or Service</h1>
          <p className={styles.subtitle}>
            Register physical hardware/goods or billable digital services into your central catalog.
          </p>
        </div>
      </header>

      <div className={styles.card} style={{ padding: "28px" }}>
        <ProductForm isEdit={false} />
      </div>
    </div>
  );
}
