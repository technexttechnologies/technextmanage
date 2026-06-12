export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all customers created in CRM that don't have an aroniumId yet
    // Skip customers without a name
    const pendingCustomers = await prisma.customer.findMany({
      where: {
        aroniumId: null,
        name: { not: "" },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      }
    });

    return NextResponse.json({ success: true, customers: pendingCustomers });
  } catch (error: any) {
    console.error("Send to Aronium Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
