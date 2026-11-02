import type { Request, Response } from 'express';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import { saveImage, type UploadKind } from '@/utils/save-image';

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, 'FILE_REQUIRED', 'Please select an image file to upload');
  }

  const kind = (req.query.kind as UploadKind) || 'product';
  const result = await saveImage(req.file.buffer, kind);

  if (req.adminId) {
    await audit(req.adminId, 'upload_image', kind, result.url, { thumbUrl: result.thumbUrl }, req.ip);
  }

  res.status(201).json({ data: result });
}

