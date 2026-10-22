import { prisma } from "@/lib/prisma";

export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  return rawPhone.replace(/\D/g, "");
}

export function getPhoneSuffix(rawPhone?: string | null): string {
  const digits = normalizePhone(rawPhone);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function findExistingCustomer(params: {
  aroniumId?: string | number | null;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
}) {
  // 1. Match by Aronium ID if provided
  if (params.aroniumId !== undefined && params.aroniumId !== null && params.aroniumId !== "") {
    const aroniumIdStr = params.aroniumId.toString();
    const byAronium = await prisma.customer.findFirst({
      where: { aroniumId: aroniumIdStr }
    });
    if (byAronium) return byAronium;
  }

  // 2. Match by normalized phone (last 10 digits) using PostgreSQL regex
  const phoneSuffix = getPhoneSuffix(params.phone);
  if (phoneSuffix && phoneSuffix.length >= 8 && phoneSuffix !== "0000000000") {
    try {
      const rawMatches = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Customer"
        WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE ${'%' + phoneSuffix}
        ORDER BY "createdAt" ASC
        LIMIT 1
      `;
      if (rawMatches && rawMatches.length > 0) {
        const byPhone = await prisma.customer.findUnique({ where: { id: rawMatches[0].id } });
        if (byPhone) return byPhone;
      }
    } catch (e) {
      console.error("Regex phone match error, falling back to contains:", e);
      const byPhone = await prisma.customer.findFirst({
        where: { phone: { contains: phoneSuffix } }
      });
      if (byPhone) return byPhone;
    }
  }

  // 3. Match by email
  if (params.email && params.email.trim()) {
    const byEmail = await prisma.customer.findFirst({
      where: {
        email: { equals: params.email.trim(), mode: "insensitive" }
      }
    });
    if (byEmail) return byEmail;
  }

  // 4. Match by exact or normalized name (case-insensitive)
  if (params.name && params.name.trim()) {
    const cleanName = params.name.trim();
    const byName = await prisma.customer.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" }
      }
    });
    if (byName) return byName;
  }

  return null;
}
