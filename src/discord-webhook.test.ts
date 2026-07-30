import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendDiscordEmbed } from './discord-webhook.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sendDiscordEmbed', () => {
  it('preserves query parameters and disables mentions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const sent = await sendDiscordEmbed('https://discord.com/api/webhooks/test?thread_id=123', { title: 'Test' });

    expect(sent).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('https://discord.com/api/webhooks/test?thread_id=123&wait=true');
    expect(JSON.parse(init.body as string)).toEqual({
      embeds: [{ title: 'Test' }],
      allowed_mentions: { parse: [] },
    });
  });

  it('returns false when Discord rejects the message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })));

    await expect(sendDiscordEmbed('https://discord.com/api/webhooks/test', { title: 'Test' })).resolves.toBe(false);
  });

  it('returns false when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendDiscordEmbed('https://discord.com/api/webhooks/test', { title: 'Test' })).resolves.toBe(false);
  });
});
