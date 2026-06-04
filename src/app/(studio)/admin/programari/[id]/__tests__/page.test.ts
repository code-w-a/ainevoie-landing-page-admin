import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useParamsMock = vi.fn();
const useAdminDataMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: useParamsMock,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string, children: React.ReactNode }) => React.createElement('a', { href }, children),
}));

vi.mock('@/components/admin/useAdminData', () => ({
  useAdminData: useAdminDataMock,
}));

vi.mock('@/components/admin/AdminEntityLookup', () => ({
  AdminEntityLookup: ({ value }: { value?: string }) => React.createElement('div', { 'data-linked-ticket': value || '' }, 'lookup'),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => React.createElement('span', null, children),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ asChild, children, ...props }: { asChild?: boolean, children: React.ReactNode } & Record<string, unknown>) => {
    if (asChild) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement('button', props, children);
  },
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => React.createElement('section', null, children),
  CardHeader: ({ children }: { children: React.ReactNode }) => React.createElement('header', null, children),
  CardTitle: ({ children }: { children: React.ReactNode }) => React.createElement('h2', null, children),
  CardDescription: ({ children }: { children: React.ReactNode }) => React.createElement('p', null, children),
  CardContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => React.createElement('table', null, children),
  TableHeader: ({ children }: { children: React.ReactNode }) => React.createElement('thead', null, children),
  TableBody: ({ children }: { children: React.ReactNode }) => React.createElement('tbody', null, children),
  TableRow: ({ children }: { children: React.ReactNode }) => React.createElement('tr', null, children),
  TableHead: ({ children }: { children: React.ReactNode }) => React.createElement('th', null, children),
  TableCell: ({ children, colSpan }: { children: React.ReactNode, colSpan?: number }) => React.createElement('td', { colSpan }, children),
}));

describe('Admin booking detail page', () => {
  beforeEach(() => {
    vi.resetModules();
    useParamsMock.mockReturnValue({ id: 'booking_77' });
    useAdminDataMock.mockReturnValue({
      loading: false,
      error: null,
      data: {
        booking: {
          bookingId: 'booking_77',
          status: 'cancelled_by_admin',
          userId: 'user_1',
          providerId: 'provider_1',
          scheduledStartAt: '2026-10-25T00:30:00.000Z',
          scheduledEndAt: '2026-10-25T02:30:00.000Z',
          timezone: 'Europe/Bucharest',
          requestDetails: {
            description: 'Client requested help before admin cancellation.',
            estimatedHours: 2,
            professionalsCount: 3,
          },
          pricingSnapshot: {
            amount: 180,
            currency: 'RON',
            estimatedHours: 2,
            professionalsCount: 3,
            ratePerHourPerProfessional: 90,
          },
          paymentSummary: {
            paymentId: 'pay_booking_77',
            status: 'failed',
          },
          userSnapshot: {
            displayName: 'Client One',
            email: 'client.one@example.com',
          },
          providerSnapshot: {
            displayName: 'Casa in Ordine',
            email: 'provider.one@example.com',
          },
          serviceSnapshot: {
            name: 'Curatenie generala',
          },
          requestResponse: {
            status: 'answered',
            deadlineAt: '2026-10-24T11:00:00.000Z',
            answeredAt: '2026-10-24T10:15:00.000Z',
          },
        },
        payment: {
          paymentId: 'pay_booking_77',
          status: 'failed',
          amount: 180,
          currency: 'RON',
          processor: 'demo',
          method: 'demo',
        },
        provider: {
          professionalProfile: {
            displayName: 'Casa in Ordine',
          },
        },
        user: {
          email: 'client.one@example.com',
        },
        conversation: null,
        review: null,
        supportTickets: [],
        recentAuditEvents: [],
      },
    });
  });

  it('renders cancelled_by_admin booking detail state with the corrected pricing formula', async () => {
    const pageModule = await import('../page');
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain('cancelled by admin');
    expect(html).toContain('2h × 90 RON');
    expect(html).not.toContain('2h × 90 × 3 pers');
    expect(html).toContain('Admin cancel booking');
    expect(html).toContain('Nu există recenzie asociată booking-ului.');
  });

  it('renders confirmed unpaid bookings as awaiting payment without changing backend status', async () => {
    useAdminDataMock.mockReturnValue({
      loading: false,
      error: null,
      data: {
        booking: {
          bookingId: 'booking_88',
          status: 'confirmed',
          userId: 'user_1',
          providerId: 'provider_1',
          scheduledStartAt: '2026-10-25T00:30:00.000Z',
          scheduledEndAt: '2026-10-25T02:30:00.000Z',
          timezone: 'Europe/Bucharest',
          requestDetails: {
            description: 'Client requested checkout after confirm.',
            estimatedHours: 2,
            professionalsCount: 1,
          },
          pricingSnapshot: {
            amount: 180,
            currency: 'RON',
            estimatedHours: 2,
            ratePerHourPerProfessional: 90,
          },
          paymentSummary: {
            paymentId: 'pay_booking_88',
            status: 'unpaid',
          },
          userSnapshot: {
            displayName: 'Client One',
            email: 'client.one@example.com',
          },
          providerSnapshot: {
            displayName: 'Casa in Ordine',
            email: 'provider.one@example.com',
          },
          serviceSnapshot: {
            name: 'Curatenie generala',
          },
          requestResponse: {
            status: 'answered',
            deadlineAt: '2026-10-24T11:00:00.000Z',
            answeredAt: '2026-10-24T10:15:00.000Z',
          },
        },
        payment: {
          paymentId: 'pay_booking_88',
          status: 'unpaid',
          amount: 180,
          currency: 'RON',
          processor: 'stripe',
          method: 'card',
        },
        provider: {
          professionalProfile: {
            displayName: 'Casa in Ordine',
          },
        },
        user: {
          email: 'client.one@example.com',
        },
        conversation: null,
        review: null,
        supportTickets: [],
        recentAuditEvents: [],
      },
    });

    const pageModule = await import('../page');
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain('confirmed');
    expect(html).toContain('Confirmată, în așteptarea plății');
  });
});
