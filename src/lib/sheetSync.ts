import { prisma } from './prisma';

const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyUraZm4D3u3D-UK8PkpqfgyVu2yHoE0dmKb6saKLYuETVO44TcmK0WQPfu0dt_DeUe/exec';

export async function syncEnquiriesFromSheet() {
  const settings = await prisma.systemSettings.findFirst();
  const sheetUrl = settings?.enquirySheetUrl || DEFAULT_SHEET_URL;

  const response = await fetch(sheetUrl);
  if (!response.ok) throw new Error('Failed to fetch Google Sheet data');

  const text = await response.text();
  let rawData: any;
  try {
    rawData = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from Google Sheet');
  }

  let bookings: any[] = [];
  if (Array.isArray(rawData)) bookings = rawData;
  else if (rawData?.bookings) bookings = rawData.bookings;
  else if (rawData?.data) bookings = rawData.data;

  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!adminUser) throw new Error('No admin user found');

  let added = 0;

  for (let i = 0; i < bookings.length; i++) {
    const row = bookings[i];
    let id = '', name = '', phone = '', service = '';

    if (Array.isArray(row)) {
      // Skip header row
      const isHeader = row.some((item: any) => typeof item === 'string' && ['id', 'customer', 'name', 'phone'].includes(String(item).toLowerCase()));
      if (isHeader) continue;
      id = row[0] || '';
      name = row[1] || '';
      phone = row[2] || '';
      service = row[4] || '';
    } else {
      id = row.id || row.ID || row.customerId || '';
      name = row.name || row.Name || row.fullName || '';
      phone = row.phone || row.Phone || '';
      service = row.service || row.Service || '';
    }

    if (!name || !id) continue;

    // Check if this enquiry ID already exists as a lead
    const existingLead = await prisma.lead.findFirst({
      where: { source: `WEBSITE-${id}` }
    });

    if (!existingLead) {
      await prisma.lead.create({
        data: {
          name: name,
          phone: phone && phone !== '#ERROR!' ? phone : undefined,
          source: `WEBSITE-${id}`,
          status: 'NEW',
          notes: `Service: ${service || 'General'}. Auto-imported from website enquiry form.`,
          assignedToId: adminUser.id
        }
      });
      added++;
    }
  }

  await prisma.syncLog.create({
    data: {
      type: 'ENQUIRY_SYNC',
      status: 'SUCCESS',
      recordsAdded: added,
      details: `Synced ${bookings.length} rows from Google Sheet. Added ${added} new leads.`
    }
  });

  return { added, total: bookings.length };
}
