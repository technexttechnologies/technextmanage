export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PortalHeader } from "../../../PortalHeader";
import { Globe, PenTool } from "lucide-react";
import { createUpdateRequest } from "./actions";

export default async function WebsiteUpdatePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      domains: true
    }
  });

  if (!customer) return notFound();

  const actionWithToken = createUpdateRequest.bind(null, token);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PortalHeader customer={customer} token={token} backLink={true} />

        <div style={{ backgroundColor: 'var(--surface-card)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <div style={{ backgroundColor: '#8B5CF6', color: 'white', padding: '12px', borderRadius: '12px' }}>
              <PenTool size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Request Website Update
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Need changes to your website? Let us know what you need and our team will get it done.
              </p>
            </div>
          </div>

          <form action={actionWithToken} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 2 }}>
                <label htmlFor="websiteUrl" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Website URL / Page <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                {customer.domains.length > 0 ? (
                  <select 
                    id="websiteUrl" 
                    name="websiteUrl" 
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', backgroundColor: 'white' }}
                  >
                    {customer.domains.map(d => (
                      <option key={d.id} value={d.domainName}>{d.domainName}</option>
                    ))}
                    <option value="Other">Other URL (specify in description)</option>
                  </select>
                ) : (
                  <input 
                    type="text" 
                    id="websiteUrl" 
                    name="websiteUrl" 
                    required 
                    placeholder="e.g. www.mywebsite.com/about"
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit' }} 
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label htmlFor="priority" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Priority</label>
                <select 
                  id="priority" 
                  name="priority" 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', backgroundColor: 'white' }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="changes" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>What needs to be updated? <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <textarea 
                id="changes" 
                name="changes" 
                required 
                rows={8}
                placeholder="List the changes you need (e.g. Change the phone number on the contact page to X, upload a new banner image...)"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }} 
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                If you have images or files for this update, please mention it here. We will reach out to collect them.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Submit Update Request
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
