import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { Property } from './property.entity.js';
import { PropertyType } from '../property-types/property-type.entity.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(PropertyType)
    private readonly propertyTypeRepository: Repository<PropertyType>,
  ) {}

  private async validateData(data: UpdatePropertyDto) {
    if (data.latitude !== undefined && data.latitude !== null) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new BadRequestException('La latitud debe estar entre -90 y 90');
      }
    }

    if (data.longitude !== undefined && data.longitude !== null) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new BadRequestException(
          'La longitud debe estar entre -180 y 180',
        );
      }
    }

    if (data.propertyTypeId !== undefined) {
      const type = await this.propertyTypeRepository.findOneBy({
        id: data.propertyTypeId,
      });

      if (!type) {
        throw new NotFoundException('Tipo de propiedad no encontrado');
      }
    }
  }

  async create(createPropertyDto: CreatePropertyDto) {
    if (!createPropertyDto.propertyTypeId) {
      throw new BadRequestException('Debes enviar propertyTypeId');
    }

    await this.validateData(createPropertyDto);

    const property = this.propertyRepository.create(createPropertyDto);
    const saved = await this.propertyRepository.save(property);

    return this.findOne(saved.id);
  }

  findAll(filters: { maxDistance?: number; maxPrice?: number } = {}) {
    const where: FindOptionsWhere<Property> = {};

    if (filters.maxDistance !== undefined) {
      where.distanceToCampus = LessThanOrEqual(filters.maxDistance);
    }

    if (filters.maxPrice !== undefined) {
      where.price = LessThanOrEqual(filters.maxPrice);
    }

    return this.propertyRepository.find({
      where,
      relations: { amenities: true, propertyType: true },
    });
  }

  async findOne(id: number) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: { amenities: true, propertyType: true },
    });

    if (!property) {
      throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
    }

    return property;
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto) {
    const property = await this.propertyRepository.findOneBy({ id });

    if (!property) {
      throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
    }

    await this.validateData(updatePropertyDto);

    Object.assign(property, { ...updatePropertyDto, id });
    await this.propertyRepository.save(property);

    return this.findOne(id);
  }

  async remove(id: number) {
    const property = await this.propertyRepository.findOneBy({ id });

    if (!property) {
      throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
    }

    await this.propertyRepository.remove(property);

    return { message: 'Propiedad eliminada' };
  }
}
