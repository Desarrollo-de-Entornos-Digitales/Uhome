import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Property } from './property.entity.js';
import { Amenity } from '../amenities/amenity.entity.js';

@Injectable()
export class PropertyAmenitiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  private async findProperty(propertyId: number) {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: { amenities: true },
    });

    if (!property) {
      throw new NotFoundException(
        `Propiedad con id ${propertyId} no encontrada`,
      );
    }

    return property;
  }

  async findAll(propertyId: number) {
    const property = await this.findProperty(propertyId);

    return property.amenities;
  }

  async add(propertyId: number, amenityId: number) {
    const property = await this.findProperty(propertyId);

    const amenity = await this.amenityRepository.findOneBy({ id: amenityId });
    if (!amenity) {
      throw new NotFoundException('Amenity no encontrado');
    }

    if (property.amenities.some((item) => item.id === amenityId)) {
      throw new ConflictException('La propiedad ya tiene este amenity');
    }

    property.amenities.push(amenity);
    await this.propertyRepository.save(property);

    return property.amenities;
  }

  async remove(propertyId: number, amenityId: number) {
    const property = await this.findProperty(propertyId);

    if (!property.amenities.some((item) => item.id === amenityId)) {
      throw new NotFoundException('La propiedad no tiene este amenity');
    }

    property.amenities = property.amenities.filter(
      (item) => item.id !== amenityId,
    );
    await this.propertyRepository.save(property);

    return { message: 'Amenity quitado de la propiedad' };
  }

  async setAll(propertyId: number, amenityIds: number[]) {
    if (!Array.isArray(amenityIds)) {
      throw new BadRequestException('Debes enviar amenityIds como lista');
    }

    const property = await this.findProperty(propertyId);
    const uniqueIds = [...new Set(amenityIds)];

    const amenities =
      uniqueIds.length > 0
        ? await this.amenityRepository.find({ where: { id: In(uniqueIds) } })
        : [];

    if (amenities.length !== uniqueIds.length) {
      throw new NotFoundException('Alguno de los amenities no existe');
    }

    property.amenities = amenities;
    await this.propertyRepository.save(property);

    return property.amenities;
  }
}