"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, generateTechnextEmailHtml } from "@/lib/mailer";
import { templates } from "@/lib/email-templates";
import { uploadPublicFile, formatPdfUrl } from "@/lib/cloudinaryStorage";

export async function createQuotation(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const quotationNumber = formData.get("quotationNumber") as string;
  const dateStr = formData.get("date") as string;
  const subtotalStr = formData.get("subtotal") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  const file = formData.get("pdfFile") as File | null;

  const companyName = formData.get("companyName") as string || null;
  const companyAddress = formData.get("companyAddress") as string || null;
  const companyGst = formData.get("companyGst") as string || null;
  const expiryDateStr = formData.get("expiryDate") as string || null;
  const metaStr = formData.get("meta") as string || null;
  
  const itemsStr = formData.get("items") as string || "[]";
  const termsStr = formData.get("terms") as string || "[]";
  const milestonesStr = formData.get("milestones") as string || "[]";

  if (!customerId || !quotationNumber || !dateStr || !subtotalStr) {
    throw new Error("Missing required fields");
  }

  const subtotal = parseFloat(subtotalStr);
  const gstPercentage = 0;
  const totalAmount = parseFloat(subtotal.toFixed(2));

  let pdfUrl = null;

  if (file && file.size > 0 && typeof (file as any).arrayBuffer === "function") {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await uploadPublicFile(file.name, file.type, buffer);
      pdfUrl = uploadResult.secureUrl;
    } catch (err) {
      console.error("Failed to save PDF to Cloudinary.", err);
    }
  }

  const items = JSON.parse(itemsStr);
  const terms = JSON.parse(termsStr);
  const milestones = JSON.parse(milestonesStr);

  const quotation = await prisma.quotation.create({
    data: {
      customerId,
      quotationNumber,
      date: new Date(dateStr),
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      companyName,
      companyAddress,
      companyGst,
      meta: metaStr ? JSON.parse(metaStr) : null,
      subtotal,
      gstPercentage,
      totalAmount,
      status: status || "DRAFT",
      notes,
      pdfUrl,
      items: {
        create: items.map((item: any) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      },
      terms: {
        create: terms.map((term: any) => ({
          content: term.content,
          order: term.order
        }))
      },
      milestones: {
        create: milestones.map((ms: any) => ({
          name: ms.name,
          duration: ms.duration,
          order: ms.order
        }))
      }
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
      { text: "View Dynamic Quotation", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/quotation/${quotation.id}` }
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
        { text: "View Dynamic Quotation", url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://technextmanage.vercel.app'}/quotation/${quotation.id}` }
      );
      await sendEmail(quotation.customer.email, `Quotation ${quotation.quotationNumber} from Technext`, html);
    }
  }

  revalidatePath("/quotations");
}
