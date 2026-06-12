"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseCSV(text: string) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Basic CSV split that ignores commas inside quotes
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] || "";
    });
    data.push(obj);
  }
  return data;
}

export async function importAroniumData(formData: FormData) {
  const type = formData.get("type") as string;
  const file = formData.get("csvFile") as File;

  if (!file || !type) {
    throw new Error("Missing file or import type");
  }

  const text = await file.text();
  const rows = parseCSV(text);
  
  let recordsAdded = 0;

  try {
    if (type === "CUSTOMERS") {
      // Expecting columns: Name, Phone, Email, AroniumCode
      const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
      if (!adminUser) throw new Error("No admin user found for assignment");

      for (const row of rows) {
        if (!row.Name) continue;
        
        // Find existing customer by name or email
        const existingByName = await prisma.customer.findFirst({ where: { name: row.Name } });
        const existingByEmail = row.Email ? await prisma.customer.findFirst({ where: { email: row.Email } }) : null;
        const existing = existingByEmail || existingByName;

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              aroniumCode: row.AroniumCode || existing.aroniumCode,
              syncStatus: "SYNCED",
              lastSyncDate: new Date()
            }
          });
        } else {
          await prisma.customer.create({
            data: {
              name: row.Name,
              phone: row.Phone || "0000000000",
              email: row.Email || null,
              aroniumCode: row.AroniumCode || null,
              syncStatus: "SYNCED",
              lastSyncDate: new Date(),
              assignedToId: adminUser.id,
              status: "ACTIVE"
            }
          });
          recordsAdded++;
        }
      }
    } else if (type === "QUOTATIONS") {
      // Expecting: QuotationNumber, CustomerName, Date, TotalAmount
      for (const row of rows) {
        if (!row.QuotationNumber || !row.CustomerName) continue;
        
        const customer = await prisma.customer.findFirst({ where: { name: row.CustomerName } });
        if (!customer) continue; // Skip if customer doesn't exist

        const existingQuote = await prisma.quotation.findUnique({ where: { quotationNumber: row.QuotationNumber }});
        if (!existingQuote) {
          await prisma.quotation.create({
            data: {
              quotationNumber: row.QuotationNumber,
              customerId: customer.id,
              date: row.Date ? new Date(row.Date) : new Date(),
              totalAmount: parseFloat(row.TotalAmount || "0"),
              status: "DRAFT"
            }
          });
          recordsAdded++;
        }
      }
    }

    await prisma.syncLog.create({
      data: {
        type,
        status: "SUCCESS",
        recordsAdded,
        details: `Successfully processed ${rows.length} rows.`
      }
    });

  } catch (error: any) {
    await prisma.syncLog.create({
      data: {
        type,
        status: "FAILED",
        details: error.message
      }
    });
    throw error;
  }

  redirect("/integration");
}
