import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { PropertyTypesService } from './property-types.service.js';
import { PropertyType } from './property-type.entity.js';

describe('PropertyTypesService CRUD', () => {
  let service: PropertyTypesService;

  const propertyTypesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const buildType = () => ({ id: 5, name: 'loft' });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PropertyTypesService,
        {
          provide: getRepositoryToken(PropertyType),
          useValue: propertyTypesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PropertyTypesService);
  });

  it('should return a type by id', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());

    const result = await service.findOne(5);

    expect(result.name).toBe('loft');
  });

  it('should throw when the type does not exist', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should reject a type without name', async () => {
    await expect(service.create({ name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject a duplicated type', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());

    await expect(service.create({ name: 'loft' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('should create a type', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(null);
    propertyTypesRepository.create.mockReturnValue({ name: 'loft' });
    propertyTypesRepository.save.mockResolvedValue(buildType());

    const result = await service.create({ name: 'loft' });

    expect(result.id).toBe(5);
  });

  it('should rename a type', async () => {
    propertyTypesRepository.findOneBy
      .mockResolvedValueOnce(buildType())
      .mockResolvedValueOnce(null);
    propertyTypesRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(5, { name: 'penthouse' });

    expect(result.name).toBe('penthouse');
  });

  it('should reject an empty name when updating', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());

    await expect(service.update(5, { name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject a duplicated name when updating', async () => {
    propertyTypesRepository.findOneBy
      .mockResolvedValueOnce(buildType())
      .mockResolvedValueOnce({ id: 1, name: 'casa' });

    await expect(service.update(5, { name: 'casa' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('should delete a type', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());
    propertyTypesRepository.remove.mockResolvedValue({});

    const result = await service.remove(5);

    expect(result).toEqual({ message: 'Tipo de propiedad eliminado' });
  });

  it('should not delete a type used by properties', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());
    propertyTypesRepository.remove.mockRejectedValue({
      driverError: { code: '23503' },
    });

    await expect(service.remove(5)).rejects.toThrow(ConflictException);
  });

  it('should rethrow unexpected errors when deleting', async () => {
    propertyTypesRepository.findOneBy.mockResolvedValue(buildType());
    propertyTypesRepository.remove.mockRejectedValue(new Error('fallo'));

    await expect(service.remove(5)).rejects.toThrow('fallo');
  });
});