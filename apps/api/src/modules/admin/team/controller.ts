import type { Request, Response } from 'express';
import { updateTeamMemberSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import * as service from './service';

export async function getTeam(req: Request, res: Response) {
  const members = await service.listTeam();
  res.json({ data: members });
}

export async function updateMember(req: Request<{ id: string }>, res: Response) {
  const parsed = updateTeamMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid member update payload');
  }

  const updated = await service.updateTeamMember(req.params.id, req.adminId!, parsed.data);

  await audit(
    req.adminId!,
    'update_team_member',
    'admin_user',
    req.params.id,
    parsed.data,
    req.ip,
  );

  res.json({ data: updated });
}

export async function deleteMember(req: Request<{ id: string }>, res: Response) {
  await service.deleteTeamMember(req.params.id);

  await audit(
    req.adminId!,
    'reject_team_member',
    'admin_user',
    req.params.id,
    {},
    req.ip,
  );

  res.json({ data: { success: true } });
}

export async function resetPassword(req: Request<{ id: string }>, res: Response) {
  const result = await service.resetTeamMemberPassword(req.params.id);

  // Security rule: NEVER log the temporary password in the audit log
  await audit(
    req.adminId!,
    'reset_member_password',
    'admin_user',
    req.params.id,
    {},
    req.ip,
  );

  res.json({ data: result });
}

