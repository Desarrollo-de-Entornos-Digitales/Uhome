import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { FavoritesService } from './favorites.service.js';
import { Favorite } from './favorite.entity.js';
import { User } from '../users/user.entity.js';
import { Property } from '../properties/property.entity.js';

describe('FavoritesService CRUD', () => {
  let service: FavoritesService;

  const favoritesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    delete: vi.fn(),
  };

  const usersRepository = { findOneBy: vi.fn() };
  const propertiesRepository = { findOneBy: vi.fn() };

  const buildFavorite = () => ({ id: 1, userId: 4, propertyId: 1 });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: favoritesRepository,
        },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(Property),
          useValue: propertiesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(FavoritesService);
  });

  it('should return all favorites', async () => {
    favoritesRepository.find.mockResolvedValue([buildFavorite()]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(favoritesRepository.find).toHaveBeenCalledWith({
      relations: { property: true },
    });
  });

  it('should return a favorite by id', async () => {
    favoritesRepository.findOne.mockResolvedValue(buildFavorite());

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
  });

  it('should throw when the favorite does not exist', async () => {
    favoritesRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should reject an update without propertyId', async () => {
    await expect(service.update(1, 0)).rejects.toThrow(BadRequestException);
  });

  it('should throw when updating a favorite that does not exist', async () => {
    favoritesRepository.findOneBy.mockResolvedValue(null);

    await expect(service.update(999, 2)).rejects.toThrow(NotFoundException);
  });

  it('should throw when the new property does not exist', async () => {
    favoritesRepository.findOneBy.mockResolvedValue(buildFavorite());
    propertiesRepository.findOneBy.mockResolvedValue(null);

    await expect(service.update(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('should reject a property that is already a favorite', async () => {
    favoritesRepository.findOneBy
      .mockResolvedValueOnce(buildFavorite())
      .mockResolvedValueOnce({ id: 2, userId: 4, propertyId: 2 });
    propertiesRepository.findOneBy.mockResolvedValue({ id: 2 });

    await expect(service.update(1, 2)).rejects.toThrow(ConflictException);
  });

  it('should change the property of a favorite', async () => {
    favoritesRepository.findOneBy
      .mockResolvedValueOnce(buildFavorite())
      .mockResolvedValueOnce(null);
    propertiesRepository.findOneBy.mockResolvedValue({ id: 2 });
    favoritesRepository.save.mockResolvedValue({});
    favoritesRepository.findOne.mockResolvedValue({
      id: 1,
      userId: 4,
      propertyId: 2,
    });

    const result = await service.update(1, 2);

    expect(favoritesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 2 }),
    );
    expect(result.propertyId).toBe(2);
  });
});