import { vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { EmailService } from './email.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: vi.fn(),
    setPasswordResetToken: vi.fn(),
    findByPasswordResetTokenHash: vi.fn(),
    resetPassword: vi.fn(),
  };

  const jwtService = {
    signAsync: vi.fn(),
  };

  const emailService = {
    sendPasswordResetEmail: vi.fn(),
  };

  const buildUser = async (isActive: boolean) => ({
    id: 1,
    email: 'ana@test.com',
    password: await bcrypt.hash('123456', 10),
    fullName: 'Ana Prueba',
    username: 'ana',
    isActive,
    role: { id: 1, name: 'student' },
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login a valid user and return a token with the role', async () => {
    usersService.findByEmail.mockResolvedValue(await buildUser(true));
    jwtService.signAsync.mockResolvedValue('test-token');

    const result = await service.login({
      email: 'ana@test.com',
      password: '123456',
    });

    expect(result.access_token).toBe('test-token');
    expect(result.user.role).toBe('student');
  });

  it('should reject a wrong password', async () => {
    usersService.findByEmail.mockResolvedValue(await buildUser(true));

    await expect(
      service.login({
        email: 'ana@test.com',
        password: 'incorrecta',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'nadie@test.com',
        password: '123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a deactivated user', async () => {
    usersService.findByEmail.mockResolvedValue(await buildUser(false));

    await expect(
      service.login({
        email: 'ana@test.com',
        password: '123456',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create a password reset token for an existing user', async () => {
    const user = await buildUser(true);

    usersService.findByEmail.mockResolvedValue(user);
    usersService.setPasswordResetToken.mockResolvedValue(undefined);
    emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const result = await service.forgotPassword({
      email: 'ana@test.com',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('ana@test.com');

    expect(usersService.setPasswordResetToken).toHaveBeenCalledTimes(1);

    expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
  user.email,
  user.fullName,
  expect.any(String),
);

    expect(result).toBeDefined();
  });

  it('should return a generic response when forgot password email does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword({
      email: 'nadie@test.com',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('nadie@test.com');

    expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();

    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();

    expect(result).toBeDefined();
  });

  it('should reset the password with a valid token', async () => {
    const user = {
      ...(await buildUser(true)),
      passwordResetTokenHash: 'stored-token-hash',
      passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };

    usersService.findByPasswordResetTokenHash.mockResolvedValue(user);
    usersService.resetPassword.mockResolvedValue(undefined);

    const result = await service.resetPassword({
      token: 'valid-reset-token',
      password: 'nueva123',
    });

    expect(usersService.findByPasswordResetTokenHash).toHaveBeenCalledWith(
      expect.any(String),
    );

    expect(usersService.resetPassword).toHaveBeenCalledWith(
      user.id,
      'nueva123',
    );

    expect(result).toBeDefined();
  });

  it('should reject an invalid password reset token', async () => {
    usersService.findByPasswordResetTokenHash.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'invalid-token',
        password: 'nueva123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(usersService.resetPassword).not.toHaveBeenCalled();
  });

  it('should reject an expired password reset token', async () => {
    const user = {
      ...(await buildUser(true)),
      passwordResetTokenHash: 'stored-token-hash',
      passwordResetExpiresAt: new Date(Date.now() - 60 * 1000),
    };

    usersService.findByPasswordResetTokenHash.mockResolvedValue(user);

    await expect(
      service.resetPassword({
        token: 'expired-token',
        password: 'nueva123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(usersService.resetPassword).not.toHaveBeenCalled();
  });

  it('should reject a new password shorter than 6 characters', async () => {
    await expect(
      service.resetPassword({
        token: 'valid-token',
        password: '123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(usersService.findByPasswordResetTokenHash).not.toHaveBeenCalled();

    expect(usersService.resetPassword).not.toHaveBeenCalled();
  });
});