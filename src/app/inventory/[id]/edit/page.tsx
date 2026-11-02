export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../page.module.css";
import ProductForm from "@/components/inventory/ProductForm";

export default async function EditProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const product = await prisma.erpProduct.findUnique({
    where: { id },
  });

  if (!product) return notFound();

  return (
    <div className={styles.container} style={{ maxWidth: "900px" }}>
      <header className={styles.header}>
        <div>
          <Link 
            href={`/inventory/${product.id}`} 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "6px 12px" }}
          >
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <h1 className={styles.title}>Edit Product: {product.name}</h1>
          <p className={styles.subtitle}>
            Modify product or service catalog details, pricing, tax rate, and thresholds.
          </p>
        </div>
      </header>

      <div className={styles.card} style={{ padding: "28px" }}>
        <ProductForm initialData={product} isEdit={true} />
      </div>
    </div>
  );
}
