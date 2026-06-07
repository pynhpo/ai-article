import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import type { SessionUser, RequestWithSession } from '../types/user.type';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: RequestWithSession, res: Response, next: NextFunction) {
    // CORS preflight requests, it does not contain cookies
    if (req.method === 'OPTIONS') {
      return next();
    }

    let sessionToken = req.cookies['session'] as string | undefined;

    if (sessionToken) {
      try {
        const payload = (await this.authService.decrypt(
          sessionToken,
        )) as SessionUser;
        if (payload && payload.id) {
          req.session = payload;
        }
      } catch {
        // Session token was invalid or expired, clear it
        sessionToken = undefined;
      }
    }

    if (!req.session) {
      const guestId = randomUUID();
      const guestSession: SessionUser = {
        id: guestId,
        email: `guest_${guestId.substring(0, 8)}@ai-article.local`,
        name: 'Guest',
        isGuest: true,
      };

      const token = await this.authService.encrypt(guestSession, '30d');

      res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // CSRF (Cross-Site Request Forgery)
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/', // all requests to the server will have this cookie
      });

      req.session = guestSession;
    }

    next();
  }
}
