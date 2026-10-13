import { ForbiddenException } from '@nestjs/common';
import { RoleName } from '../common/enums/role-name.enum.js';
import type { AuthUser } from './auth-request.interface.js';

export function checkOwnerOrAdmin(user: AuthUser, ownerId: number) {
  if (user.role !== RoleName.ADMIN && user.userId !== ownerId) {
    throw new ForbiddenException('No tienes permiso para esta acción');
  }
}