import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  findAll() {
    return this.permissionsRepository.find();
  }

  async findOne(id: number) {
    const permission = await this.permissionsRepository.findOneBy({ id });

    if (!permission) {
      throw new NotFoundException(`Permiso con id ${id} no encontrado`);
    }

    return permission;
  }

  async create(createPermissionDto: CreatePermissionDto) {
    if (!createPermissionDto.name || !createPermissionDto.description) {
      throw new BadRequestException('Debes enviar name y description');
    }

    const exists = await this.permissionsRepository.findOneBy({
      name: createPermissionDto.name,
    });
    if (exists) {
      throw new ConflictException('Ya existe un permiso con ese nombre');
    }

    const permission = this.permissionsRepository.create(createPermissionDto);

    return this.permissionsRepository.save(permission);
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findOne(id);

    if (updatePermissionDto.name !== undefined) {
      if (!updatePermissionDto.name) {
        throw new BadRequestException('El nombre no puede estar vacío');
      }

      if (updatePermissionDto.name !== permission.name) {
        const exists = await this.permissionsRepository.findOneBy({
          name: updatePermissionDto.name,
        });
        if (exists) {
          throw new ConflictException('Ya existe un permiso con ese nombre');
        }

        permission.name = updatePermissionDto.name;
      }
    }

    if (updatePermissionDto.description !== undefined) {
      permission.description = updatePermissionDto.description;
    }

    return this.permissionsRepository.save(permission);
  }

  async remove(id: number) {
    const permission = await this.findOne(id);

    await this.permissionsRepository.remove(permission);

    return { message: 'Permiso eliminado' };
  }
}