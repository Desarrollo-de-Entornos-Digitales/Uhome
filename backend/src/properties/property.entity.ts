
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Amenity } from '../amenities/amenity.entity.js';
import { PropertyType } from '../property-types/property-type.entity.js';

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  address: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column()
  price: number;

  @Column({ nullable: true })
  propertyTypeId: number;

  @ManyToOne(() => PropertyType, { nullable: true })
  @JoinColumn({ name: 'propertyTypeId' })
  propertyType: PropertyType;

  @Column()
  distanceToCampus: number;

  @Column()
  available: boolean;

  @Column({ type: 'simple-array', nullable: true })
  characteristics: string[];

  @Column({ type: 'text', nullable: true })
  contractConditions: string;

  @ManyToMany(() => Amenity)
  @JoinTable()
  amenities: Amenity[];
}
