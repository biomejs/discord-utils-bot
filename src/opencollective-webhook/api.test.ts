import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOpenCollectiveOrder } from './api.ts';
import { makeOpenCollectiveOrder, makeOpenCollectivePayload } from './test-fixtures.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOpenCollectiveOrder', () => {
  it('fetches an order by public ID with the personal token header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { order: makeOpenCollectiveOrder() } }));
    vi.stubGlobal('fetch', fetchMock);

    const order = await fetchOpenCollectiveOrder(makeOpenCollectivePayload(), 'personal-token');

    expect(order.fromAccount?.slug).toBe('sponsor');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.opencollective.com/graphql/v2');
    expect(new Headers(init.headers).get('Personal-Token')).toBe('personal-token');
    expect(init.redirect).toBe('error');
    expect(JSON.parse(init.body as string).variables).toEqual({ order: { id: 'order-public-id' } });
  });

  it('falls back to the legacy order ID when no public ID is available', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { order: makeOpenCollectiveOrder() } }));
    vi.stubGlobal('fetch', fetchMock);
    const payload = makeOpenCollectivePayload();
    payload.data.order.publicId = null;
    payload.data.order.idV2 = undefined;

    await fetchOpenCollectiveOrder(payload, 'personal-token');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string).variables).toEqual({ order: { legacyId: 738113 } });
  });

  it('rejects unsuccessful and malformed API responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(fetchOpenCollectiveOrder(makeOpenCollectivePayload(), 'personal-token')).rejects.toThrow('503');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { order: null } })));
    await expect(fetchOpenCollectiveOrder(makeOpenCollectivePayload(), 'personal-token')).rejects.toThrow(
      'invalid order',
    );
  });
});
