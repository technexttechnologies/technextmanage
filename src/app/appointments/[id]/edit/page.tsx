import { prisma } from "@/lib/prisma";
import { updateAppointment } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import styles from "../../page.module.css";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!appointment) return notFound();

  return (
    <div className={styles.container} style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link href="/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Appointments
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Edit Appointment</h1>
        <p style={{ color: 'var(--text-muted)' }}>Updating will automatically email the client with the new meeting details.</p>
      </header>

      <form action={updateAppointment} className={styles.formCard}>
        <input type="hidden" name="id" value={appointment.id} />
        
        <div className={styles.formGrid2}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Customer (View Only)</label>
            <input type="text" disabled value={appointment.customer?.name || "No Customer Linked"} className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Meeting Purpose *</label>
            <input type="text" name="meetingPurpose" defaultValue={appointment.meetingPurpose} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div className={styles.formGrid2}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date *</label>
            <input type="date" name="date" defaultValue={appointment.date.toISOString().split('T')[0]} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Time *</label>
            <input type="time" name="time" defaultValue={appointment.time} required className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div className={styles.formGrid3}>
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
