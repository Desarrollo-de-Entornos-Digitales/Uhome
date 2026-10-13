import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { PermissionsService } from './permissions.service.js';
import { Permission } from './permission.entity.js';

describe('PermissionsService CRUD', () => {
  let service: PermissionsService;

  const permissionsRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const buildPermission = () => ({
    id: 8,
    name: 'moderate_reviews',
    description: 'Moderar reviews',
  });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PermissionsService);
  });

  it('should return a permission by id', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(buildPermission());

    const result = await service.findOne(8);

    expect(result.name).toBe('moderate_reviews');
  });

  it('should throw when the permission does not exist', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should reject a permission without name or description', async () => {
    await expect(
      service.create({ name: 'solo_nombre', description: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a duplicated permission name', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(buildPermission());

    await expect(
      service.create({ name: 'moderate_reviews', description: 'Otra vez' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a permission', async () => {
    const data = { name: 'moderate_reviews', description: 'Moderar reviews' };

    permissionsRepository.findOneBy.mockResolvedValue(null);
    permissionsRepository.create.mockReturnValue(data);
    permissionsRepository.save.mockResolvedValue({ id: 8, ...data });

    const result = await service.create(data);

    expect(result.id).toBe(8);
  });

  it('should rename a permission', async () => {
    permissionsRepository.findOneBy
      .mockResolvedValueOnce(buildPermission())
      .mockResolvedValueOnce(null);
    permissionsRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(8, { name: 'moderate_comments' });

    expect(result.name).toBe('moderate_comments');
  });

  it('should reject an empty name when updating', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(buildPermission());

    await expect(service.update(8, { name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject a duplicated name when updating', async () => {
    permissionsRepository.findOneBy
      .mockResolvedValueOnce(buildPermission())
      .mockResolvedValueOnce({ id: 1, name: 'view_properties' });

    await expect(
      service.update(8, { name: 'view_properties' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should update only the description', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(buildPermission());
    permissionsRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(8, { description: 'Nueva' });

    expect(result.description).toBe('Nueva');
  });

  it('should delete a permission', async () => {
    permissionsRepository.findOneBy.mockResolvedValue(buildPermission());
    permissionsRepository.remove.mockResolvedValue({});

    const result = await service.remove(8);

    expect(result).toEqual({ message: 'Permiso eliminado' });
  });
});