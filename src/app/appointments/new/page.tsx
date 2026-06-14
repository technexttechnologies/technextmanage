import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendCalendarInvite } from "@/lib/calendarSync";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function createAppointment(formData: FormData) {
  "use server";
  
  const customerId = formData.get("customerId") as string;
  const meetingPurpose = formData.get("meetingPurpose") as string;
  const dateStr = formData.get("date") as string;
  const time = formData.get("time") as string;
  const meetingType = formData.get("meetingType") as string;
  const meetLink = formData.get("meetLink") as string;
  const notes = formData.get("notes") as string;

  const date = new Date(dateStr);

  const appointment = await prisma.appointment.create({
    data: {
      customerId: customerId || null,
      meetingPurpose,
      date,
      time,
      meetingType,
      meetLink: meetLink || null,
      notes: notes || null,
      status: "SCHEDULED"
    },
    include: {
      customer: true
    }
  });

  // If there's a customer and they have an email, send the invite
  if (appointment.customer?.email) {
    try {
      await sendCalendarInvite(appointment, appointment.customer.email);
    } catch (error) {
      console.error("Failed to send calendar invite", error);
    }
  }

  revalidatePath("/appointments");
  redirect("/appointments");
}

export default async function NewAppointmentPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Appointments
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Schedule Appointment</h1>
      </header>

      <form action={createAppointment} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Customer</label>
            <select name="customerId" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Select Customer (Optional)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Purpose *</label>
            <input type="text" name="meetingPurpose" required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date *</label>
            <input type="date" name="date" required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Time *</label>
            <input type="time" name="time" required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Type *</label>
            <select name="meetingType" required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="ONLINE">Online (Meet/Zoom)</option>
              <option value="OFFLINE">Offline (In Person)</option>
              <option value="PHONE">Phone Call</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Link (Optional)</label>
            <input type="url" name="meetLink" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="https://meet.google.com/..." />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Notes (Optional)</label>
          <textarea name="notes" rows={4} className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Agenda or special instructions..."></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Link href="/appointments" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#475569' }}>
            Cancel
          </Link>
          <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
            Schedule Meeting
          </button>
        </div>
      </form>
    </div>
  );
}
