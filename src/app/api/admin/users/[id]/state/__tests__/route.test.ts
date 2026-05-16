import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const adminAuthErrorResponseMock = vi.fn();
const callAdminCallableMock = vi.fn();
const captureServerExceptionMock = vi.fn();

vi.mock('@/lib/adminAuth', () => ({
  requireAdmin: requireAdminMock,
  adminAuthErrorResponse: adminAuthErrorResponseMock,
}));

vi.mock('@/lib/adminCallables', () => ({
  AdminCallableError: class AdminCallableError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  callAdminCallable: callAdminCallableMock,
}));

vi.mock('@/lib/sentryServer', () => ({ captureServerException: captureServerExceptionMock }));

describe('PATCH /api/admin/users/[id]/state', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminMock.mockResolvedValue({ uid: 'admin_1', idToken: 'token' });
    adminAuthErrorResponseMock.mockReturnValue(null);
    callAdminCallableMock.mockResolvedValue({ userId: 'user_1', accountStatus: 'disabled' });
  });

  it('proxies user state mutation', async () => {
    const { PATCH } = await import('../route');
    const response = await PATCH(
      new Request('https://example.com/api/admin/users/user_1/state', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'disable', reason: 'spam' }),
      }),
      { params: Promise.resolve({ id: 'user_1' }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.accountStatus).toBe('disabled');
    expect(callAdminCallableMock).toHaveBeenCalledWith(
      'adminUpdateUserState',
      expect.objectContaining({ userId: 'user_1', action: 'disable', reason: 'spam' }),
      expect.any(String),
      'token'
    );
  });
});
