import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get()
  findAll(
    @Query('maxDistance') maxDistance?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const filters: { maxDistance?: number; maxPrice?: number } = {};

    if (maxDistance !== undefined) {
      const distance = Number(maxDistance);
      if (isNaN(distance)) {
        throw new BadRequestException('maxDistance debe ser un número');
      }
      filters.maxDistance = distance;
    }

    if (maxPrice !== undefined) {
      const price = Number(maxPrice);
      if (isNaN(price)) {
        throw new BadRequestException('maxPrice debe ser un número');
      }
      filters.maxPrice = price;
    }

    return this.propertiesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.remove(id);
  }
}
