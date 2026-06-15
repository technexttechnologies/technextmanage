export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PortalHeader } from "../../PortalHeader";
import { CheckCircle2, Circle, FileText, Calendar, StickyNote } from "lucide-react";
import { format } from "date-fns";

export default async function ProjectPortalPage({ params }: { params: Promise<{ token: string, projectId: string }> }) {
  const { token, projectId } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token }
  });

  if (!customer) return notFound();

  const project = await prisma.project.findFirst({
    where: { 
      id: projectId,
      customerId: customer.id
    },
    include: {
      milestones: { orderBy: { dueDate: 'asc' } },
      notes: { 
        where: { isPinned: false }, // Assuming non-pinned notes are public or we can just show all notes. Wait, internal notes? Let's assume all notes are visible or we filter by some flag. Since there's no public/private flag, we'll just show them, but maybe it's better to show milestones mainly.
        orderBy: { createdAt: 'desc' }
      },
      Document: true
    }
  });

  if (!project) return notFound();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PortalHeader customer={customer} token={token} backLink={true} />

        <div style={{ backgroundColor: 'var(--surface-card)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{project.description}</p>}
            </div>
            <span style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Overall Progress</strong>
              <strong style={{ color: 'var(--brand-primary)' }}>{project.progress}%</strong>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--surface-border)', height: '12px', borderRadius: '6px' }}>
              <div style={{ width: `${project.progress}%`, backgroundColor: 'var(--brand-accent)', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            
            {/* Milestones */}
            <div>
              <h2 style={{ fontSize: '18px', borderBottom: '2px solid var(--surface-border)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--brand-primary)" /> Milestones
              </h2>
              {project.milestones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No milestones defined yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {project.milestones.map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ marginTop: '2px' }}>
                        {m.isCompleted ? <CheckCircle2 size={18} color="var(--color-success)" /> : <Circle size={18} color="var(--text-muted)" />}
                      </div>
                      <div>
                        <strong style={{ fontSize: '15px', color: m.isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.title}</strong>
                        {m.dueDate && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Due: {format(new Date(m.dueDate), 'MMM dd, yyyy')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <h2 style={{ fontSize: '18px', borderBottom: '2px solid var(--surface-border)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--brand-primary)" /> Documents
              </h2>
              {project.Document.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No documents uploaded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {project.Document.map(doc => (
                    <a key={doc.id} href={`/api/documents/download/${doc.id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}>
                      <FileText size={18} color="var(--text-secondary)" />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{doc.fileName}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
