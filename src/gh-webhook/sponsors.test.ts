import type { SponsorshipEvent } from '@octokit/webhooks-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '..';
import { handleSponsorsWebhook } from './sponsors.ts';

const ENV: Env = {
  PUBLIC_KEY: 'public-key',
  DISCORD_WEBHOOK: 'https://discord.com/api/webhooks/general/github',
  DISCORD_SPONSORS_WEBHOOK: 'https://discord.com/api/webhooks/sponsors?thread_id=123',
  DISCORD_WORKFLOW_WEBHOOK: 'https://discord.com/api/webhooks/workflow',
  WEBHOOK_SECRET: 'general-secret',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handleSponsorsWebhook', () => {
  it('rejects requests with an invalid signature', async () => {
    const request = new Request('https://bot.example/github/sponsors', {
      method: 'POST',
      headers: { 'X-Hub-Signature-256': `sha256=${'0'.repeat(64)}` },
      body: '{}',
    });

    const response = await handleSponsorsWebhook(request, ENV);

    expect(response.status).toBe(401);
  });

  it('acknowledges a signed ping without calling Discord', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = await makeSignedRequest('{}', 'ping');

    const response = await handleSponsorsWebhook(request, ENV);

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed sponsorship payloads', async () => {
    const request = await makeSignedRequest('{}', 'sponsorship');

    const response = await handleSponsorsWebhook(request, ENV);

    expect(response.status).toBe(400);
  });

  it('posts an embed to Discord while preserving webhook query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const body = JSON.stringify(makeCreatedPayload());
    const request = await makeSignedRequest(body, 'sponsorship');

    const response = await handleSponsorsWebhook(request, ENV);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('https://discord.com/api/webhooks/sponsors?thread_id=123&wait=true');
    expect(JSON.parse(init.body as string)).toMatchObject({
      embeds: [{ title: 'New monthly sponsorship' }],
      allowed_mentions: { parse: [] },
    });
  });
});

async function makeSignedRequest(body: string, event: string): Promise<Request> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENV.WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');

  return new Request('https://bot.example/github/sponsors', {
    method: 'POST',
    headers: {
      'X-GitHub-Event': event,
      'X-Hub-Signature-256': `sha256=${hex}`,
    },
    body,
  });
}

function makeCreatedPayload(): SponsorshipEvent {
  const user = {
    login: 'sponsor',
    id: 1,
    node_id: 'user-1',
    avatar_url: 'https://github.com/sponsor.png',
    gravatar_id: '',
    url: 'https://api.github.com/users/sponsor',
    html_url: 'https://github.com/sponsor',
    followers_url: '',
    following_url: '',
    gists_url: '',
    starred_url: '',
    subscriptions_url: '',
    organizations_url: '',
    repos_url: '',
    events_url: '',
    received_events_url: '',
    type: 'User' as const,
    site_admin: false,
  };

  return {
    action: 'created',
    sponsorship: {
      node_id: 'sponsorship-1',
      created_at: '2026-07-27T12:00:00Z',
      sponsorable: { ...user, login: 'biomejs', type: 'Organization' },
      sponsor: user,
      privacy_level: 'public',
      tier: {
        node_id: 'tier-1',
        created_at: '2026-01-01T00:00:00Z',
        description: 'Support Biome',
        monthly_price_in_cents: 500,
        monthly_price_in_dollars: 5,
        name: 'Supporter',
        is_one_time: false,
        is_custom_amount: false,
      },
    },
    sender: user,
  };
}
