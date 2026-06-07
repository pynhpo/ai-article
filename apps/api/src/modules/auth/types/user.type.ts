import { Request } from 'express';
import { users } from '@/modules/database/schema';

export type User = typeof users.$inferSelect;

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  isGuest?: boolean;
}

export type RequestWithSession = Request & { session: SessionUser };

export type DecodedRefreshToken = {
  id: string;
};
