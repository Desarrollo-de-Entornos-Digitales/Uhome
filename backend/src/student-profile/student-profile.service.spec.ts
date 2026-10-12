import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { StudentProfileService } from './student-profile.service.js';
import { StudentProfile } from './student-profile.entity.js';
import { User } from '../users/user.entity.js';

describe('StudentProfileService', () => {
  let service: StudentProfileService;

  const mockProfileRepository = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const mockUsersRepository = {
    findOneBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentProfileService,
        {
          provide: getRepositoryToken(StudentProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<StudentProfileService>(StudentProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a profile when the user exists and has no profile', async () => {
      const dto = {
        userId: 1,
        maxDistanceToCampus: 1000,
      };

      const user = { id: 1 };
      const profile = { id: 10, ...dto };

      mockUsersRepository.findOneBy.mockResolvedValue(user);
      mockProfileRepository.findOneBy.mockResolvedValue(null);
      mockProfileRepository.create.mockReturnValue(profile);
      mockProfileRepository.save.mockResolvedValue(profile);

      const result = await service.create(dto as any);

      expect(result).toEqual(profile);
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
      expect(mockProfileRepository.findOneBy).toHaveBeenCalledWith({
        userId: 1,
      });
      expect(mockProfileRepository.save).toHaveBeenCalledWith(profile);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUsersRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when distance is zero', async () => {
      await expect(
        service.create({
          userId: 1,
          maxDistanceToCampus: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when distance is negative', async () => {
      await expect(
        service.create({
          userId: 1,
          maxDistanceToCampus: -10,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ userId: 99 } as any),
      ).rejects.toThrow(NotFoundException);

      expect(mockProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the user already has a profile', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue({ id: 1 });
      mockProfileRepository.findOneBy.mockResolvedValue({
        id: 10,
        userId: 1,
      });

      await expect(
        service.create({ userId: 1 } as any),
      ).rejects.toThrow(ConflictException);

      expect(mockProfileRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all profiles', async () => {
      const profiles = [
        { id: 1, userId: 1 },
        { id: 2, userId: 2 },
      ];

      mockProfileRepository.find.mockResolvedValue(profiles);

      await expect(service.findAll()).resolves.toEqual(profiles);
      expect(mockProfileRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no profiles exist', async () => {
      mockProfileRepository.find.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      const profile = { id: 1, userId: 2 };

      mockProfileRepository.findOneBy.mockResolvedValue(profile);

      await expect(service.findOne(1)).resolves.toEqual(profile);
      expect(mockProfileRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
    });

    it('should throw NotFoundException when the profile does not exist', async () => {
      mockProfileRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and save an existing profile', async () => {
      const profile = {
        id: 1,
        userId: 2,
        maxDistanceToCampus: 500,
      };

      mockProfileRepository.findOneBy.mockResolvedValue(profile);
      mockProfileRepository.save.mockImplementation(
        async (value) => value,
      );

      const result = await service.update(1, {
        maxDistanceToCampus: 1500,
      } as any);

      expect(result.maxDistanceToCampus).toBe(1500);
      expect(result.id).toBe(1);
      expect(mockProfileRepository.save).toHaveBeenCalledWith(profile);
    });

    it('should throw BadRequestException when updated distance is zero', async () => {
      await expect(
        service.update(1, { maxDistanceToCampus: 0 } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a missing profile', async () => {
      mockProfileRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(99, { maxDistanceToCampus: 1000 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing profile', async () => {
      const profile = { id: 1, userId: 2 };

      mockProfileRepository.findOneBy.mockResolvedValue(profile);
      mockProfileRepository.remove.mockResolvedValue(profile);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Perfil eliminado',
      });

      expect(mockProfileRepository.remove).toHaveBeenCalledWith(profile);
    });

    it('should throw NotFoundException when removing a missing profile', async () => {
      mockProfileRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockProfileRepository.remove).not.toHaveBeenCalled();
    });
  });
});