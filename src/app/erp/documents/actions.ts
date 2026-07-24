"use server";

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinaryStorage';

export async function uploadErpDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS", "OPERATIONS", "HR"].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    const folderName = formData.get('folder') as string || "General";

    if (!file || typeof (file as any).arrayBuffer !== 'function') return { success: false, error: "No valid file uploaded" };
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return { success: false, error: "File too large. Maximum size is 10MB." };

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { publicId, secureUrl } = await uploadToCloudinary(
      file.name,
      file.type || 'application/octet-stream',
      fileBuffer
    );

    // Save to Database
    await prisma.erpDocument.create({
      data: {
        name: file.name,
        folder: folderName,
        fileUrl: publicId,
        uploadedById: session.userId as string,
        version: 1,
      }
    });

    revalidatePath('/erp/documents');
    return { success: true };
  } catch (err: any) {
    console.error("Upload Error:", err);
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

export async function deleteErpDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS", "OPERATIONS", "HR"].includes(session.role)) return;

    const documentId = formData.get('documentId') as string;
    const doc = await prisma.erpDocument.findUnique({ where: { id: documentId } });
    if (!doc) return;

    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
      return;
    }

    try {
      // Basic mime type approximation for cloudinary deletion (usually raw or image)
      const mimeType = doc.name.endsWith('.pdf') || doc.name.endsWith('.docx') ? 'raw' : 'image/png';
      await deleteFromCloudinary(doc.fileUrl, mimeType);
    } catch (err) {
      console.error("Failed to delete from Cloudinary:", err);
    }

    await prisma.erpDocument.delete({ where: { id: documentId } });
    revalidatePath('/erp/documents');
  } catch (err: any) {
    console.error("Delete Error:", err);
  }
}
