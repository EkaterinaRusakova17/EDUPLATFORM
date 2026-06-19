import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/auth/roles.guard';

describe('RolesGuard', () => {
  it('allows a user with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['teacher']),
    } as unknown as Reflector;
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: '1', role: 'teacher' } }),
      }),
    } as unknown as ExecutionContext;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });
});
