import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentProfileService } from './student-profile.service.js';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto.js';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { checkOwnerOrAdmin } from '../auth/ownership.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import type { AuthenticatedRequest } from '../auth/auth-request.interface.js';

@Controller('student-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentProfileController {
  constructor(
    private readonly studentProfileService: StudentProfileService,
  ) {}

  @Post()
  @Roles(RoleName.STUDENT, RoleName.ADMIN)
  create(
    @Body() createDto: CreateStudentProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== RoleName.ADMIN || !createDto.userId) {
      createDto.userId = req.user.userId;
    }

    return this.studentProfileService.create(createDto);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.studentProfileService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const profile = await this.studentProfileService.findOne(id);

    checkOwnerOrAdmin(req.user, profile.userId);

    return profile;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStudentProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const profile = await this.studentProfileService.findOne(id);

    checkOwnerOrAdmin(req.user, profile.userId);

    return this.studentProfileService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const profile = await this.studentProfileService.findOne(id);

    checkOwnerOrAdmin(req.user, profile.userId);

    return this.studentProfileService.remove(id);
  }
}