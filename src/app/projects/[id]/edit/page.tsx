export const dynamic = "force-dynamic";
import { updateProject } from "../../actions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import styles from "../../new/page.module.css";
import { notFound } from "next/navigation";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!project) return notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href={`/projects/${project.id}`} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Edit Project</h1>
      </header>

      <form action={updateProject} className={styles.formCard}>
        <input type="hidden" name="projectId" value={project.id} />
        
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Project Overview</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Project Name *</label>
            <input type="text" id="name" name="name" required defaultValue={project.name} autoComplete="off" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="customerId">Associated Customer</label>
            <select id="customerId" name="customerId" defaultValue={project.customerId || ""}>
              <option value="">-- No Customer (Internal Project) --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company ? `(${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="type">Project Type</label>
            <input type="text" id="type" name="type" list="project-types" defaultValue={project.type || ""} autoComplete="off" />
            <datalist id="project-types">
              <option value="Website" />
              <option value="Mobile App" />
              <option value="SEO" />
              <option value="Billing Software" />
              <option value="Custom Software" />
              <option value="CRM" />
              <option value="Software Reselling" />
            </datalist>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="description">Project Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={project.description || ""} />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Software License Tracking (Optional)</h2>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="licenseKey">License Key</label>
              <input type="text" id="licenseKey" name="licenseKey" defaultValue={project.licenseKey || ""} placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="licenseType">License Type</label>
              <input type="text" id="licenseType" name="licenseType" defaultValue={project.licenseType || ""} list="license-types" placeholder="e.g. Lifetime, Annual" autoComplete="off" />
              <datalist id="license-types">
                <option value="Lifetime" />
                <option value="Annual" />
                <option value="Monthly" />
                <option value="Demo / Trial" />
              </datalist>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="softwareVersion">Software Version</label>
              <input type="text" id="softwareVersion" name="softwareVersion" defaultValue={project.softwareVersion || ""} placeholder="e.g. Aronium Pro v1.2" autoComplete="off" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="machineId">Device / Machine ID</label>
              <input type="text" id="machineId" name="machineId" defaultValue={project.machineId || ""} placeholder="If node-locked" autoComplete="off" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Timeline</h2>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" required defaultValue={project.startDate ? project.startDate.toISOString().split('T')[0] : ''} />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="endDate">Estimated End Date</label>
              <input type="date" id="endDate" name="endDate" defaultValue={project.endDate ? project.endDate.toISOString().split('T')[0] : ''} />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link href={`/projects/${project.id}`} className="btn-secondary">Cancel</Link>
          <SubmitButton icon={<Save size={18} />}>Save Changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}
