import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwzerbhuj',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public ID.
 */
export async function uploadToCloudinary(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ publicId: string; secureUrl: string }> {
  const cl = getCloudinary();

  // PDFs need resource_type 'image' for preview support, others use 'raw'
  const resourceType = mimeType === 'application/pdf' ? 'image' :
                       mimeType.startsWith('image/') ? 'image' : 'raw';

  const safeFileName = fileName
    .replace(/\.[^/.]+$/, '')         // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, '_'); // sanitize

  return new Promise((resolve, reject) => {
    const uploadStream = cl.uploader.upload_stream(
      {
        folder: 'technext-crm-documents',
        public_id: `${Date.now()}-${safeFileName}`,
        resource_type: resourceType as any,
        // Store as 'upload' type so signed URLs work
        type: 'upload',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({
          publicId: result!.public_id,
          secureUrl: result!.secure_url,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Generate a signed URL for downloading a Cloudinary asset (expires in 1 hour).
 */
export function generateSignedUrl(publicId: string, mimeType: string = 'raw'): string {
  const cl = getCloudinary();

  const resourceType = mimeType === 'application/pdf' ? 'image' :
                       mimeType.startsWith('image/') ? 'image' : 'raw';

  return cl.url(publicId, {
    resource_type: resourceType as any,
    type: 'upload',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    secure: true,
    attachment: true, // forces browser download
  });
}

/**
 * Delete a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string, mimeType: string): Promise<void> {
  const cl = getCloudinary();
  const resourceType = mimeType === 'application/pdf' ? 'image' :
                       mimeType.startsWith('image/') ? 'image' : 'raw';
  try {
    await cl.uploader.destroy(publicId, { resource_type: resourceType as any });
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}
