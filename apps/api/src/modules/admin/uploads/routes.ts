import { Router } from 'express';
import multer from 'multer';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB cap
  },
});

export const adminUploadsRouter = Router();

adminUploadsRouter.post(
  '/',
  requireAdmin,
  requireRole('owner', 'manager'),
  upload.single('file'),
  controller.uploadFile,
);

