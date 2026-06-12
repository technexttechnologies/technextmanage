"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function createQuotation(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const quotationNumber = formData.get("quotationNumber") as string;
  const dateStr = formData.get("date") as string;
  const totalAmountStr = formData.get("totalAmount") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  const file = formData.get("pdfFile") as File | null;

  if (!customerId || !quotationNumber || !dateStr || !totalAmountStr) {
    throw new Error("Missing required fields");
  }

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

  await prisma.quotation.create({
    data: {
      customerId,
      quotationNumber,
      date: new Date(dateStr),
      totalAmount: parseFloat(totalAmountStr),
      status: status || "DRAFT",
      notes,
      pdfUrl
    }
  });

  redirect("/quotations");
}

export async function updateQuotationStatus(formData: FormData) {
  const quotationId = formData.get("quotationId") as string;
  const status = formData.get("status") as string;

  if (quotationId && status) {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status }
    });
  }

  revalidatePath("/quotations");
}
