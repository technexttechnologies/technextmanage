import { NextResponse } from "next/server";
import { syncCustomersFromAronium } from "@/lib/aroniumSync";

export async function GET(request: Request) {
  // A simple GET endpoint that can be pinged by a cron job or external scheduler
  try {
    const result = await syncCustomersFromAronium();
    return NextResponse.json({ success: true, message: "Sync complete", data: result });
  } catch (error: any) {
    console.error("Auto-sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
