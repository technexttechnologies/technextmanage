export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmations } = await req.json();

    if (!Array.isArray(confirmations)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let updated = 0;

    for (const conf of confirmations) {
      if (conf.crmId && conf.aroniumId) {
        await prisma.customer.update({
          where: { id: conf.crmId },
          data: {
            aroniumId: conf.aroniumId.toString(),
            syncStatus: "SYNCED",
            lastSyncDate: new Date()
          }
        });
        updated++;
      }
    }

    await prisma.syncLog.create({
      data: {
        type: "CUSTOMER_AUTO",
        status: "SUCCESS",
        recordsAdded: 0,
        details: `Confirmed ${updated} customers synced from Cloud to Local POS.`
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Confirm Aronium Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
