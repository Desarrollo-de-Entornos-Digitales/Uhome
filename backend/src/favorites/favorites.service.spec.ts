import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service.js';
import { Favorite } from './favorite.entity.js';
import { User } from '../users/user.entity.js';
import { Property } from '../properties/property.entity.js';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const favoritesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
    delete: vi.fn(),
  };

  const usersRepository = {
    findOneBy: vi.fn(),
  };

  const propertiesRepository = {
    findOneBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: favoritesRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(Property),
          useValue: propertiesRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('debe agregar una propiedad a favoritos', async () => {
      const user = { id: 1 };
      const property = { id: 2 };
      const favorite = { userId: 1, propertyId: 2 };

      usersRepository.findOneBy.mockResolvedValue(user);
      propertiesRepository.findOneBy.mockResolvedValue(property);
      favoritesRepository.findOneBy.mockResolvedValue(null);
      favoritesRepository.create.mockReturnValue(favorite);
      favoritesRepository.save.mockResolvedValue(favorite);

      await expect(service.add(1, 2)).resolves.toEqual(favorite);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(propertiesRepository.findOneBy).toHaveBeenCalledWith({ id: 2 });
      expect(favoritesRepository.create).toHaveBeenCalledWith({
        userId: 1,
        propertyId: 2,
      });
      expect(favoritesRepository.save).toHaveBeenCalledWith(favorite);
    });

    it('debe fallar si falta el usuario o la propiedad', async () => {
      await expect(service.add(0, 2)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.add(1, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.add(1, 2)).rejects.toThrow(
        NotFoundException,
      );

      expect(propertiesRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('debe fallar si la propiedad no existe', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 1 });
      propertiesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.add(1, 2)).rejects.toThrow(
        NotFoundException,
      );

      expect(favoritesRepository.save).not.toHaveBeenCalled();
    });

    it('debe fallar si la propiedad ya está en favoritos', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 1 });
      propertiesRepository.findOneBy.mockResolvedValue({ id: 2 });
      favoritesRepository.findOneBy.mockResolvedValue({
        userId: 1,
        propertyId: 2,
      });

      await expect(service.add(1, 2)).rejects.toThrow(
        ConflictException,
      );

      expect(favoritesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('debe devolver los favoritos de un usuario', async () => {
      const favorites = [
        { userId: 1, propertyId: 2 },
        { userId: 1, propertyId: 3 },
      ];

      favoritesRepository.find.mockResolvedValue(favorites);

      await expect(service.findByUser(1)).resolves.toEqual(favorites);

      expect(favoritesRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: { property: true },
      });
    });
  });

  describe('remove', () => {
    it('debe eliminar un favorito existente', async () => {
      favoritesRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(1, 2)).resolves.toEqual({
        message: 'Favorito eliminado',
      });

      expect(favoritesRepository.delete).toHaveBeenCalledWith({
        userId: 1,
        propertyId: 2,
      });
    });

    it('debe fallar si el favorito no existe', async () => {
      favoritesRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});