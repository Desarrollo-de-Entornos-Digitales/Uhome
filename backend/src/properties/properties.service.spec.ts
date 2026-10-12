import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service.js';
import { Property } from './property.entity.js';
import { PropertyType } from '../property-types/property-type.entity.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

describe('PropertiesService', () => {
  let service: PropertiesService;

  const propertyRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const propertyTypeRepository = {
    findOneBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: propertyRepository,
        },
        {
          provide: getRepositoryToken(PropertyType),
          useValue: propertyTypeRepository,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear una propiedad correctamente', async () => {
      const dto = {
        propertyTypeId: 1,
      } as CreatePropertyDto;

      const propertyType = { id: 1 };
      const property = { id: 10, propertyTypeId: 1 };

      propertyTypeRepository.findOneBy.mockResolvedValue(propertyType);
      propertyRepository.create.mockReturnValue(property);
      propertyRepository.save.mockResolvedValue(property);
      propertyRepository.findOne.mockResolvedValue(property);

      await expect(service.create(dto)).resolves.toEqual(property);

      expect(propertyRepository.create).toHaveBeenCalledWith(dto);
      expect(propertyRepository.save).toHaveBeenCalledWith(property);
      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: { amenities: true, propertyType: true },
      });
    });

    it('debe fallar si no se envía propertyTypeId', async () => {
      await expect(
        service.create({} as CreatePropertyDto),
      ).rejects.toThrow(BadRequestException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('debe fallar si la latitud está fuera del rango permitido', async () => {
      await expect(
        service.create({
          propertyTypeId: 1,
          latitude: 100,
        } as CreatePropertyDto),
      ).rejects.toThrow(BadRequestException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('debe fallar si la longitud está fuera del rango permitido', async () => {
      await expect(
        service.create({
          propertyTypeId: 1,
          longitude: 200,
        } as CreatePropertyDto),
      ).rejects.toThrow(BadRequestException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('debe fallar si el tipo de propiedad no existe', async () => {
      propertyTypeRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ propertyTypeId: 999 } as CreatePropertyDto),
      ).rejects.toThrow(NotFoundException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe devolver todas las propiedades', async () => {
      const properties = [{ id: 1 }, { id: 2 }];
      propertyRepository.find.mockResolvedValue(properties);

      await expect(service.findAll()).resolves.toEqual(properties);

      expect(propertyRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: { amenities: true, propertyType: true },
      });
    });

    it('debe aplicar filtros de distancia y precio máximo', async () => {
      propertyRepository.find.mockResolvedValue([]);

      await service.findAll({ maxDistance: 5, maxPrice: 1000000 });

      const options = propertyRepository.find.mock.calls[0][0];

      expect(options.where.distanceToCampus).toBeDefined();
      expect(options.where.price).toBeDefined();
      expect(options.relations).toEqual({
        amenities: true,
        propertyType: true,
      });
    });
  });

  describe('findOne', () => {
    it('debe devolver una propiedad por su ID', async () => {
      const property = { id: 1 };
      propertyRepository.findOne.mockResolvedValue(property);

      await expect(service.findOne(1)).resolves.toEqual(property);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { amenities: true, propertyType: true },
      });
    });

    it('debe fallar si la propiedad no existe', async () => {
      propertyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una propiedad existente', async () => {
      const property = { id: 1, title: 'Habitación' };
      const updatedProperty = {
        id: 1,
        title: 'Habitación renovada',
      };

      propertyRepository.findOneBy.mockResolvedValue(property);
      propertyRepository.save.mockResolvedValue(updatedProperty);
      propertyRepository.findOne.mockResolvedValue(updatedProperty);

      await expect(
        service.update(1, {
          title: 'Habitación renovada',
        } as UpdatePropertyDto),
      ).resolves.toEqual(updatedProperty);

      expect(propertyRepository.save).toHaveBeenCalledWith(updatedProperty);
    });

    it('debe fallar si la propiedad que se actualiza no existe', async () => {
      propertyRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(999, {} as UpdatePropertyDto),
      ).rejects.toThrow(NotFoundException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('debe rechazar una latitud fuera del rango permitido al actualizar', async () => {
      propertyRepository.findOneBy.mockResolvedValue({ id: 1 });

      await expect(
        service.update(1, {
          latitude: -100,
        } as UpdatePropertyDto),
      ).rejects.toThrow(BadRequestException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('debe rechazar un tipo de propiedad inexistente al actualizar', async () => {
      propertyRepository.findOneBy.mockResolvedValue({ id: 1 });
      propertyTypeRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(1, {
          propertyTypeId: 999,
        } as UpdatePropertyDto),
      ).rejects.toThrow(NotFoundException);

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar una propiedad existente', async () => {
      const property = { id: 1 };
      propertyRepository.findOneBy.mockResolvedValue(property);
      propertyRepository.remove.mockResolvedValue(property);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Propiedad eliminada',
      });

      expect(propertyRepository.remove).toHaveBeenCalledWith(property);
    });

    it('debe fallar si la propiedad que se elimina no existe', async () => {
      propertyRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        NotFoundException,
      );

      expect(propertyRepository.remove).not.toHaveBeenCalled();
    });
  });
});