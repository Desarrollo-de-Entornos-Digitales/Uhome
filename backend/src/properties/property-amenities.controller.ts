import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PropertyAmenitiesService } from './property-amenities.service.js';
import { SetPropertyAmenitiesDto } from './dto/set-property-amenities.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';

@Controller('properties/:propertyId/amenities')
export class PropertyAmenitiesController {
  constructor(
    private readonly propertyAmenitiesService: PropertyAmenitiesService,
  ) {}

  @Get()
  findAll(@Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.propertyAmenitiesService.findAll(propertyId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  setAll(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body() setPropertyAmenitiesDto: SetPropertyAmenitiesDto,
  ) {
    return this.propertyAmenitiesService.setAll(
      propertyId,
      setPropertyAmenitiesDto.amenityIds,
    );
  }

  @Post(':amenityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  add(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('amenityId', ParseIntPipe) amenityId: number,
  ) {
    return this.propertyAmenitiesService.add(propertyId, amenityId);
  }

  @Delete(':amenityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.LANDLORD, RoleName.ADMIN)
  remove(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('amenityId', ParseIntPipe) amenityId: number,
  ) {
    return this.propertyAmenitiesService.remove(propertyId, amenityId);
  }
}