import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDriveFileStream } from '@/lib/googleDrive';

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
    // doc.fileUrl contains the Google Drive File ID
    const { stream, mimeType, fileName } = await getDriveFileStream(doc.fileUrl);

    // Stream the file directly to the client
    const readableStream = stream as unknown as ReadableStream;

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error("Secure Download Error:", e);
    return new NextResponse(`Failed to retrieve file: ${e.message}`, { status: 500 });
  }
}
