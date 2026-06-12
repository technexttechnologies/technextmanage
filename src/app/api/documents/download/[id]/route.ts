import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateSignedUrl } from '@/lib/cloudinaryStorage';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new NextResponse('Not found', { status: 404 });

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && doc.uploadedById !== session.userId) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    // Generate a 1-hour signed Cloudinary URL and redirect to it
    const signedUrl = generateSignedUrl(doc.fileUrl, doc.mimeType);
    return NextResponse.redirect(signedUrl);
  } catch (e: any) {
    console.error("Download Error:", e);
    return new NextResponse(`Failed to retrieve file: ${e.message}`, { status: 500 });
  }
}
