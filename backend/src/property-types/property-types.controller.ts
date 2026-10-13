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
import { PropertyTypesService } from './property-types.service.js';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto.js';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';

@Controller('property-types')
export class PropertyTypesController {
  constructor(private propertyTypesService: PropertyTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  create(@Body() createPropertyTypeDto: CreatePropertyTypeDto) {
    return this.propertyTypesService.create(createPropertyTypeDto);
  }

  @Get()
  findAll() {
    return this.propertyTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertyTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyTypeDto: UpdatePropertyTypeDto,
  ) {
    return this.propertyTypesService.update(id, updatePropertyTypeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.propertyTypesService.remove(id);
  }
}