import { NextRequest, NextResponse } from "next/server";
import { parseQuotationPdf } from "@/lib/aiQuotationParser";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "application/pdf";

    const parsedData = await parseQuotationPdf(base64Data, mimeType);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Parse Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
