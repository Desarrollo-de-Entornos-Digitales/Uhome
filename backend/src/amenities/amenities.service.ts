import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './amenity.entity.js';
import { CreateAmenityDto } from './dto/create-amenity.dto.js';
import { UpdateAmenityDto } from './dto/update-amenity.dto.js';

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  create(createAmenityDto: CreateAmenityDto) {
    if (!createAmenityDto.name) {
      throw new BadRequestException('Debes enviar name');
    }

    const amenity = this.amenityRepository.create(createAmenityDto);

    return this.amenityRepository.save(amenity);
  }

  findAll() {
    return this.amenityRepository.find();
  }

  async findOne(id: number) {
    const amenity = await this.amenityRepository.findOneBy({ id });

    if (!amenity) {
      throw new NotFoundException(`Amenity con id ${id} no encontrado`);
    }

    return amenity;
  }

  async update(id: number, updateAmenityDto: UpdateAmenityDto) {
    const amenity = await this.findOne(id);

    Object.assign(amenity, { ...updateAmenityDto, id });

    return this.amenityRepository.save(amenity);
  }

  async remove(id: number) {
    const amenity = await this.findOne(id);

    await this.amenityRepository.remove(amenity);

    return { message: 'Amenity eliminado' };
  }
}
