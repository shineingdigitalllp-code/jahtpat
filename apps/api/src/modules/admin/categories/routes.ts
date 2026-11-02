import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get('/', requireAdmin, controller.getCategories);
adminCategoriesRouter.get('/:id', requireAdmin, controller.getCategory);
adminCategoriesRouter.post('/', requireAdmin, requireRole('owner', 'manager'), controller.createCategory);
adminCategoriesRouter.put('/:id', requireAdmin, requireRole('owner', 'manager'), controller.updateCategory);
adminCategoriesRouter.patch('/reorder', requireAdmin, requireRole('owner', 'manager'), controller.reorderCategories);
adminCategoriesRouter.delete('/:id', requireAdmin, requireRole('owner', 'manager'), controller.deleteCategory);

