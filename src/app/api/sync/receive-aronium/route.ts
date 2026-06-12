import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const settings = await prisma.systemSettings.findFirst();
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customers } = await req.json();

    if (!Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid payload, expected array of customers' }, { status: 400 });
    }

    const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!adminUser) throw new Error("No admin user found to assign customers to.");

    let recordsAdded = 0;
    let recordsUpdated = 0;

    for (const row of customers) {
      const aroniumId = row.Id.toString();
      const name = row.Name;
      if (!name) continue;

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { aroniumId: aroniumId },
            { name: name }
          ]
        }
      });

      if (existingCustomer) {
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            aroniumId: aroniumId,
            syncStatus: "SYNCED",
            lastSyncDate: new Date()
          }
        });
        recordsUpdated++;
      } else {
        await prisma.customer.create({
          data: {
            name: name,
            phone: row.PhoneNumber || "0000000000",
            email: row.Email || null,
            aroniumId: aroniumId,
            syncStatus: "SYNCED",
            lastSyncDate: new Date(),
            assignedToId: adminUser.id,
            status: "ACTIVE"
          }
        });
        recordsAdded++;
      }
    }

    await prisma.syncLog.create({
      data: {
        type: "CUSTOMER_AUTO",
        status: "SUCCESS",
        recordsAdded,
        details: `Cloud received from local Push Agent. Added: ${recordsAdded}, Updated: ${recordsUpdated}.`
      }
    });

    return NextResponse.json({ success: true, added: recordsAdded, updated: recordsUpdated });
  } catch (error: any) {
    console.error("Receive Aronium Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
