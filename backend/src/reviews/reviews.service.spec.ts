import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { Review } from './review.entity.js';
import { Property } from '../properties/property.entity.js';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const reviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const propertyRepository = {
    findOneBy: jest.fn(),
  };

  const student = { userId: 1, email: 'ana@test.com', role: 'student' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewRepository },
        {
          provide: getRepositoryToken(Property),
          useValue: propertyRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all reviews', async () => {
    reviewRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
    expect(reviewRepository.find).toHaveBeenCalled();
  });

  it('should create a review without exposing the user password', async () => {
    const saved = { id: 1, rating: 5, comment: 'Excelente', userId: 1 };

    propertyRepository.findOneBy.mockResolvedValue({ id: 1 });
    reviewRepository.create.mockReturnValue(saved);
    reviewRepository.save.mockResolvedValue(saved);
    reviewRepository.findOne.mockResolvedValue({
      ...saved,
      propertyId: 1,
      user: { id: 1, username: 'ana', fullName: 'Ana', password: 'hash' },
      property: { id: 1 },
    });

    const result = await service.create(
      { rating: 5, comment: 'Excelente', propertyId: 1 },
      1,
    );

    expect(result.rating).toBe(5);
    expect(result.user).not.toHaveProperty('password');
  });

  it('should reject a rating outside 1 to 5', async () => {
    await expect(
      service.create({ rating: 9, comment: 'Mal', propertyId: 1 }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a review for a property that does not exist', async () => {
    propertyRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ rating: 4, comment: 'Bien', propertyId: 999 }, 1),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not let another user edit a review', async () => {
    reviewRepository.findOneBy.mockResolvedValue({ id: 1, userId: 2 });

    await expect(service.update(1, { rating: 3 }, student)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
