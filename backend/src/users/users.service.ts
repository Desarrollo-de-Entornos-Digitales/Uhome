import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from './user.entity.js';
import { Role } from '../roles/role.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { RoleName } from '../common/enums/role-name.enum.js';

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

  private async findEntity(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    if (
      !createUserDto.email ||
      !createUserDto.password ||
      !createUserDto.fullName ||
      !createUserDto.username
    ) {
      throw new BadRequestException(
        'Debes enviar email, password, fullName y username',
      );
    }

    const exists = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    const studentRole = await this.rolesRepository.findOneBy({
      name: RoleName.STUDENT,
    });

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roleId: studentRole?.id,
    });
    const saved = await this.usersRepository.save(user);

    return this.findOne(saved.id);
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

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: { role: true },
    });
  }

  findForAuth(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findEntity(id);

    const data = { ...updateUserDto, id };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, data);
    await this.usersRepository.save(user);

    return this.findOne(id);
  }

  async setRole(id: number, roleId: number) {
    const user = await this.findEntity(id);

    const role = await this.rolesRepository.findOneBy({ id: roleId });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    user.roleId = role.id;
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
