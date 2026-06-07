import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { FirebaseLoginDto } from './../dto';
import { type RequestWithSession } from './../types/user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: FirebaseLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { idToken } = body;

    const firebaseUser = await this.authService.verifyFirebaseToken(idToken);
    const user = await this.authService.findOrCreateFirebaseUser(
      firebaseUser.email,
      firebaseUser.name,
    );

    const result = await this.authService.createSession(user);

    res.cookie('session', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CSRF (Cross-Site Request Forgery)
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/', // all requests to the server will have this cookie
    });

    return { success: true, user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('session');
    return { success: true };
  }

  @Public()
  @Get('profile')
  async getProfile(@Req() req: RequestWithSession) {
    if (!req.session) {
      throw new UnauthorizedException('No active session');
    }

    if (req.session.isGuest) {
      return {
        id: req.session.id,
        email: req.session.email,
        username: req.session.name, // Support username for frontend compatibility
        isGuest: true,
      };
    }

    const user = await this.authService.getUserById(req.session.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.name, // Support username mapping
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isGuest: false,
    };
  }
}
