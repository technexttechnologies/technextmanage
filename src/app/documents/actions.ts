"use server";

import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function uploadDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const file = formData.get('file') as File;
  const customerId = formData.get('customerId') as string | null;
  const projectId = formData.get('projectId') as string | null;

  if (!file || !(file instanceof Blob)) throw new Error("No valid file uploaded");

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
}

export async function deleteDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const documentId = formData.get('documentId') as string;

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  // Admins can delete anything, users can only delete their own
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
    throw new Error("Unauthorized to delete this document");
  }

  // Delete from Vercel Blob
  try {
    await del(doc.fileUrl);
  } catch (err) {
    console.error("Failed to delete blob from Vercel", err);
  }

  // Delete from DB
  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath('/documents');
}
