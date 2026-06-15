import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseQuotationPdf } from "@/lib/aiQuotationParser";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find quotations that have a pdfUrl but no QuotationItems
    const quotationsToMigrate = await prisma.quotation.findMany({
      where: {
        pdfUrl: { not: null },
        items: { none: {} }
      },
      take: 10 // Process in small batches to avoid timeouts
    });

    if (quotationsToMigrate.length === 0) {
      return NextResponse.json({ message: "No quotations require migration at this time." });
    }

    const results = [];

    for (const quote of quotationsToMigrate) {
      try {
        if (!quote.pdfUrl) continue;

        // Fetch the PDF buffer from Cloudinary (or wherever pdfUrl points to)
        // Since pdfUrl could be a relative path (/uploads/...) or absolute Cloudinary URL, handle both.
        let fetchUrl = quote.pdfUrl;
        if (fetchUrl.startsWith('/')) {
          fetchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}${fetchUrl}`;
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`Failed to fetch PDF from ${fetchUrl}`);
        
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        // Parse with Gemini
        const parsedData = await parseQuotationPdf(base64Data, "application/pdf");

        // Update database with structured data
        await prisma.quotation.update({
          where: { id: quote.id },
          data: {
            companyName: parsedData.companyName,
            companyAddress: parsedData.companyAddress,
            companyGst: parsedData.companyGst,
            expiryDate: parsedData.expiryDate ? new Date(parsedData.expiryDate) : null,
            meta: parsedData.meta as any,
            // Only update subtotal/total if they are 0 or empty, else trust the existing DB records
            ...(quote.subtotal === 0 && {
              subtotal: parsedData.subtotal,
              totalAmount: parsedData.totalAmount,
            }),
            items: {
              create: parsedData.items?.map((item) => ({
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total
              })) || []
            },
            terms: {
              create: parsedData.terms?.map((term) => ({
                content: term.content,
                order: term.order
              })) || []
            },
            milestones: {
              create: parsedData.milestones?.map((ms) => ({
                name: ms.name,
                duration: ms.duration,
                order: ms.order
              })) || []
            }
          }
        });

        results.push({ id: quote.id, status: "SUCCESS" });
      } catch (err: any) {
        console.error(`Migration failed for Quotation ${quote.id}:`, err);
        results.push({ id: quote.id, status: "FAILED", error: err.message });
      }
    }

    return NextResponse.json({ 
      message: `Processed ${quotationsToMigrate.length} quotations.`, 
      results 
    });
  } catch (error: any) {
    console.error("Migration Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
