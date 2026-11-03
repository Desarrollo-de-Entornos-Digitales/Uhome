import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Role } from '../roles/role.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column()
  username: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  roleId: number;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  passwordResetTokenHash: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  passwordResetExpiresAt: Date | null;
}