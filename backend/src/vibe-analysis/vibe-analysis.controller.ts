import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VibeAnalysisService } from './vibe-analysis.service.js';
import { CreateVibeAnalysisDto } from './dto/create-vibe-analysis.dto.js';
import { UpdateVibeAnalysisDto } from './dto/update-vibe-analysis.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';

@Controller('vibe-analysis')
export class VibeAnalysisController {
  constructor(private readonly vibeAnalysisService: VibeAnalysisService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  create(@Body() createDto: CreateVibeAnalysisDto) {
    return this.vibeAnalysisService.create(createDto);
  }

  @Get()
  findAll() {
    return this.vibeAnalysisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vibeAnalysisService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVibeAnalysisDto,
  ) {
    return this.vibeAnalysisService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vibeAnalysisService.remove(id);
  }
}