"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";

export async function createQuotation(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const quotationNumber = formData.get("quotationNumber") as string;
  const dateStr = formData.get("date") as string;
  const subtotalStr = formData.get("subtotal") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  const file = formData.get("pdfFile") as File | null;

  if (!customerId || !quotationNumber || !dateStr || !subtotalStr) {
    throw new Error("Missing required fields");
  }

  const subtotal = parseFloat(subtotalStr);
  const gstPercentage = 18;
  const totalAmount = parseFloat((subtotal * (1 + gstPercentage / 100)).toFixed(2));

  let pdfUrl = null;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // In a real app, you'd sanitize the filename. For MVP:
    const uniqueSuffix = randomUUID();
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
    const publicUploadDir = join(process.cwd(), "public", "uploads");
    
    // Attempt to write the file
    try {
      await writeFile(join(publicUploadDir, filename), buffer);
      pdfUrl = `/uploads/${filename}`;
    } catch (err) {
      console.error("Failed to save file locally. Ensure public/uploads exists.", err);
    }
  }

  const quotation = await prisma.quotation.create({
    data: {
      customerId,
      quotationNumber,
      date: new Date(dateStr),
      subtotal,
      gstPercentage,
      totalAmount,
      status: status || "DRAFT",
      notes,
      pdfUrl
    },
    include: { customer: true }
  });

  if ((status === "SENT" || status === "APPROVED") && quotation.customer?.email) {
    const html = generateTechnextEmailHtml(
      "Your Official Quotation",
      templates.quotationEmail({
        customerName: quotation.customer.name,
        quotationNumber: quotation.quotationNumber,
        totalAmount: quotation.totalAmount,
      }),
      { text: "View Quotation Details", url: pdfUrl ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}${pdfUrl}` : `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${quotation.customer.portalToken}` }
    );
    await sendEmail(quotation.customer.email, `Quotation ${quotation.quotationNumber} from Technext`, html);
  }

  redirect("/quotations");
}

export async function updateQuotationStatus(formData: FormData) {
  const quotationId = formData.get("quotationId") as string;
  const status = formData.get("status") as string;

  if (quotationId && status) {
    const quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status },
      include: { customer: true }
    });

    if (status === "SENT" && quotation.customer?.email) {
      const html = generateTechnextEmailHtml(
        "Your Official Quotation",
        templates.quotationEmail({
          customerName: quotation.customer.name,
          quotationNumber: quotation.quotationNumber,
          totalAmount: quotation.totalAmount,
        }),
        { text: "View Client Portal", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/portal/${quotation.customer.portalToken}` }
      );
      await sendEmail(quotation.customer.email, `Quotation ${quotation.quotationNumber} from Technext`, html);
    }
  }

  revalidatePath("/quotations");
}
