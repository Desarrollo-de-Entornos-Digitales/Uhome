import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyType } from './property-type.entity.js';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto.js';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto.js';

@Injectable()
export class PropertyTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(PropertyType)
    private propertyTypesRepository: Repository<PropertyType>,
  ) {}

  async onModuleInit() {
    const defaultTypes = ['apartamento', 'casa', 'habitación', 'apartaestudio'];

    for (const name of defaultTypes) {
      const exists = await this.propertyTypesRepository.findOneBy({ name });

      if (!exists) {
        await this.propertyTypesRepository.save({ name });
      }
    }
  }

  private isForeignKeyError(error: unknown) {
    const err = error as { code?: string; driverError?: { code?: string } };
    return err.code === '23503' || err.driverError?.code === '23503';
  }

  findAll() {
    return this.propertyTypesRepository.find();
  }

  async findOne(id: number) {
    const type = await this.propertyTypesRepository.findOneBy({ id });

    if (!type) {
      throw new NotFoundException(
        `Tipo de propiedad con id ${id} no encontrado`,
      );
    }

    return type;
  }

  async create(createPropertyTypeDto: CreatePropertyTypeDto) {
    if (!createPropertyTypeDto.name) {
      throw new BadRequestException('Debes enviar name');
    }

    const exists = await this.propertyTypesRepository.findOneBy({
      name: createPropertyTypeDto.name,
    });
    if (exists) {
      throw new ConflictException('Ya existe un tipo con ese nombre');
    }

    const type = this.propertyTypesRepository.create(createPropertyTypeDto);

    return this.propertyTypesRepository.save(type);
  }

  async update(id: number, updatePropertyTypeDto: UpdatePropertyTypeDto) {
    const type = await this.findOne(id);

    if (updatePropertyTypeDto.name !== undefined) {
      if (!updatePropertyTypeDto.name) {
        throw new BadRequestException('El nombre no puede estar vacío');
      }

      if (updatePropertyTypeDto.name !== type.name) {
        const exists = await this.propertyTypesRepository.findOneBy({
          name: updatePropertyTypeDto.name,
        });
        if (exists) {
          throw new ConflictException('Ya existe un tipo con ese nombre');
        }

        type.name = updatePropertyTypeDto.name;
      }
    }

    return this.propertyTypesRepository.save(type);
  }

  async remove(id: number) {
    const type = await this.findOne(id);

    try {
      await this.propertyTypesRepository.remove(type);
    } catch (error) {
      if (this.isForeignKeyError(error)) {
        throw new ConflictException(
          'No se puede eliminar: hay propiedades con este tipo',
        );
      }
      throw error;
    }

    return { message: 'Tipo de propiedad eliminado' };
  }
}
