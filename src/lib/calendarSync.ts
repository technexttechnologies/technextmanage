import { google } from 'googleapis';
import { sendEmail } from './mailer';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'stub_client_id',
  process.env.GOOGLE_CLIENT_SECRET || 'stub_client_secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

// Stub function to show where Google API integration would go
export async function pushToGoogleCalendar(appointment: any) {
  console.log('Stub: pushToGoogleCalendar called with appointment ID', appointment.id);
  // Example Google API usage:
  // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  // await calendar.events.insert({ ... })
  return { success: false, error: 'OAuth not configured. Use ICS generation instead.' };
}

export function generateICS(appointment: {
  id: string;
  date: Date;
  time: string;
  meetingPurpose: string;
  notes?: string | null;
  meetLink?: string | null;
  meetingType: string;
}): string {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Parse date and time to create start and end Date objects
  const [hours, minutes] = appointment.time.split(':').map(Number);
  
  const startDate = new Date(appointment.date);
  startDate.setHours(hours, minutes, 0, 0);
  
  // Assume 1 hour meeting duration
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 1);
  
  const dtStart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtEnd = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const uid = appointment.id + "@technext.crm";
  
  const summary = `${appointment.meetingPurpose} - technext`;
  const description = `${appointment.notes || ''}\\n\\nMeeting Type: ${appointment.meetingType}${appointment.meetLink ? `\\nMeeting Link: ${appointment.meetLink}` : ''}`.trim().replace(/\n/g, '\\n');
  const location = appointment.meetingType === 'ONLINE' ? (appointment.meetLink || 'Online') : (appointment.meetingType === 'OFFLINE' ? 'technext Office' : 'Phone');

  const icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//technext CRM//Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsString;
}

export async function sendCalendarInvite(appointment: any, customerEmail: string) {
  const icsContent = generateICS(appointment);
  
  const htmlBody = `
    <h2>Meeting Scheduled</h2>
    <p>Hi,</p>
    <p>Your meeting regarding <strong>${appointment.meetingPurpose}</strong> has been scheduled.</p>
    <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
    <p><strong>Time:</strong> ${appointment.time}</p>
    <p><strong>Type:</strong> ${appointment.meetingType}</p>
    ${appointment.meetLink ? `<p><strong>Link:</strong> <a href="${appointment.meetLink}">${appointment.meetLink}</a></p>` : ''}
    <p>Please find the calendar invite attached.</p>
  `;

  return sendEmail(
    customerEmail,
    `Meeting Invite: ${appointment.meetingPurpose}`,
    htmlBody,
    [
      {
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }
    ]
  );
}
