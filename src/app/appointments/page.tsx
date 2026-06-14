export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Calendar as CalendarIcon, Clock, Video, User } from "lucide-react";
import { AppointmentActionButtons } from "./AppointmentActionButtons";

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    include: { customer: true },
    orderBy: { date: 'asc' }
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Appointments</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage customer meetings and calendar.</p>
        </div>
        <Link href="/appointments/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} />
          <span>New Appointment</span>
        </Link>
      </header>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <CalendarIcon size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No appointments yet</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Schedule a meeting to get started.</p>
          <Link href="/appointments/new" className="btn-primary">
            New Appointment
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {appointments.map(apt => (
            <div key={apt.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{apt.meetingPurpose}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px' }}>
                    <User size={14} />
                    {apt.customer?.name || 'No Customer Attached'}
                  </div>
                </div>
                <span style={{ 
                  fontSize: '12px', padding: '4px 8px', borderRadius: '99px', fontWeight: '500',
                  backgroundColor: apt.status === 'SCHEDULED' ? '#dbeafe' : apt.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2',
                  color: apt.status === 'SCHEDULED' ? '#1e40af' : apt.status === 'COMPLETED' ? '#166534' : '#991b1b'
                }}>
                  {apt.status}
                </span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={16} /> {new Date(apt.date).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> {apt.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={16} /> {apt.meetingType} {apt.meetLink && <a href={apt.meetLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', marginLeft: '4px' }}>Link</a>}
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '16px' }}>
                  <AppointmentActionButtons appointmentId={apt.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
