import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VibeAnalysisService } from './vibe-analysis.service.js';
import { VibeAnalysis } from './vibe-analysis.entity.js';
import { Property } from '../properties/property.entity.js';

describe('VibeAnalysisService', () => {
  let service: VibeAnalysisService;

  const mockVibeRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const mockPropertyRepository = {
    findOneBy: vi.fn(),
  };

  const validScores = {
    studentDensity: 3,
    nightlife: 4,
    studySpots: 5,
    quietness: 2,
    essentialSpots: 4,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VibeAnalysisService,
        {
          provide: getRepositoryToken(VibeAnalysis),
          useValue: mockVibeRepository,
        },
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
      ],
    }).compile();

    service = module.get<VibeAnalysisService>(VibeAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an analysis with valid scores', async () => {
      const dto = { propertyId: 1, ...validScores };
      const property = { id: 1 };
      const analysis = { id: 10, ...dto, source: 'manual' };

      mockPropertyRepository.findOneBy.mockResolvedValue(property);
      mockVibeRepository.findOneBy.mockResolvedValue(null);
      mockVibeRepository.create.mockReturnValue(analysis);
      mockVibeRepository.save.mockResolvedValue(analysis);

      const result = await service.create(dto as any);

      expect(result).toEqual(analysis);
      expect(mockVibeRepository.create).toHaveBeenCalledWith({
        ...dto,
        source: 'manual',
      });
      expect(mockVibeRepository.save).toHaveBeenCalledWith(analysis);
    });

    it('should reject a missing propertyId', async () => {
      await expect(
        service.create({ ...validScores } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it.each([
      'studentDensity',
      'nightlife',
      'studySpots',
      'quietness',
      'essentialSpots',
    ])('should reject a missing score: %s', async (field) => {
      const dto: Record<string, unknown> = {
        propertyId: 1,
        ...validScores,
      };
      delete dto[field];

      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it.each([
      ['studentDensity', 0],
      ['nightlife', 6],
      ['studySpots', 2.5],
      ['quietness', -1],
      ['essentialSpots', 0],
    ])('should reject invalid score %s=%s', async (field, value) => {
      await expect(
        service.create({
          propertyId: 1,
          ...validScores,
          [field]: value,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a score that is not a number', async () => {
      await expect(
        service.create({
          propertyId: 1,
          ...validScores,
          nightlife: 'high',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the property does not exist', async () => {
      mockPropertyRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ propertyId: 99, ...validScores } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when the property already has an analysis', async () => {
      mockPropertyRepository.findOneBy.mockResolvedValue({ id: 1 });
      mockVibeRepository.findOneBy.mockResolvedValue({
        id: 10,
        propertyId: 1,
      });

      await expect(
        service.create({ propertyId: 1, ...validScores } as any),
      ).rejects.toThrow(ConflictException);

      expect(mockVibeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all analyses with their properties', async () => {
      const analyses = [{ id: 1, property: { id: 2 } }];
      mockVibeRepository.find.mockResolvedValue(analyses);

      await expect(service.findAll()).resolves.toEqual(analyses);
      expect(mockVibeRepository.find).toHaveBeenCalledWith({
        relations: { property: true },
      });
    });

    it('should return an empty array when no analyses exist', async () => {
      mockVibeRepository.find.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an analysis with its property', async () => {
      const analysis = { id: 1, property: { id: 2 } };
      mockVibeRepository.findOne.mockResolvedValue(analysis);

      await expect(service.findOne(1)).resolves.toEqual(analysis);
      expect(mockVibeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { property: true },
      });
    });

    it('should throw NotFoundException when the analysis does not exist', async () => {
      mockVibeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an analysis and return it with its property', async () => {
      const analysis = { id: 1, ...validScores };
      const updatedAnalysis = {
        ...analysis,
        nightlife: 5,
        property: { id: 2 },
      };

      mockVibeRepository.findOneBy.mockResolvedValue(analysis);
      mockVibeRepository.save.mockImplementation(async (value) => value);
      mockVibeRepository.findOne.mockResolvedValue(updatedAnalysis);

      const result = await service.update(1, { nightlife: 5 } as any);

      expect(mockVibeRepository.save).toHaveBeenCalledWith({
        ...analysis,
        nightlife: 5,
        id: 1,
      });
      expect(result).toEqual(updatedAnalysis);
    });

    it('should reject an invalid score when updating', async () => {
      await expect(
        service.update(1, { quietness: 7 } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockVibeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a missing analysis', async () => {
      mockVibeRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(99, { nightlife: 5 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing analysis', async () => {
      const analysis = { id: 1 };
      mockVibeRepository.findOneBy.mockResolvedValue(analysis);
      mockVibeRepository.remove.mockResolvedValue(analysis);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Análisis eliminado',
      });

      expect(mockVibeRepository.remove).toHaveBeenCalledWith(analysis);
    });

    it('should throw NotFoundException when removing a missing analysis', async () => {
      mockVibeRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockVibeRepository.remove).not.toHaveBeenCalled();
    });
  });
});