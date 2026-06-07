import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { users } from '@/modules/database/schema';
import { type Database } from '@/modules/database/database.module';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { randomUUID } from 'crypto';
import type { User } from './../types/user.type';

const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

@Injectable()
export class AuthService {
  private readonly secret: Uint8Array;

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE_CONNECTION') private readonly db: Database,
  ) {
    this.secret = new TextEncoder().encode(
      this.configService.get<string>('JWT_SECRET'),
    );
  }

  async createSession(user: User) {
    // 1. Generate Access Token (30 days)
    const accessToken = await this.encrypt(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: false,
      },
      '30d',
    );

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, isGuest: false },
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return (user as User) || null;
  }

  async encrypt(payload: unknown, expiresAt: string | number | Date = '15m') {
    return await new SignJWT(payload as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setJti(randomUUID())
      .setExpirationTime(expiresAt)
      .sign(this.secret);
  }

  async decrypt(input: string): Promise<unknown> {
    const { payload } = await jwtVerify(input, this.secret, {
      algorithms: ['HS256'],
    });
    return payload;
  }

  async verifyFirebaseToken(
    idToken: string,
  ): Promise<{ email: string; name?: string }> {
    try {
      const projectId =
        this.configService.get<string>('FIREBASE_PROJECT_ID') || 'ai-article';
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      if (!payload.email || typeof payload.email !== 'string') {
        throw new UnauthorizedException(
          'Invalid Firebase ID Token payload: missing email',
        );
      }

      return {
        email: payload.email,
        name: (payload.name as string) || undefined,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Firebase token verification failed: ${(error as Error).message}`,
      );
    }
  }

  async findOrCreateFirebaseUser(email: string, name?: string): Promise<User> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return existingUser;
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        name: (name || email.split('@')[0]).slice(0, 255),
      })
      .returning();

    return newUser;
  }
}
