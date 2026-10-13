
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { RolesService } from './roles.service.js';
import { Role } from './role.entity.js';
import { Permission } from '../permissions/permission.entity.js';

describe('RolesService CRUD', () => {
  let service: RolesService;

  const rolesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const permissionsRepository = {
    findBy: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
  };

  const buildRole = (id: number, name: string) => ({
    id,
    name,
    description: 'Descripción',
    permissions: [],
  });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: rolesRepository },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(RolesService);
  });

  it('should return a role by id', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));

    const result = await service.findOne(4);

    expect(result.name).toBe('moderator');
  });

  it('should throw when the role does not exist', async () => {
    rolesRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should reject a role without name or description', async () => {
    await expect(
      service.create({ name: '', description: 'Algo' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a duplicated role name', async () => {
    rolesRepository.findOneBy.mockResolvedValue(buildRole(1, 'student'));

    await expect(
      service.create({ name: 'student', description: 'Otra vez' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a role', async () => {
    rolesRepository.findOneBy.mockResolvedValue(null);
    rolesRepository.create.mockReturnValue({
      name: 'moderator',
      description: 'Moderador',
    });
    rolesRepository.save.mockResolvedValue({ id: 4 });
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));

    const result = await service.create({
      name: 'moderator',
      description: 'Moderador',
    });

    expect(result.name).toBe('moderator');
  });

  it('should rename a custom role', async () => {
    rolesRepository.findOne
      .mockResolvedValueOnce(buildRole(4, 'moderator'))
      .mockResolvedValueOnce(buildRole(4, 'supervisor'));
    rolesRepository.findOneBy.mockResolvedValue(null);
    rolesRepository.save.mockResolvedValue({});

    const result = await service.update(4, { name: 'supervisor' });

    expect(rolesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'supervisor' }),
    );
    expect(result.name).toBe('supervisor');
  });

  it('should not rename a base role', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(1, 'student'));

    await expect(service.update(1, { name: 'otro' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject an empty name when updating', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));

    await expect(service.update(4, { name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject a duplicated name when updating', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.findOneBy.mockResolvedValue(buildRole(3, 'admin'));

    await expect(service.update(4, { name: 'admin' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('should update only the description', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.save.mockResolvedValue({});

    await service.update(4, { description: 'Nueva descripción' });

    expect(rolesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Nueva descripción' }),
    );
  });

  it('should set the permissions of a role', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    permissionsRepository.findBy.mockResolvedValue([
      { id: 1, name: 'view_properties' },
      { id: 2, name: 'write_review' },
    ]);
    rolesRepository.save.mockResolvedValue({});

    await service.setPermissions(4, [1, 2, 2]);

    expect(rolesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [
          { id: 1, name: 'view_properties' },
          { id: 2, name: 'write_review' },
        ],
      }),
    );
  });

  it('should clear the permissions with an empty list', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.save.mockResolvedValue({});

    await service.setPermissions(4, []);

    expect(permissionsRepository.findBy).not.toHaveBeenCalled();
    expect(rolesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: [] }),
    );
  });

  it('should reject permissionIds that is not a list', async () => {
    await expect(
      service.setPermissions(4, 'x' as unknown as number[]),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject permissions that do not exist', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    permissionsRepository.findBy.mockResolvedValue([{ id: 1 }]);

    await expect(service.setPermissions(4, [1, 999])).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should not delete a base role', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(3, 'admin'));

    await expect(service.remove(3)).rejects.toThrow(BadRequestException);
    expect(rolesRepository.remove).not.toHaveBeenCalled();
  });

  it('should delete a custom role', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.remove.mockResolvedValue({});

    const result = await service.remove(4);

    expect(result).toEqual({ message: 'Rol eliminado' });
  });

  it('should not delete a role that has users', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.remove.mockRejectedValue({ code: '23503' });

    await expect(service.remove(4)).rejects.toThrow(ConflictException);
  });

  it('should rethrow unexpected errors when deleting', async () => {
    rolesRepository.findOne.mockResolvedValue(buildRole(4, 'moderator'));
    rolesRepository.remove.mockRejectedValue(new Error('fallo'));

    await expect(service.remove(4)).rejects.toThrow('fallo');
  });
});
