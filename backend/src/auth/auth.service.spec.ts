import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const buildUser = async (isActive: boolean) => ({
    id: 1,
    email: 'ana@test.com',
    password: await bcrypt.hash('123456', 10),
    fullName: 'Ana Prueba',
    username: 'ana',
    isActive,
    role: { id: 1, name: 'student' },
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
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
      service.login({ email: 'ana@test.com', password: 'incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@test.com', password: '123456' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a deactivated user', async () => {
    usersService.findByEmail.mockResolvedValue(await buildUser(false));

    await expect(
      service.login({ email: 'ana@test.com', password: '123456' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
