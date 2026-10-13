import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './property.entity.js';
import { PropertyType } from '../property-types/property-type.entity.js';
import { Amenity } from '../amenities/amenity.entity.js';
import { PropertiesService } from './properties.service.js';
import { PropertiesController } from './properties.controller.js';
import { PropertyAmenitiesService } from './property-amenities.service.js';
import { PropertyAmenitiesController } from './property-amenities.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Property, PropertyType, Amenity])],
  controllers: [PropertiesController, PropertyAmenitiesController],
  providers: [PropertiesService, PropertyAmenitiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}