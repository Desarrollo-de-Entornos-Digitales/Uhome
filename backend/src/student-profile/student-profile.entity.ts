import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity.js';
import { PropertyType } from '../property-types/property-type.entity.js';

@Entity()
export class StudentProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  university: string;

  @Column()
  maxBudget: number;

  @Column({ default: 1000 })
  maxDistanceToCampus: number;

  @Column()
  safetyPriority: string;

  @Column()
  nightlifePriority: string;

  @Column({ default: 'media' })
  amenitiesPriority: string;

  @Column({ default: 'equilibrado' })
  vibePreference: string;

  @Column({ type: 'int', nullable: true })
  desiredStayMonths: number | null;

  @Column({ type: 'int', nullable: true })
  preferredPropertyTypeId: number | null;

  @ManyToOne(() => PropertyType, { nullable: true })
  @JoinColumn({ name: 'preferredPropertyTypeId' })
  preferredPropertyType: PropertyType | null;

  @Column({ default: 0 })
  minBedrooms: number;

  @Column({ default: 0 })
  minBathrooms: number;

  @Column({ default: false })
  petFriendly: boolean;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
