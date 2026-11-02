import { z } from 'zod';
import type { AdminRole, AdminStatus } from './types';

export const updateTeamMemberSchema = z.object({
  role: z.enum(['owner', 'manager', 'staff']).optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
});

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
