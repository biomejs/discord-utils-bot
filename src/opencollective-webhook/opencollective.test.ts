import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '..';
import { handleOpenCollectiveWebhook } from './opencollective.ts';
import { makeOpenCollectiveOrder, makeOpenCollectivePayload } from './test-fixtures.ts';

const ENV: Env = {
  PUBLIC_KEY: 'public-key',
  DISCORD_WEBHOOK: 'https://discord.com/api/webhooks/general/github',
  DISCORD_SPONSORS_WEBHOOK: 'https://discord.com/api/webhooks/sponsors?thread_id=123',
  DISCORD_WORKFLOW_WEBHOOK: 'https://discord.com/api/webhooks/workflow',
  OPENCOLLECTIVE_API_TOKEN: 'personal-token',
  OPENCOLLECTIVE_WEBHOOK_TOKEN: 'webhook-token',
  WEBHOOK_SECRET: 'github-secret',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('handleOpenCollectiveWebhook', () => {
  it('rejects non-POST requests and invalid webhook tokens', async () => {
    const getResponse = await handleOpenCollectiveWebhook(
      new Request('https://bot.example/opencollective/webhook-token'),
      ENV,
      'webhook-token',
    );
    expect(getResponse.status).toBe(405);

    const response = await handleOpenCollectiveWebhook(makeRequest(makeOpenCollectivePayload()), ENV, 'wrong-token');
    expect(response.status).toBe(401);
  });

  it('skips unrelated activities without external requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handleOpenCollectiveWebhook(makeRequest({ type: 'order.processed' }), ENV, 'webhook-token');

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed subscription payloads', async () => {
    const response = await handleOpenCollectiveWebhook(
      makeRequest({ type: 'subscription.canceled' }),
      ENV,
      'webhook-token',
    );

    expect(response.status).toBe(400);
  });

  it('rejects activities for another collective before enrichment', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const payload = makeOpenCollectivePayload();
    payload.CollectiveId = 1;

    const response = await handleOpenCollectiveWebhook(makeRequest(payload), ENV, 'webhook-token');

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('enriches and posts a subscription embed to the sponsors channel', async () => {
    const fetchMock = mockApiAndDiscord(makeOpenCollectiveOrder());
    const response = await handleOpenCollectiveWebhook(
      makeRequest(makeOpenCollectivePayload('subscription.paused')),
      ENV,
      'webhook-token',
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [discordUrl, discordInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(discordUrl.toString()).toBe('https://discord.com/api/webhooks/sponsors?thread_id=123&wait=true');
    expect(JSON.parse(discordInit.body as string)).toMatchObject({
      embeds: [{ title: 'Open Collective subscription paused', author: { name: 'Sponsor Inc.' } }],
      allowed_mentions: { parse: [] },
    });
  });

  it('rejects an enriched order for a different collective', async () => {
    const order = makeOpenCollectiveOrder();
    order.toAccount.slug = 'another-collective';
    const fetchMock = mockApiAndDiscord(order);

    const response = await handleOpenCollectiveWebhook(makeRequest(makeOpenCollectivePayload()), ENV, 'webhook-token');

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('falls back to the webhook payload when enrichment fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      if (String(input).startsWith('https://api.opencollective.com/')) {
        return Promise.resolve(new Response(null, { status: 503 }));
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleOpenCollectiveWebhook(makeRequest(makeOpenCollectivePayload()), ENV, 'webhook-token');

    expect(response.status).toBe(200);
    const discordInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(JSON.parse(discordInit.body as string)).toMatchObject({
      embeds: [{ author: { name: 'Anonymous contributor' } }],
    });
  });

  it('returns 502 when Discord rejects the embed', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      if (String(input).startsWith('https://api.opencollective.com/')) {
        return Promise.resolve(Response.json({ data: { order: makeOpenCollectiveOrder() } }));
      }
      return Promise.resolve(new Response(null, { status: 400 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleOpenCollectiveWebhook(makeRequest(makeOpenCollectivePayload()), ENV, 'webhook-token');

    expect(response.status).toBe(502);
  });
});

function makeRequest(payload: unknown): Request {
  return new Request('https://bot.example/opencollective/webhook-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function mockApiAndDiscord(order: ReturnType<typeof makeOpenCollectiveOrder>) {
  const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
    if (String(input).startsWith('https://api.opencollective.com/')) {
      return Promise.resolve(Response.json({ data: { order } }));
    }
    return Promise.resolve(new Response(null, { status: 204 }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
