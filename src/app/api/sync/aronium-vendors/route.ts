import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: 'Payload must be an array' }, { status: 400 });
    }

    let syncedCount = 0;

    for (const vendor of payload) {
      if (!vendor.aroniumId || !vendor.companyName) continue;

      const vendorId = String(vendor.aroniumId);

      const existingVendor = await prisma.erpVendor.findFirst({
        where: {
          aroniumId: vendorId
        }
      });

      if (existingVendor) {
        await prisma.erpVendor.update({
          where: { id: existingVendor.id },
          data: {
            companyName: vendor.companyName,
            contactPerson: vendor.contactPerson || null,
            email: vendor.email || null,
            phone: vendor.phone || null,
            address: vendor.address || null,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.erpVendor.create({
          data: {
            aroniumId: vendorId,
            companyName: vendor.companyName,
            contactPerson: vendor.contactPerson || null,
            email: vendor.email || null,
            phone: vendor.phone || null,
            address: vendor.address || null,
          }
        });
      }
      
      syncedCount++;
    }

    return NextResponse.json({ success: true, message: `Successfully synced ${syncedCount} vendors.` });
  } catch (error: any) {
    console.error('Error syncing aronium vendors:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
