export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { syncEnquiriesFromSheet } from "@/lib/sheetSync";

export async function GET(req: Request) {
  // Verify Vercel Cron Secret for security
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncEnquiriesFromSheet();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Enquiry sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
