
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmenitiesService } from './amenities.service.js';
import { Amenity } from './amenity.entity.js';

describe('AmenitiesService', () => {
  let service: AmenitiesService;

  const amenityRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmenitiesService,
        {
          provide: getRepositoryToken(Amenity),
          useValue: amenityRepository,
        },
      ],
    }).compile();

    service = module.get<AmenitiesService>(AmenitiesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear una amenidad correctamente', async () => {
      const dto = { name: 'Piscina' };
      const amenity = { id: 1, name: 'Piscina' };

      amenityRepository.create.mockReturnValue(amenity);
      amenityRepository.save.mockResolvedValue(amenity);

      await expect(service.create(dto)).resolves.toEqual(amenity);
      expect(amenityRepository.create).toHaveBeenCalledWith(dto);
      expect(amenityRepository.save).toHaveBeenCalledWith(amenity);
    });

    it('debe lanzar BadRequestException si falta el nombre', () => {
      expect(() => service.create({ name: '' })).toThrow(
        BadRequestException,
      );

      expect(amenityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe devolver todas las amenidades', async () => {
      const amenities = [
        { id: 1, name: 'Piscina' },
        { id: 2, name: 'Gimnasio' },
      ];

      amenityRepository.find.mockResolvedValue(amenities);

      await expect(service.findAll()).resolves.toEqual(amenities);
      expect(amenityRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe devolver una amenidad por su ID', async () => {
      const amenity = { id: 1, name: 'Piscina' };

      amenityRepository.findOneBy.mockResolvedValue(amenity);

      await expect(service.findOne(1)).resolves.toEqual(amenity);
      expect(amenityRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      amenityRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una amenidad existente', async () => {
      const amenity = { id: 1, name: 'Piscina' };
      const updatedAmenity = { id: 1, name: 'Piscina climatizada' };

      amenityRepository.findOneBy.mockResolvedValue(amenity);
      amenityRepository.save.mockImplementation(async (value) => value);

      await expect(
        service.update(1, { name: 'Piscina climatizada' }),
      ).resolves.toEqual(updatedAmenity);

      expect(amenityRepository.save).toHaveBeenCalledWith(updatedAmenity);
    });

    it('debe fallar si se actualiza una amenidad inexistente', async () => {
      amenityRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Nueva amenidad' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debe eliminar una amenidad existente', async () => {
      const amenity = { id: 1, name: 'Piscina' };

      amenityRepository.findOneBy.mockResolvedValue(amenity);
      amenityRepository.remove.mockResolvedValue(amenity);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Amenity eliminado',
      });

      expect(amenityRepository.remove).toHaveBeenCalledWith(amenity);
    });

    it('debe fallar si se elimina una amenidad inexistente', async () => {
      amenityRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        NotFoundException,
      );

      expect(amenityRepository.remove).not.toHaveBeenCalled();
    });
  });
});
