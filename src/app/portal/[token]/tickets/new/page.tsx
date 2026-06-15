export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PortalHeader } from "../../PortalHeader";
import { LifeBuoy } from "lucide-react";
import { createSupportTicket } from "./actions";

export default async function NewTicketPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      projects: { where: { status: { not: "COMPLETED" } } }
    }
  });

  if (!customer) return notFound();

  // Create a wrapper for the server action that binds the token
  const actionWithToken = createSupportTicket.bind(null, token);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PortalHeader customer={customer} token={token} backLink={true} />

        <div style={{ backgroundColor: 'var(--surface-card)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <div style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '12px', borderRadius: '12px' }}>
              <LifeBuoy size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                New Support Ticket
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Submit a complaint or request assistance. We will get back to you shortly.
              </p>
            </div>
          </div>

          <form action={actionWithToken} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="subject" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Subject <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input 
                type="text" 
                id="subject" 
                name="subject" 
                required 
                placeholder="Brief summary of the issue"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label htmlFor="priority" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Priority</label>
                <select 
                  id="priority" 
                  name="priority" 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', backgroundColor: 'white' }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {customer.projects.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label htmlFor="projectId" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Related Project (Optional)</label>
                  <select 
                    id="projectId" 
                    name="projectId" 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', backgroundColor: 'white' }}
                  >
                    <option value="">None</option>
                    {customer.projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="description" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Detailed Description <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <textarea 
                id="description" 
                name="description" 
                required 
                rows={6}
                placeholder="Please provide as much detail as possible to help us resolve the issue faster."
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={{ backgroundColor: 'var(--brand-primary)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Submit Ticket
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
