import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new NextResponse('Not found', { status: 404 });

  // Admins can download anything, users can only download their own
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    const res = await fetch(doc.fileUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch blob: ${res.statusText}`);
    }

    // Stream the file directly to the client securely
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `attachment; filename="${doc.fileName}"`,
      },
    });
  } catch (e: any) {
    console.error("Secure Download Error:", e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
