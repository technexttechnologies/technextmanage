"use server";

import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function uploadDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !(file instanceof Blob)) return { success: false, error: "No valid file uploaded" };

    const fileBuffer = await file.arrayBuffer();

    // Upload to Vercel Blob
    const blob = await put(file.name, fileBuffer, { 
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || 'application/octet-stream'
    });

    // Save to Database
    await prisma.document.create({
      data: {
        fileName: file.name,
        fileUrl: blob.url,
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

    // Admins can delete anything, users can only delete their own
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
      return;
    }

    // Delete from Vercel Blob
    try {
      await del(doc.fileUrl);
    } catch (err) {
      console.error("Failed to delete blob from Vercel", err);
      // We continue to delete from DB even if blob delete fails
    }

    // Delete from DB
    await prisma.document.delete({ where: { id: documentId } });

    revalidatePath('/documents');
  } catch (err: any) {
    console.error("Delete Error:", err);
  }
}
