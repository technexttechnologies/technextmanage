import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dwzerbhuj',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public ID.
 */
export async function uploadToCloudinary(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ publicId: string; secureUrl: string }> {
  // Determine resource type
  const resourceType = mimeType.startsWith('image/') ? 'image' : 
                       mimeType === 'application/pdf' ? 'image' : 'raw';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'technext-crm-documents',
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        resource_type: resourceType as any,
        use_filename: true,
        unique_filename: true,
        access_mode: 'authenticated', // private, requires signed URL
      },
      (error, result) => {
        if (error) return reject(error);
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
 * Generate a signed URL for downloading a private Cloudinary asset.
 * URL expires in 1 hour.
 */
export function generateSignedUrl(publicId: string, resourceType: string = 'raw'): string {
  const type = resourceType.startsWith('image/') ? 'image' : 
               resourceType === 'application/pdf' ? 'image' : 'raw';
  
  return cloudinary.url(publicId, {
    resource_type: type as any,
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    secure: true,
  });
}

/**
 * Delete a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string, mimeType: string): Promise<void> {
  const resourceType = mimeType.startsWith('image/') ? 'image' :
                       mimeType === 'application/pdf' ? 'image' : 'raw';
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
}
