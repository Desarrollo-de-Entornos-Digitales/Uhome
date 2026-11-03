import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY no está configurada',
      );
    }

    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetToken: string,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL ??
      'http://localhost:3000';

    const from =
      process.env.EMAIL_FROM ??
      'UHome <onboarding@resend.dev>';

    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const { error } =
      await this.resend.emails.send({
        from,
        to: email,
        subject: 'Reset your UHome password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h1 style="color: #ff2d25;">
              Reset your password
            </h1>

            <p>Hi ${fullName},</p>

            <p>
              We received a request to reset the password for your UHome account.
            </p>

            <p style="margin: 32px 0;">
              <a
                href="${resetUrl}"
                style="
                  background: #ff2d25;
                  color: white;
                  padding: 12px 24px;
                  border-radius: 999px;
                  text-decoration: none;
                  font-weight: 600;
                "
              >
                Reset password
              </a>
            </p>

            <p>
              This link expires in 30 minutes.
            </p>

            <p>
              If you did not request a password reset, you can ignore this email.
            </p>

            <p>UHome</p>
          </div>
        `,
      });

    if (error) {
      throw new InternalServerErrorException(
        'No fue posible enviar el correo de recuperación',
      );
    }
  }
}