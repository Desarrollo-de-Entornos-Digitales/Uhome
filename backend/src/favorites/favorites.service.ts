import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity.js';
import { User } from '../users/user.entity.js';
import { Property } from '../properties/property.entity.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  async add(userId: number, propertyId: number) {
    if (!userId || !propertyId) {
      throw new BadRequestException('Debes enviar userId y propertyId');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const property = await this.propertiesRepository.findOneBy({
      id: propertyId,
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const exists = await this.favoritesRepository.findOneBy({
      userId,
      propertyId,
    });
    if (exists) {
      throw new ConflictException('Esta propiedad ya está en favoritos');
    }

    const favorite = this.favoritesRepository.create({ userId, propertyId });
    return this.favoritesRepository.save(favorite);
  }

  findAll() {
    return this.favoritesRepository.find({ relations: { property: true } });
  }

  findByUser(userId: number) {
    return this.favoritesRepository.find({
      where: { userId },
      relations: { property: true },
    });
  }

  async findOne(id: number) {
    const favorite = await this.favoritesRepository.findOne({
      where: { id },
      relations: { property: true },
    });

    if (!favorite) {
      throw new NotFoundException(`Favorito con id ${id} no encontrado`);
    }

    return favorite;
  }

  async update(id: number, propertyId: number) {
    if (!propertyId) {
      throw new BadRequestException('Debes enviar propertyId');
    }

    const favorite = await this.favoritesRepository.findOneBy({ id });
    if (!favorite) {
      throw new NotFoundException(`Favorito con id ${id} no encontrado`);
    }

    const property = await this.propertiesRepository.findOneBy({
      id: propertyId,
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const exists = await this.favoritesRepository.findOneBy({
      userId: favorite.userId,
      propertyId,
    });
    if (exists && exists.id !== id) {
      throw new ConflictException('Esta propiedad ya está en favoritos');
    }

    favorite.propertyId = propertyId;
    await this.favoritesRepository.save(favorite);

    return this.findOne(id);
  }

  async remove(userId: number, propertyId: number) {
    const result = await this.favoritesRepository.delete({
      userId,
      propertyId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Ese favorito no existe');
    }

    return { message: 'Favorito eliminado' };
  }
}