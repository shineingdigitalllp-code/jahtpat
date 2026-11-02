import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

const router = Router();

// Manager and Owner access only
router.use(requireAdmin, requireRole('owner', 'manager'));

router.get('/', controller.getAnalytics);
router.get('/export.csv', controller.exportCsv);

export default router;

