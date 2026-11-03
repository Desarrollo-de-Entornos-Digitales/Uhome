import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { EmailService } from './email.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException(
        'Debes enviar email y password',
      );
    }

    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const validPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!validPassword) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada',
      );
    }

    const role = user.role?.name;

    const payload = {
      sub: user.id,
      email: user.email,
      role,
    };

    return {
      access_token:
        await this.jwtService.signAsync(payload),

      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role,
      },
    };
  }

  logout() {
    return {
      message:
        'Sesión cerrada. Elimina el token en el cliente.',
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    const email =
      forgotPasswordDto.email?.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException(
        'Debes enviar un correo electrónico',
      );
    }

    const user =
      await this.usersService.findByEmail(email);

    const responseMessage =
      'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.';

    if (!user) {
      return {
        message: responseMessage,
      };
    }

    const resetToken =
      randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken,
    );

    return {
      message: responseMessage,
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ) {
    const {
      token,
      password,
    } = resetPasswordDto;

    if (!token || !password) {
      throw new BadRequestException(
        'Debes enviar token y nueva contraseña',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 6 caracteres',
      );
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const user =
      await this.usersService
        .findByPasswordResetTokenHash(
          tokenHash,
        );

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <
        Date.now()
    ) {
      throw new BadRequestException(
        'El enlace de recuperación es inválido o ha expirado',
      );
    }

    await this.usersService.resetPassword(
      user.id,
      password,
    );

    return {
      message:
        'Contraseña actualizada correctamente',
    };
  }
}