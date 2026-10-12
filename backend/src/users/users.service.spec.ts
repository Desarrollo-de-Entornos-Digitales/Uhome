import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { User } from './user.entity.js';
import { Role } from '../roles/role.entity.js';
import { RoleName } from '../common/enums/role-name.enum.js';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const rolesRepository = {
    findOneBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: rolesRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un usuario y ocultar su contraseña en la respuesta', async () => {
      const dto = {
        email: 'estudiante@example.com',
        password: 'ClaveSegura123',
        fullName: 'Estudiante de Prueba',
        username: 'estudiante1',
      };

      const role = { id: 2, name: RoleName.STUDENT };
      const savedUser = {
        id: 1,
        ...dto,
        password: 'contraseña-cifrada',
        roleId: 2,
      };
      const returnedUser = {
        id: 1,
        email: dto.email,
        fullName: dto.fullName,
        username: dto.username,
        roleId: 2,
      };

      usersRepository.findOneBy.mockResolvedValue(null);
      rolesRepository.findOneBy.mockResolvedValue(role);
      usersRepository.create.mockImplementation((data) => data);
      usersRepository.save.mockResolvedValue(savedUser);
      usersRepository.findOne.mockResolvedValue(savedUser);

      await expect(service.create(dto)).resolves.toEqual(returnedUser);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: dto.email,
      });
      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({
        name: RoleName.STUDENT,
      });

      const createdUser = usersRepository.create.mock.calls[0][0];
      expect(createdUser.password).not.toBe(dto.password);
      expect(createdUser.roleId).toBe(2);
      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('debe fallar si faltan los datos obligatorios', async () => {
      await expect(
        service.create({
          email: '',
          password: 'Clave123',
          fullName: 'Estudiante',
          username: 'estudiante',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('debe fallar si el correo ya está registrado', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 1 });

      await expect(
        service.create({
          email: 'existente@example.com',
          password: 'Clave123',
          fullName: 'Estudiante',
          username: 'estudiante',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe devolver usuarios sin incluir sus contraseñas', async () => {
      usersRepository.find.mockResolvedValue([
        {
          id: 1,
          email: 'uno@example.com',
          password: 'hash1',
        },
        {
          id: 2,
          email: 'dos@example.com',
          password: 'hash2',
        },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        { id: 1, email: 'uno@example.com' },
        { id: 2, email: 'dos@example.com' },
      ]);

      expect(usersRepository.find).toHaveBeenCalledWith({
        relations: { role: true },
      });
    });
  });

  describe('findOne', () => {
    it('debe devolver un usuario sin su contraseña', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'uno@example.com',
        password: 'hash1',
      });

      await expect(service.findOne(1)).resolves.toEqual({
        id: 1,
        email: 'uno@example.com',
      });
    });

    it('debe fallar si el usuario no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('debe buscar un usuario por correo incluyendo su rol', async () => {
      const user = { id: 1, email: 'uno@example.com', password: 'hash1' };
      usersRepository.findOne.mockResolvedValue(user);

      await expect(
        service.findByEmail('uno@example.com'),
      ).resolves.toEqual(user);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'uno@example.com' },
        relations: { role: true },
      });
    });
  });

  describe('findForAuth', () => {
    it('debe buscar un usuario por ID incluyendo su rol', async () => {
      const user = { id: 1, email: 'uno@example.com', password: 'hash1' };
      usersRepository.findOne.mockResolvedValue(user);

      await expect(service.findForAuth(1)).resolves.toEqual(user);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { role: true },
      });
    });
  });

  describe('update', () => {
    it('debe actualizar los datos de un usuario', async () => {
      const user = {
        id: 1,
        email: 'uno@example.com',
        fullName: 'Nombre anterior',
        password: 'hash-anterior',
      };
      const updatedUser = {
        ...user,
        fullName: 'Nombre actualizado',
      };

      usersRepository.findOneBy.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(updatedUser);
      usersRepository.findOne.mockResolvedValue(updatedUser);

      await expect(
        service.update(1, {
          fullName: 'Nombre actualizado',
        }),
      ).resolves.toEqual({
        id: 1,
        email: 'uno@example.com',
        fullName: 'Nombre actualizado',
      });

      expect(usersRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('debe cifrar la contraseña cuando se actualiza', async () => {
      const user = {
        id: 1,
        email: 'uno@example.com',
        password: 'hash-anterior',
      };

      usersRepository.findOneBy.mockResolvedValue(user);
      usersRepository.save.mockImplementation(async (value) => value);
      usersRepository.findOne.mockImplementation(async ({ where }) => ({
        ...user,
        password: usersRepository.save.mock.calls.length
          ? user.password
          : 'hash-anterior',
        ...where,
      }));

      await service.update(1, { password: 'NuevaClave123' });

      const savedUser = usersRepository.save.mock.calls[0][0];

      expect(savedUser.password).not.toBe('NuevaClave123');
      expect(savedUser.password).not.toBe('hash-anterior');
    });

    it('debe fallar si el usuario no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(999, { fullName: 'Nuevo nombre' }),
      ).rejects.toThrow(NotFoundException);

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('setRole', () => {
    it('debe asignar un rol al usuario', async () => {
      const user = { id: 1, roleId: 1 };
      const role = { id: 2 };

      usersRepository.findOneBy.mockResolvedValue(user);
      rolesRepository.findOneBy.mockResolvedValue(role);
      usersRepository.save.mockImplementation(async (value) => value);
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        password: 'hash',
      });

      await expect(service.setRole(1, 2)).resolves.toEqual({
        id: 1,
        roleId: 2,
      });

      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({ id: 2 });
      expect(user.roleId).toBe(2);
    });

    it('debe fallar si el rol no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 1 });
      rolesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.setRole(1, 999)).rejects.toThrow(
        NotFoundException,
      );

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('debe activar o desactivar un usuario', async () => {
      const user = {
        id: 1,
        email: 'uno@example.com',
        isActive: true,
      };

      usersRepository.findOneBy.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      await expect(service.setActive(1, false)).resolves.toEqual({
        id: 1,
        email: 'uno@example.com',
        isActive: false,
      });

      expect(user.isActive).toBe(false);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });

    it('debe fallar si el usuario no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.setActive(999, true)).rejects.toThrow(
        NotFoundException,
      );

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar un usuario existente', async () => {
      const user = { id: 1, email: 'uno@example.com' };

      usersRepository.findOneBy.mockResolvedValue(user);
      usersRepository.remove.mockResolvedValue(user);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Usuario eliminado',
      });

      expect(usersRepository.remove).toHaveBeenCalledWith(user);
    });

    it('debe fallar si el usuario que se elimina no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        NotFoundException,
      );

      expect(usersRepository.remove).not.toHaveBeenCalled();
    });
  });
});