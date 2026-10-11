import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import { Role } from '../roles/role.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  private hidePassword(user: User) {
    const { password, ...result } = user;
    return result;
  }

  private async checkRole(roleId: number) {
    const role = await this.rolesRepository.findOneBy({ id: roleId });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
  }

  private async findEntity(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.roleId !== undefined) {
      await this.checkRole(createUserDto.roleId);
    }

    const user = this.usersRepository.create(createUserDto);
    const saved = await this.usersRepository.save(user);

    return this.hidePassword(saved);
  }

  async findAll() {
    const users = await this.usersRepository.find({
      relations: { role: true },
    });

    return users.map((user) => this.hidePassword(user));
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return this.hidePassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findEntity(id);

    if (updateUserDto.roleId !== undefined) {
      await this.checkRole(updateUserDto.roleId);
    }

    Object.assign(user, { ...updateUserDto, id });
    await this.usersRepository.save(user);

    return this.findOne(id);
  }

  async setActive(id: number, isActive: boolean) {
    const user = await this.findEntity(id);

    user.isActive = isActive;
    await this.usersRepository.save(user);

    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  async remove(id: number) {
    const user = await this.findEntity(id);

    await this.usersRepository.remove(user);

    return { message: 'Usuario eliminado' };
  }
}