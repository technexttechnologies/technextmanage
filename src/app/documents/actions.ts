"use server";

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadToDrive, deleteFromDrive } from '@/lib/googleDrive';

export async function uploadDocument(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !(file instanceof Blob)) return { success: false, error: "No valid file uploaded" };

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Google Drive
    const { fileId, webViewLink } = await uploadToDrive(
      file.name,
      file.type || 'application/octet-stream',
      fileBuffer
    );

    // Save to Database — fileUrl stores the Google Drive File ID
    await prisma.document.create({
      data: {
        fileName: file.name,
        fileUrl: fileId,           // Store Drive File ID as fileUrl
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

    // Delete from Google Drive (fileUrl stores the Drive File ID)
    try {
      await deleteFromDrive(doc.fileUrl);
    } catch (err) {
      console.error("Failed to delete from Google Drive:", err);
      // Continue to delete from DB even if Drive delete fails
    }

    // Delete from DB
    await prisma.document.delete({ where: { id: documentId } });

    revalidatePath('/documents');
  } catch (err: any) {
    console.error("Delete Error:", err);
  }
}
