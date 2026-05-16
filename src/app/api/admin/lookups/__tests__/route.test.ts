import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminOrSupportMock = vi.fn();
const adminAuthErrorResponseMock = vi.fn();
const callAdminCallableMock = vi.fn();
const captureServerExceptionMock = vi.fn();

vi.mock('@/lib/adminAuth', () => ({
  requireAdminOrSupport: requireAdminOrSupportMock,
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

describe('GET /api/admin/lookups', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminOrSupportMock.mockResolvedValue({ uid: 'admin_1', idToken: 'token' });
    adminAuthErrorResponseMock.mockReturnValue(null);
    callAdminCallableMock.mockResolvedValue({
      items: [{ id: 'user_1', primaryText: 'Ana Pop', secondaryText: 'ana@example.com', secondaryId: 'user_1', entityType: 'user' }],
    });
  });

  it('proxies lookup callables', async () => {
    const { GET } = await import('../route');
    const response = await GET(new Request('https://example.com/api/admin/lookups?entityType=user&q=ana'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(callAdminCallableMock).toHaveBeenCalledWith(
      'adminLookupEntities',
      expect.objectContaining({ entityType: 'user', q: 'ana' }),
      expect.any(String),
      'token'
    );
  });

  it('returns empty array for short queries', async () => {
    const { GET } = await import('../route');
    const response = await GET(new Request('https://example.com/api/admin/lookups?q=a'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toEqual([]);
    expect(callAdminCallableMock).not.toHaveBeenCalled();
  });
});
