import { NextResponse } from "next/server";
import { draftEmailWithAI } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { prompt, tone } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const html = await draftEmailWithAI(prompt, tone);
    return NextResponse.json({ html });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
