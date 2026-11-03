import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity.js';
import { User } from '../users/user.entity.js';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto.js';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto.js';

const LEVELS = ['alta', 'media', 'baja'];
const VIBES = ['tranquilo', 'equilibrado', 'social', 'estudioso'];

@Injectable()
export class StudentProfileService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profileRepository: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private checkDistance(distance?: number) {
    if (distance !== undefined && distance <= 0) {
      throw new BadRequestException(
        'La distancia máxima debe ser mayor que 0 (en metros)',
      );
    }
  }

  private checkExtras(data: UpdateStudentProfileDto) {
    if (
      data.amenitiesPriority !== undefined &&
      !LEVELS.includes(data.amenitiesPriority)
    ) {
      throw new BadRequestException(
        'amenitiesPriority debe ser alta, media o baja',
      );
    }

    if (
      data.vibePreference !== undefined &&
      !VIBES.includes(data.vibePreference)
    ) {
      throw new BadRequestException(
        'vibePreference debe ser tranquilo, equilibrado, social o estudioso',
      );
    }

    if (
      data.desiredStayMonths !== undefined &&
      data.desiredStayMonths !== null
    ) {
      if (
        !Number.isInteger(data.desiredStayMonths) ||
        data.desiredStayMonths < 1
      ) {
        throw new BadRequestException(
          'desiredStayMonths debe ser un entero de 1 o más',
        );
      }
    }

    for (const field of ['minBedrooms', 'minBathrooms'] as const) {
      const value = data[field];

      if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        throw new BadRequestException(`${field} debe ser un entero de 0 o más`);
      }
    }
  }

  private isForeignKeyError(error: unknown) {
    const err = error as { code?: string; driverError?: { code?: string } };
    return err.code === '23503' || err.driverError?.code === '23503';
  }

  private async saveProfile(profile: StudentProfile) {
    try {
      return await this.profileRepository.save(profile);
    } catch (error) {
      if (this.isForeignKeyError(error)) {
        throw new NotFoundException('Tipo de propiedad no encontrado');
      }
      throw error;
    }
  }

  async create(createDto: CreateStudentProfileDto) {
    this.checkDistance(createDto.maxDistanceToCampus);
    this.checkExtras(createDto);

    if (!createDto.userId) {
      throw new BadRequestException('Debes enviar userId');
    }

    const user = await this.usersRepository.findOneBy({
      id: createDto.userId,
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const exists = await this.profileRepository.findOneBy({
      userId: createDto.userId,
    });
    if (exists) {
      throw new ConflictException('Este usuario ya tiene un perfil');
    }

    const profile = this.profileRepository.create(createDto);

    return this.saveProfile(profile);
  }

  findAll() {
    return this.profileRepository.find();
  }

  async findOne(id: number) {
    const profile = await this.profileRepository.findOneBy({ id });

    if (!profile) {
      throw new NotFoundException(`Perfil con id ${id} no encontrado`);
    }

    return profile;
  }

  async findByUserId(userId: number) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: { preferredPropertyType: true },
    });

    if (!profile) {
      throw new NotFoundException('Aún no tienes un perfil de estudiante');
    }

    return profile;
  }

  async update(id: number, updateDto: UpdateStudentProfileDto) {
    this.checkDistance(updateDto.maxDistanceToCampus);
    this.checkExtras(updateDto);

    const profile = await this.findOne(id);

    Object.assign(profile, { ...updateDto, id });

    return this.saveProfile(profile);
  }

  async remove(id: number) {
    const profile = await this.findOne(id);

    await this.profileRepository.remove(profile);

    return { message: 'Perfil eliminado' };
  }
}
