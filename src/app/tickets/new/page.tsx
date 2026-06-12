import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createInternalTicket } from "../actions";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewTicketPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  async function handleSubmit(formData: FormData) {
    "use server";
    await createInternalTicket(formData);
    redirect("/tickets");
  }

  return (
    <div style={{padding: '24px', maxWidth: '800px', margin: '0 auto'}}>
      <Link href="/tickets" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', textDecoration: 'none', color: 'var(--text-muted)'}}>
        <ArrowLeft size={16} /> Back to Tickets
      </Link>

      <div style={{background: 'var(--surface-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)'}}>
        <h1 style={{marginBottom: '24px', fontSize: '24px'}}>Raise Ticket (Internal)</h1>
        
        <form action={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 600, fontSize: '14px'}}>Customer</label>
            <select name="customerId" required style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-background)'}}>
              <option value="">Select Customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 600, fontSize: '14px'}}>Subject</label>
            <input type="text" name="subject" required placeholder="Issue summary" style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)'}} />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 600, fontSize: '14px'}}>Priority</label>
            <select name="priority" required style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-background)'}}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 600, fontSize: '14px'}}>Description</label>
            <textarea name="description" required rows={5} placeholder="Detailed issue description..." style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)'}} />
          </div>

          <SubmitButton icon={<Send size={18} />} style={{marginTop: '16px', alignSelf: 'flex-start'}}>Create Ticket</SubmitButton>
        </form>
      </div>
    </div>
  );
}
