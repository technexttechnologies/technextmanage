import { prisma } from "@/lib/prisma";
import { updateAppointment } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!appointment) return notFound();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Appointments
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Edit Appointment</h1>
        <p style={{ color: 'var(--text-muted)' }}>Updating will automatically email the client with the new meeting details.</p>
      </header>

      <form action={updateAppointment} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input type="hidden" name="id" value={appointment.id} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Customer (View Only)</label>
            <input type="text" disabled value={appointment.customer?.name || "No Customer Linked"} className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Purpose *</label>
            <input type="text" name="meetingPurpose" defaultValue={appointment.meetingPurpose} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date *</label>
            <input type="date" name="date" defaultValue={appointment.date.toISOString().split('T')[0]} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Time *</label>
            <input type="time" name="time" defaultValue={appointment.time} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Type *</label>
            <select name="meetingType" defaultValue={appointment.meetingType} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="ONLINE">Online (Meet/Zoom)</option>
              <option value="OFFLINE">Offline (In Person)</option>
              <option value="PHONE">Phone Call</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Link</label>
            <input type="url" name="meetLink" defaultValue={appointment.meetLink || ""} className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Status</label>
            <select name="status" defaultValue={appointment.status} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Notes</label>
          <textarea name="notes" rows={3} defaultValue={appointment.notes || ""} className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '16px', width: '100%' }}>Update Appointment & Send Email</button>
        </div>
      </form>
    </div>
  );
}
