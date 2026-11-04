export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const EXPECTED_SECRET = process.env.SYNC_SECRET || "technext-sync-2026";

    if (authHeader !== `Bearer ${EXPECTED_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      confirmations, // backward compatibility
      customerConfirmations = [],
      supplierConfirmations = [],
      productConfirmations = [],
      documentConfirmations = []
    } = body;

    const allCustomerConfs = [...(confirmations || []), ...(customerConfirmations || [])];

    let custUpdated = 0;
    for (const conf of allCustomerConfs) {
      if (conf.crmId && conf.aroniumId) {
        try {
          await prisma.customer.update({
            where: { id: conf.crmId },
            data: {
              aroniumId: conf.aroniumId.toString(),
              syncStatus: "SYNCED",
              lastSyncDate: new Date()
            }
          });
          custUpdated++;
        } catch (e) {
          // ignore individual update error
        }
      }
    }

    let suppUpdated = 0;
    for (const conf of supplierConfirmations) {
      if (conf.crmId && conf.aroniumId) {
        try {
          await prisma.erpVendor.update({
            where: { id: conf.crmId },
            data: {
              aroniumId: conf.aroniumId.toString()
            }
          });
          suppUpdated++;
        } catch (e) {
          // ignore
        }
      }
    }

    let prodUpdated = 0;
    for (const conf of productConfirmations) {
      if (conf.crmId && conf.aroniumId) {
        try {
          await prisma.erpProduct.update({
            where: { id: conf.crmId },
            data: {
              aroniumId: conf.aroniumId.toString()
            }
          });
          prodUpdated++;
        } catch (e) {
          // ignore
        }
      }
    }

    let docUpdated = 0;
    for (const conf of documentConfirmations) {
      if (conf.crmId && conf.aroniumNumber) {
        try {
          const inv = await prisma.invoiceRequest.findUnique({ where: { id: conf.crmId } });
          const prevStructured = (inv?.structuredData as any) || {};
          await prisma.invoiceRequest.update({
            where: { id: conf.crmId },
            data: {
              aroniumInvoiceNo: conf.aroniumNumber,
              structuredData: {
                ...prevStructured,
                needsAroniumSync: false
              }
            }
          });
          docUpdated++;
        } catch (e) {
          // ignore
        }
      }
    }

    const totalSynced = custUpdated + suppUpdated + prodUpdated + docUpdated;

    if (totalSynced > 0) {
      try {
        await prisma.syncLog.create({
          data: {
            type: "TWO_WAY_AUTO_SYNC",
            status: "SUCCESS",
            recordsAdded: totalSynced,
            details: `Confirmed two-way sync: ${custUpdated} customers, ${suppUpdated} vendors, ${prodUpdated} products, ${docUpdated} documents.`
          }
        });
      } catch (logErr) {
        // ignore log error
      }
    }

    return NextResponse.json({
      success: true,
      custUpdated,
      suppUpdated,
      prodUpdated,
      docUpdated,
      totalSynced
    });
  } catch (error: any) {
    console.error("Confirm Aronium Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
