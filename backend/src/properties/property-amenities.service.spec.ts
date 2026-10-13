import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { PropertyAmenitiesService } from './property-amenities.service.js';
import { Property } from './property.entity.js';
import { Amenity } from '../amenities/amenity.entity.js';

describe('PropertyAmenitiesService', () => {
  let service: PropertyAmenitiesService;

  const propertyRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  };

  const amenityRepository = {
    findOneBy: vi.fn(),
    find: vi.fn(),
  };

  const wifi = { id: 1, name: 'WiFi' };
  const pool = { id: 2, name: 'Piscina' };

  const buildProperty = () => ({ id: 1, name: 'Apto', amenities: [{ ...wifi }] });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PropertyAmenitiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: propertyRepository,
        },
        {
          provide: getRepositoryToken(Amenity),
          useValue: amenityRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PropertyAmenitiesService);
  });

  it('should list the amenities of a property', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());

    const result = await service.findAll(1);

    expect(result).toEqual([wifi]);
  });

  it('should throw when the property does not exist', async () => {
    propertyRepository.findOne.mockResolvedValue(null);

    await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
  });

  it('should add an amenity to a property', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    amenityRepository.findOneBy.mockResolvedValue(pool);
    propertyRepository.save.mockResolvedValue({});

    const result = await service.add(1, 2);

    expect(result).toHaveLength(2);
    expect(propertyRepository.save).toHaveBeenCalled();
  });

  it('should throw when the amenity to add does not exist', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    amenityRepository.findOneBy.mockResolvedValue(null);

    await expect(service.add(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('should reject an amenity that the property already has', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    amenityRepository.findOneBy.mockResolvedValue(wifi);

    await expect(service.add(1, 1)).rejects.toThrow(ConflictException);
  });

  it('should remove an amenity from a property', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    propertyRepository.save.mockResolvedValue({});

    const result = await service.remove(1, 1);

    expect(propertyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ amenities: [] }),
    );
    expect(result).toEqual({ message: 'Amenity quitado de la propiedad' });
  });

  it('should throw when removing an amenity the property does not have', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());

    await expect(service.remove(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('should replace all the amenities of a property', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    amenityRepository.find.mockResolvedValue([wifi, pool]);
    propertyRepository.save.mockResolvedValue({});

    const result = await service.setAll(1, [1, 2, 2]);

    expect(result).toEqual([wifi, pool]);
  });

  it('should clear the amenities with an empty list', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    propertyRepository.save.mockResolvedValue({});

    const result = await service.setAll(1, []);

    expect(amenityRepository.find).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should reject amenityIds that is not a list', async () => {
    await expect(
      service.setAll(1, 'x' as unknown as number[]),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject amenities that do not exist', async () => {
    propertyRepository.findOne.mockResolvedValue(buildProperty());
    amenityRepository.find.mockResolvedValue([wifi]);

    await expect(service.setAll(1, [1, 999])).rejects.toThrow(
      NotFoundException,
    );
  });
});