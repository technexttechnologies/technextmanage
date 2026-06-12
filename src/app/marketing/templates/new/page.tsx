import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../new/page.module.css";
import TemplateForm from "../TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/marketing/templates" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Templates</span>
        </Link>
        <h1 className={styles.title}>Create Template</h1>
      </header>

      <TemplateForm />
    </div>
  );
}
