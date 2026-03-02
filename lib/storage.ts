
import { supabase } from './supabaseClient';

/**
 * Uploads a file to a Supabase storage bucket.
 * @param bucket The name of the bucket (e.g., 'rooms', 'passports', 'cms')
 * @param path The path within the bucket (e.g., 'room-101.jpg')
 * @param file The file object to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  // 1. Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    console.error(`Error uploading file to ${bucket}/${path}:`, error.message);
    throw error;
  }

  // 2. Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Helper to generate a unique filename
 */
export function generateFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop();
  const fileName = Math.random().toString(36).substring(2, 15);
  return `${fileName}-${Date.now()}.${fileExt}`;
}
