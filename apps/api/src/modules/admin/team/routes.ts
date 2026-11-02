import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminTeamRouter = Router();

adminTeamRouter.use(requireAdmin, requireRole('owner'));

adminTeamRouter.get('/', controller.getTeam);
adminTeamRouter.patch('/:id', controller.updateMember);
adminTeamRouter.delete('/:id', controller.deleteMember);
adminTeamRouter.post('/:id/reset-password', controller.resetPassword);

