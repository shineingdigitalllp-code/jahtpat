import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import { AppError } from '@/utils/app-error';

export type UploadKind = 'product' | 'category' | 'banner';

export interface SavedImageResult {
  url: string;
  thumbUrl: string;
}

export async function saveImage(
  buffer: Buffer,
  kind: UploadKind = 'product',
): Promise<SavedImageResult> {
  const allowedKinds: UploadKind[] = ['product', 'category', 'banner'];
  if (!allowedKinds.includes(kind)) {
    throw new AppError(400, 'INVALID_KIND', 'Upload kind must be product, category, or banner');
  }

  // Verify image with sharp
  let metadata: Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new AppError(400, 'INVALID_IMAGE', 'Uploaded file is not a valid image');
  }

  if (!metadata.format || !['jpeg', 'png', 'webp', 'jpg'].includes(metadata.format)) {
    throw new AppError(400, 'INVALID_FORMAT', 'Only JPEG, PNG, and WebP images are allowed');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', `${kind}s`);
  await fs.mkdir(uploadDir, { recursive: true });

  const uuid = crypto.randomUUID();
  const filename = `${uuid}.webp`;
  const thumbFilename = `${uuid}-thumb.webp`;

  const fullPath = path.join(uploadDir, filename);
  const thumbPath = path.join(uploadDir, thumbFilename);

  // Process main image (max 1600px width/height, webp, strips EXIF)
  await sharp(buffer)
    .resize(1600, 1600, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(fullPath);

  // Process thumbnail (400px width/height)
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  return {
    url: `/uploads/${kind}s/${filename}`,
    thumbUrl: `/uploads/${kind}s/${thumbFilename}`,
  };
}
