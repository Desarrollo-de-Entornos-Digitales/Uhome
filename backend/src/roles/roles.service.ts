import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './role.entity.js';
import { Permission } from '../permissions/permission.entity.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    const defaultPermissions = [
      { name: 'view_properties', description: 'Ver propiedades' },
      { name: 'create_property', description: 'Crear propiedades' },
      { name: 'edit_property', description: 'Editar propiedades' },
      { name: 'delete_property', description: 'Eliminar propiedades' },
      { name: 'write_review', description: 'Escribir reviews' },
      { name: 'manage_favorites', description: 'Guardar propiedades favoritas' },
      { name: 'manage_users', description: 'Activar y desactivar usuarios' },
    ];

    for (const permissionData of defaultPermissions) {
      const exists = await this.permissionsRepository.findOneBy({
        name: permissionData.name,
      });

      if (!exists) {
        await this.permissionsRepository.save(permissionData);
      }
    }

    const defaultRoles = [
      {
        name: 'student',
        description: 'Estudiante que busca vivienda',
        permissions: ['view_properties', 'write_review', 'manage_favorites'],
      },
      {
        name: 'landlord',
        description: 'Arrendador que publica propiedades',
        permissions: [
          'view_properties',
          'create_property',
          'edit_property',
          'delete_property',
        ],
      },
      {
        name: 'admin',
        description: 'Administrador de la plataforma',
        permissions: [
          'view_properties',
          'create_property',
          'edit_property',
          'delete_property',
          'write_review',
          'manage_favorites',
          'manage_users',
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      let role = await this.rolesRepository.findOne({
        where: { name: roleData.name },
        relations: {
        permissions: true,
         },
      });

      if (!role) {
        role = this.rolesRepository.create({
          name: roleData.name,
          description: roleData.description,
        });
        role.permissions = [];
      }

      if (role.permissions.length === 0) {
        role.permissions = await this.permissionsRepository.findBy({
          name: In(roleData.permissions),
        });
        await this.rolesRepository.save(role);
      }
    }
  }

  private isBaseRole(name: string) {
    return Object.values(RoleName).includes(name as RoleName);
  }

  private isForeignKeyError(error: unknown) {
    const err = error as { code?: string; driverError?: { code?: string } };
    return err.code === '23503' || err.driverError?.code === '23503';
  }

  findAll() {
  return this.rolesRepository.find({
    relations: {
      permissions: true,
    },
  });
}
  async findOne(id: number) {
  const role = await this.rolesRepository.findOne({
    where: { id },
    relations: {
      permissions: true,
    },
  });

    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    if (!createRoleDto.name || !createRoleDto.description) {
      throw new BadRequestException('Debes enviar name y description');
    }

    const exists = await this.rolesRepository.findOneBy({
      name: createRoleDto.name,
    });
    if (exists) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    const role = this.rolesRepository.create(createRoleDto);
    const saved = await this.rolesRepository.save(role);

    return this.findOne(saved.id);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (updateRoleDto.name !== undefined) {
      if (!updateRoleDto.name) {
        throw new BadRequestException('El nombre no puede estar vacío');
      }

      if (updateRoleDto.name !== role.name) {
        if (this.isBaseRole(role.name)) {
          throw new BadRequestException(
            'No se puede cambiar el nombre de un rol base',
          );
        }

        const exists = await this.rolesRepository.findOneBy({
          name: updateRoleDto.name,
        });
        if (exists) {
          throw new ConflictException('Ya existe un rol con ese nombre');
        }

        role.name = updateRoleDto.name;
      }
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    await this.rolesRepository.save(role);

    return this.findOne(id);
  }

  async setPermissions(id: number, permissionIds: number[]) {
    if (!Array.isArray(permissionIds)) {
      throw new BadRequestException('Debes enviar permissionIds como lista');
    }

    const role = await this.findOne(id);
    const uniqueIds = [...new Set(permissionIds)];

    const permissions =
      uniqueIds.length > 0
        ? await this.permissionsRepository.findBy({ id: In(uniqueIds) })
        : [];

    if (permissions.length !== uniqueIds.length) {
      throw new NotFoundException('Alguno de los permisos no existe');
    }

    role.permissions = permissions;
    await this.rolesRepository.save(role);

    return this.findOne(id);
  }

  async remove(id: number) {
    const role = await this.findOne(id);

    if (this.isBaseRole(role.name)) {
      throw new BadRequestException('No se pueden eliminar los roles base');
    }

    try {
      await this.rolesRepository.remove(role);
    } catch (error) {
      if (this.isForeignKeyError(error)) {
        throw new ConflictException(
          'No se puede eliminar: hay usuarios con este rol',
        );
      }
      throw error;
    }

    return { message: 'Rol eliminado' };
  }
}