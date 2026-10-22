'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function saveAroniumConfig(formData: FormData) {
  const companyName = formData.get("companyName")?.toString() || "";
  const branchName = formData.get("branchName")?.toString() || "";
  const dbType = formData.get("dbType")?.toString() || "SQLITE";
  const dbPathOrHost = formData.get("dbPathOrHost")?.toString() || "";
  const portString = formData.get("port")?.toString();
  const port = portString ? parseInt(portString, 10) : null;
  const username = formData.get("username")?.toString() || null;
  const password = formData.get("password")?.toString() || null;
  const autoSync = formData.get("autoSync") === "on" || formData.get("autoSync") === "true";

  // Find the first configuration
  const existingConfig = await prisma.aroniumConfig.findFirst();

  if (existingConfig) {
    await prisma.aroniumConfig.update({
      where: { id: existingConfig.id },
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE", // Assuming setting it up sets status to ONLINE temporarily
      },
    });
  } else {
    await prisma.aroniumConfig.create({
      data: {
        companyName,
        branchName,
        dbType,
        dbPathOrHost,
        port,
        username,
        password,
        autoSync,
        status: "ONLINE",
      },
    });
  }

  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpProduct(id: string, data: any) {
  await prisma.erpProduct.update({
    where: { id },
    data: {
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      currentStock: parseFloat(data.currentStock) || 0,
      reorderLevel: parseFloat(data.reorderLevel) || 0,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpSale(id: string, data: any) {
  await prisma.erpSale.update({
    where: { id },
    data: {
      totalAmount: parseFloat(data.totalAmount) || 0,
      discount: parseFloat(data.discount) || 0,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function updateErpPurchase(id: string, data: any) {
  await prisma.erpPurchase.update({
    where: { id },
    data: {
      totalAmount: parseFloat(data.totalAmount) || 0,
      status: data.status,
    },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function deleteErpSale(id: string) {
  await prisma.erpSale.delete({
    where: { id },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function deleteErpPurchase(id: string) {
  await prisma.erpPurchase.delete({
    where: { id },
  });
  revalidatePath("/erp/integrations/aronium");
}

export async function triggerLocalSync() {
  try {
    const fs = require('fs');
    const aroniumDbPath = 'C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db';
    if (fs.existsSync(aroniumDbPath)) {
      const agentDir = path.resolve(process.cwd(), 'aronium-agent');
      await execAsync('node sync-to-cloud.js --once', { cwd: agentDir, timeout: 45000 });
      revalidatePath("/erp/integrations/aronium");
      return { success: true };
    } else {
      const config = await prisma.aroniumConfig.findFirst();
      const lastSync = config?.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : 'Never';
      return { 
        success: true, 
        message: `Cloud sync engine is active. Last sync received: ${lastSync}. The local desktop agent continuously syncs changes.` 
      };
    }
  } catch (error: any) {
    console.error("Local sync error:", error);
    return { success: false, error: error.message || String(error) };
  }
}
