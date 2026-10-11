import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity.js';
import { Property } from '../properties/property.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import type { AuthUser } from '../auth/auth-request.interface.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  private validateRating(rating: number) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(
        'El rating debe ser un número entero entre 1 y 5',
      );
    }
  }

  private cleanReview(review: Review) {
    const { user, ...rest } = review;

    return {
      ...rest,
      user: user
        ? { id: user.id, username: user.username, fullName: user.fullName }
        : null,
    };
  }

  private async findEntity(id: number) {
    const review = await this.reviewRepository.findOneBy({ id });

    if (!review) {
      throw new NotFoundException(`Review con id ${id} no encontrada`);
    }

    return review;
  }

  private checkOwnerOrAdmin(review: Review, currentUser: AuthUser) {
    if (
      currentUser.role !== RoleName.ADMIN &&
      review.userId !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede modificar esta review',
      );
    }
  }

  async create(createReviewDto: CreateReviewDto, userId: number) {
    if (!createReviewDto.propertyId) {
      throw new BadRequestException('Debes enviar propertyId');
    }

    if (!createReviewDto.comment) {
      throw new BadRequestException('Debes enviar comment');
    }

    this.validateRating(createReviewDto.rating);

    const property = await this.propertyRepository.findOneBy({
      id: createReviewDto.propertyId,
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const review = this.reviewRepository.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      propertyId: createReviewDto.propertyId,
      userId,
    });
    const saved = await this.reviewRepository.save(review);

    return this.findOne(saved.id);
  }

  async findAll(propertyId?: number) {
    const reviews = await this.reviewRepository.find({
      where: propertyId !== undefined ? { propertyId } : {},
      relations: { user: true, property: true },
    });

    return reviews.map((review) => this.cleanReview(review));
  }

  async findOne(id: number) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: { user: true, property: true },
    });

    if (!review) {
      throw new NotFoundException(`Review con id ${id} no encontrada`);
    }

    return this.cleanReview(review);
  }

  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    currentUser: AuthUser,
  ) {
    const review = await this.findEntity(id);

    this.checkOwnerOrAdmin(review, currentUser);

    if (updateReviewDto.rating !== undefined) {
      this.validateRating(updateReviewDto.rating);
      review.rating = updateReviewDto.rating;
    }

    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    await this.reviewRepository.save(review);

    return this.findOne(id);
  }

  async remove(id: number, currentUser: AuthUser) {
    const review = await this.findEntity(id);

    this.checkOwnerOrAdmin(review, currentUser);

    await this.reviewRepository.remove(review);

    return { message: 'Review eliminada' };
  }
}
