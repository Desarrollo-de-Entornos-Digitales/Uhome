import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service.js';
import { Role } from './role.entity.js';
import { Permission } from '../permissions/permission.entity.js';

describe('RolesService', () => {
  let service: RolesService;

  const rolesRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const permissionsRepository = {
    findOneBy: vi.fn(),
    findBy: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: rolesRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionsRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe devolver todos los roles incluyendo sus permisos', async () => {
      const roles = [
        {
          id: 1,
          name: 'student',
          permissions: [{ name: 'view_properties' }],
        },
        {
          id: 2,
          name: 'admin',
          permissions: [{ name: 'manage_users' }],
        },
      ];

      rolesRepository.find.mockResolvedValue(roles);

      await expect(service.findAll()).resolves.toEqual(roles);

      expect(rolesRepository.find).toHaveBeenCalledWith({
        relations: { permissions: true },
      });
    });
  });

  describe('onModuleInit', () => {
    it('debe crear permisos y roles predeterminados cuando no existen', async () => {
      permissionsRepository.findOneBy.mockResolvedValue(null);
      permissionsRepository.save.mockResolvedValue({});
      permissionsRepository.findBy.mockResolvedValue([
        { name: 'view_properties' },
        { name: 'write_review' },
      ]);

      rolesRepository.findOne.mockResolvedValue(null);
      rolesRepository.create.mockImplementation((data) => ({
        ...data,
        permissions: [],
      }));
      rolesRepository.save.mockImplementation(async (role) => role);

      await service.onModuleInit();

      expect(permissionsRepository.save).toHaveBeenCalledTimes(7);
      expect(rolesRepository.create).toHaveBeenCalledTimes(3);
      expect(permissionsRepository.findBy).toHaveBeenCalledTimes(3);
      expect(rolesRepository.save).toHaveBeenCalledTimes(3);

      expect(rolesRepository.create).toHaveBeenCalledWith({
        name: 'student',
        description: 'Estudiante que busca vivienda',
      });

      expect(rolesRepository.create).toHaveBeenCalledWith({
        name: 'landlord',
        description: 'Arrendador que publica propiedades',
      });

      expect(rolesRepository.create).toHaveBeenCalledWith({
        name: 'admin',
        description: 'Administrador de la plataforma',
      });
    });

    it('no debe guardar permisos que ya existen', async () => {
      permissionsRepository.findOneBy.mockResolvedValue({
        name: 'view_properties',
      });

      rolesRepository.findOne.mockResolvedValue({
        name: 'student',
        permissions: [{ name: 'view_properties' }],
      });

      await service.onModuleInit();

      expect(permissionsRepository.save).not.toHaveBeenCalled();
    });

    it('no debe volver a asignar permisos a roles que ya tienen permisos', async () => {
      permissionsRepository.findOneBy.mockResolvedValue({
        name: 'existing_permission',
      });

      rolesRepository.findOne.mockResolvedValue({
        name: 'student',
        permissions: [{ name: 'view_properties' }],
      });

      await service.onModuleInit();

      expect(permissionsRepository.findBy).not.toHaveBeenCalled();
      expect(rolesRepository.save).not.toHaveBeenCalled();
    });
  });
});