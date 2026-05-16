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

describe('PATCH /api/admin/bookings/[id]/admin-case', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminMock.mockResolvedValue({ uid: 'admin_1', idToken: 'token' });
    adminAuthErrorResponseMock.mockReturnValue(null);
    callAdminCallableMock.mockResolvedValue({ bookingId: 'bk_1', status: 'cancelled_by_admin' });
  });

  it('proxies booking case mutation', async () => {
    const { PATCH } = await import('../route');
    const response = await PATCH(
      new Request('https://example.com/api/admin/bookings/bk_1/admin-case', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'ops' }),
      }),
      { params: Promise.resolve({ id: 'bk_1' }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('cancelled_by_admin');
    expect(callAdminCallableMock).toHaveBeenCalledWith(
      'adminUpdateBookingCase',
      expect.objectContaining({ bookingId: 'bk_1', action: 'cancel', reason: 'ops' }),
      expect.any(String),
      'token'
    );
  });
});
