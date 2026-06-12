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
 * Upload a PUBLIC file (PDF/doc) to Cloudinary.
 * Use this for quotation & invoice PDFs that go in customer emails.
 * Returns a permanent public URL.
 */
export async function uploadPublicFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ publicId: string; secureUrl: string }> {
  const cl = getCloudinary();

  // Always use 'raw' for non-images so the actual file is served
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

  // Preserve extension so Cloudinary serves file with correct Content-Type
  const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  return new Promise((resolve, reject) => {
    const uploadStream = cl.uploader.upload_stream(
      {
        folder: 'technext-crm-pdfs',
        public_id: `${Date.now()}-${baseName}${ext}`, // e.g. 17812...-quotation.pdf
        resource_type: resourceType as any,
        type: 'upload',       // public — accessible without auth
        overwrite: false,
        use_filename: false,  // we set our own public_id with extension
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
 * Upload a PRIVATE file to Cloudinary.
 * Use this for internal documents on the Documents page.
 * Requires a signed URL to download.
 */
export async function uploadToCloudinary(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ publicId: string; secureUrl: string }> {
  const cl = getCloudinary();

  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

  const safeFileName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  return new Promise((resolve, reject) => {
    const uploadStream = cl.uploader.upload_stream(
      {
        folder: 'technext-crm-documents',
        public_id: `${Date.now()}-${safeFileName}`,
        resource_type: resourceType as any,
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
 * Generate a signed URL for downloading a private Cloudinary document.
 * URL expires in 1 hour.
 */
export function generateSignedUrl(publicId: string, mimeType: string = 'raw'): string {
  const cl = getCloudinary();
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

  return cl.url(publicId, {
    resource_type: resourceType as any,
    type: 'upload',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    secure: true,
    attachment: true,
  });
}

/**
 * Delete a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string, mimeType: string): Promise<void> {
  const cl = getCloudinary();
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
  try {
    await cl.uploader.destroy(publicId, { resource_type: resourceType as any });
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}
