import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: 'Payload must be an array' }, { status: 400 });
    }

    // Assign a hardcoded admin user ID to recordedById or fetch the first SUPER_ADMIN.
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'No admin user found' }, { status: 500 });
    }

    let syncedCount = 0;

    for (const item of payload) {
      if (item.amount === undefined || item.amount === null || !item.date) continue;
      
      const amount = Number(item.amount);
      if (isNaN(amount)) continue;

      const dateObj = new Date(item.date);
      // Validate date
      if (isNaN(dateObj.getTime())) continue;

      // Start and end of the provided date in local time for lookup
      const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

      const existingRecord = await prisma.erpIncome.findFirst({
        where: {
          category: 'Aronium Sales',
          date: {
            gte: startOfDay,
            lte: endOfDay,
          }
        }
      });

      if (existingRecord) {
        await prisma.erpIncome.update({
          where: { id: existingRecord.id },
          data: {
            amount,
            paymentMethod: item.paymentMethod || 'Cash/Card',
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.erpIncome.create({
          data: {
            amount,
            date: dateObj,
            category: 'Aronium Sales',
            paymentMethod: item.paymentMethod || 'Cash/Card',
            recordedById: admin.id
          }
        });
      }
      
      syncedCount++;
    }

    return NextResponse.json({ success: true, message: `Successfully synced ${syncedCount} sales records.` });
  } catch (error: any) {
    console.error('Error syncing aronium reports:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
