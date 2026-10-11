import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VibeAnalysis } from './vibe-analysis.entity.js';
import { Property } from '../properties/property.entity.js';
import { CreateVibeAnalysisDto } from './dto/create-vibe-analysis.dto.js';
import { UpdateVibeAnalysisDto } from './dto/update-vibe-analysis.dto.js';

const SCORE_FIELDS = [
  'studentDensity',
  'nightlife',
  'studySpots',
  'quietness',
  'essentialSpots',
] as const;

@Injectable()
export class VibeAnalysisService {
  constructor(
    @InjectRepository(VibeAnalysis)
    private readonly vibeRepository: Repository<VibeAnalysis>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  private validateScores(data: Partial<CreateVibeAnalysisDto>) {
    for (const field of SCORE_FIELDS) {
      const value = data[field];

      if (value !== undefined) {
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          throw new BadRequestException(
            `${field} debe ser un número entero entre 1 y 5`,
          );
        }
      }
    }
  }

  async create(createDto: CreateVibeAnalysisDto) {
    if (!createDto.propertyId) {
      throw new BadRequestException('Debes enviar propertyId');
    }

    for (const field of SCORE_FIELDS) {
      if (createDto[field] === undefined) {
        throw new BadRequestException(`Debes enviar ${field}`);
      }
    }

    this.validateScores(createDto);

    const property = await this.propertyRepository.findOneBy({
      id: createDto.propertyId,
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const exists = await this.vibeRepository.findOneBy({
      propertyId: createDto.propertyId,
    });
    if (exists) {
      throw new ConflictException('Esta propiedad ya tiene un análisis');
    }

    const vibe = this.vibeRepository.create({
      ...createDto,
      source: 'manual',
    });

    return this.vibeRepository.save(vibe);
  }

  findAll() {
    return this.vibeRepository.find({ relations: { property: true } });
  }

  async findOne(id: number) {
    const vibe = await this.vibeRepository.findOne({
      where: { id },
      relations: { property: true },
    });

    if (!vibe) {
      throw new NotFoundException(`Análisis con id ${id} no encontrado`);
    }

    return vibe;
  }

  async update(id: number, updateDto: UpdateVibeAnalysisDto) {
    this.validateScores(updateDto);

    const vibe = await this.vibeRepository.findOneBy({ id });

    if (!vibe) {
      throw new NotFoundException(`Análisis con id ${id} no encontrado`);
    }

    Object.assign(vibe, { ...updateDto, id });
    await this.vibeRepository.save(vibe);

    return this.findOne(id);
  }

  async remove(id: number) {
    const vibe = await this.vibeRepository.findOneBy({ id });

    if (!vibe) {
      throw new NotFoundException(`Análisis con id ${id} no encontrado`);
    }

    await this.vibeRepository.remove(vibe);

    return { message: 'Análisis eliminado' };
  }
}
