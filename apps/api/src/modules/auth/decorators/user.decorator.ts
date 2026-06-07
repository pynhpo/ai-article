import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser, RequestWithSession } from '../types/user.type';

export const User = createParamDecorator(
  (data: keyof SessionUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    const user = request.session;

    return data ? user?.[data] : user;
  },
);
