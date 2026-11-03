import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StudentProfileService } from './student-profile.service.js';
import { StudentProfile } from './student-profile.entity.js';
import { User } from '../users/user.entity.js';

describe('StudentProfileService perfil ampliado', () => {
  let service: StudentProfileService;

  const profileRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  const usersRepository = {
    findOneBy: vi.fn(),
  };

  const baseDto = {
    university: 'Universidad de Prueba',
    maxBudget: 1000000,
    safetyPriority: 'alta',
    nightlifePriority: 'baja',
    userId: 4,
  };

  const buildProfile = () => ({
    id: 1,
    userId: 4,
    vibePreference: 'equilibrado',
    petFriendly: false,
  });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentProfileService,
        {
          provide: getRepositoryToken(StudentProfile),
          useValue: profileRepository,
        },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(StudentProfileService);
  });

  it('should return the profile of the logged user', async () => {
    profileRepository.findOne.mockResolvedValue(buildProfile());

    const result = await service.findByUserId(4);

    expect(result.userId).toBe(4);
    expect(profileRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 4 },
      relations: { preferredPropertyType: true },
    });
  });

  it('should throw when the logged user has no profile', async () => {
    profileRepository.findOne.mockResolvedValue(null);

    await expect(service.findByUserId(99)).rejects.toThrow(NotFoundException);
  });

  it('should reject an invalid amenitiesPriority', async () => {
    await expect(
      service.create({ ...baseDto, amenitiesPriority: 'mucha' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject an invalid vibePreference', async () => {
    await expect(
      service.create({ ...baseDto, vibePreference: 'fiestero' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a desired stay below one month', async () => {
    await expect(
      service.create({ ...baseDto, desiredStayMonths: 0 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject negative minimum bedrooms', async () => {
    await expect(
      service.create({ ...baseDto, minBedrooms: -1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create a profile with the new fields', async () => {
    const dto = {
      ...baseDto,
      amenitiesPriority: 'alta',
      vibePreference: 'tranquilo',
      desiredStayMonths: 6,
      minBedrooms: 1,
      minBathrooms: 1,
      petFriendly: true,
    };

    usersRepository.findOneBy.mockResolvedValue({ id: 4 });
    profileRepository.findOneBy.mockResolvedValue(null);
    profileRepository.create.mockReturnValue({ id: 1, ...dto });
    profileRepository.save.mockImplementation(async (value: unknown) => value);

    const result = await service.create(dto);

    expect(result.vibePreference).toBe('tranquilo');
    expect(result.petFriendly).toBe(true);
  });

  it('should translate a foreign key error into a 404', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 4 });
    profileRepository.findOneBy.mockResolvedValue(null);
    profileRepository.create.mockReturnValue({ id: 1, ...baseDto });
    profileRepository.save.mockRejectedValue({ code: '23503' });

    await expect(
      service.create({ ...baseDto, preferredPropertyTypeId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should rethrow unexpected errors when saving', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 4 });
    profileRepository.findOneBy.mockResolvedValue(null);
    profileRepository.create.mockReturnValue({ id: 1, ...baseDto });
    profileRepository.save.mockRejectedValue(new Error('fallo'));

    await expect(service.create(baseDto)).rejects.toThrow('fallo');
  });

  it('should update the new fields', async () => {
    profileRepository.findOneBy.mockResolvedValue(buildProfile());
    profileRepository.save.mockImplementation(async (value: unknown) => value);

    const result = await service.update(1, {
      vibePreference: 'social',
      petFriendly: true,
    });

    expect(result.vibePreference).toBe('social');
    expect(result.petFriendly).toBe(true);
  });

  it('should reject invalid values when updating', async () => {
    await expect(
      service.update(1, { vibePreference: 'fiestero' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.update(1, { amenitiesPriority: 'mucha' }),
    ).rejects.toThrow(BadRequestException);
  });
});
