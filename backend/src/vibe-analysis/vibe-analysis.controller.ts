import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { VibeAnalysisService } from './vibe-analysis.service.js';
import { CreateVibeAnalysisDto } from './dto/create-vibe-analysis.dto.js';
import { UpdateVibeAnalysisDto } from './dto/update-vibe-analysis.dto.js';

@Controller('vibe-analysis')
export class VibeAnalysisController {
  constructor(private readonly vibeAnalysisService: VibeAnalysisService) {}

  @Post()
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVibeAnalysisDto,
  ) {
    return this.vibeAnalysisService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vibeAnalysisService.remove(id);
  }
}
