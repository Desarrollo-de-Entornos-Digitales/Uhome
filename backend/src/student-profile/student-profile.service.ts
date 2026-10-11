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

  async create(createDto: CreateStudentProfileDto) {
    this.checkDistance(createDto.maxDistanceToCampus);

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

    return this.profileRepository.save(profile);
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

  async update(id: number, updateDto: UpdateStudentProfileDto) {
    this.checkDistance(updateDto.maxDistanceToCampus);

    const profile = await this.findOne(id);

    Object.assign(profile, { ...updateDto, id });

    return this.profileRepository.save(profile);
  }

  async remove(id: number) {
    const profile = await this.findOne(id);

    await this.profileRepository.remove(profile);

    return { message: 'Perfil eliminado' };
  }
}
