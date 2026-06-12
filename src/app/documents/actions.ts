"use server";

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinaryStorage';

export async function uploadDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !(file instanceof Blob)) return { success: false, error: "No valid file uploaded" };
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return { success: false, error: "File too large. Maximum size is 10MB." };

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const { publicId, secureUrl } = await uploadToCloudinary(
      file.name,
      file.type || 'application/octet-stream',
      fileBuffer
    );

    // Save to Database — fileUrl stores Cloudinary public ID
    await prisma.document.create({
      data: {
        fileName: file.name,
        fileUrl: publicId,          // Store Cloudinary public_id as fileUrl
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploadedById: session.userId as string,
        customerId: customerId || null,
        projectId: projectId || null,
      }
    });

    revalidatePath('/documents');
    return { success: true };
  } catch (err: any) {
    console.error("Upload Error:", err);
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

export async function deleteDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return;

    const documentId = formData.get('documentId') as string;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return;

    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
      return;
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(doc.fileUrl, doc.mimeType);
    } catch (err) {
      console.error("Failed to delete from Cloudinary:", err);
    }

    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath('/documents');
  } catch (err: any) {
    console.error("Delete Error:", err);
  }
}
