import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { checkOwnerOrAdmin } from '../auth/ownership.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import type { AuthenticatedRequest } from '../auth/auth-request.interface.js';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.STUDENT, RoleName.ADMIN)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  add(
    @Body() body: { userId?: number; propertyId: number },
    @Req() req: AuthenticatedRequest,
  ) {
    const userId =
      req.user.role === RoleName.ADMIN && body.userId
        ? body.userId
        : req.user.userId;

    return this.favoritesService.add(userId, body.propertyId);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    checkOwnerOrAdmin(req.user, userId);

    return this.favoritesService.findByUser(userId);
  }

  @Delete('user/:userId/property/:propertyId')
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    checkOwnerOrAdmin(req.user, userId);

    return this.favoritesService.remove(userId, propertyId);
  }
}