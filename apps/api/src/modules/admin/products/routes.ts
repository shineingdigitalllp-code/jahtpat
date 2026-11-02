import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminProductsRouter = Router();

adminProductsRouter.get('/', requireAdmin, controller.getProducts);
adminProductsRouter.get('/export.csv', requireAdmin, requireRole('owner', 'manager'), controller.exportCsv);
adminProductsRouter.get('/import/template', requireAdmin, requireRole('owner', 'manager'), controller.getImportTemplate);
adminProductsRouter.post('/import/preview', requireAdmin, requireRole('owner', 'manager'), controller.previewImport);
adminProductsRouter.post('/import/commit', requireAdmin, requireRole('owner', 'manager'), controller.commitImport);
adminProductsRouter.get('/:id', requireAdmin, controller.getProduct);
adminProductsRouter.post('/', requireAdmin, requireRole('owner', 'manager'), controller.createProduct);
adminProductsRouter.put('/:id', requireAdmin, requireRole('owner', 'manager'), controller.updateProduct);
adminProductsRouter.post('/bulk', requireAdmin, requireRole('owner', 'manager'), controller.bulkAction);
adminProductsRouter.patch('/:id/quick', requireAdmin, controller.quickEditProduct);
adminProductsRouter.delete('/:id', requireAdmin, requireRole('owner', 'manager'), controller.deleteProduct);

