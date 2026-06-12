import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../new/page.module.css";
import TemplateForm from "../TemplateForm";

interface EditTemplatePageProps {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const template = await prisma.messageTemplate.findUnique({
    where: { id: params.id }
  });

  if (!template) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/marketing/templates" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Templates</span>
        </Link>
        <h1 className={styles.title}>Edit Template</h1>
      </header>

      <TemplateForm template={template} />
    </div>
  );
}
