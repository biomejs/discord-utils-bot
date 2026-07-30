import type { SponsorshipEvent } from '@octokit/webhooks-types';
import type { Env } from '..';
import { sendDiscordEmbed } from '../discord-webhook.ts';
import { verifyGitHubSignature } from './signature.ts';
import { buildSponsorshipEmbed } from './sponsorship-embed.ts';

export async function handleSponsorsWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!env.WEBHOOK_SECRET || !env.DISCORD_SPONSORS_WEBHOOK) {
    return new Response('Internal server error', { status: 500 });
  }

  const body = await request.text().catch(() => null);
  if (body === null) {
    return new Response('Failed to read request body', { status: 400 });
  }

  if (!(await verifyGitHubSignature(request.headers, body, env.WEBHOOK_SECRET))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const eventType = request.headers.get('X-GitHub-Event');
  if (eventType === 'ping') {
    return new Response('Ping received', { status: 200 });
  }
  if (eventType !== 'sponsorship') {
    return new Response('Unsupported event', { status: 200 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Failed to parse request body', { status: 400 });
  }

  if (!isSponsorshipEvent(payload)) {
    return new Response('Invalid sponsorship payload', { status: 400 });
  }

  const sent = await sendDiscordEmbed(env.DISCORD_SPONSORS_WEBHOOK, buildSponsorshipEmbed(payload));
  if (!sent) {
    return new Response('Failed to send sponsorship embed to Discord', { status: 502 });
  }

  return new Response('Sponsorship event processed', { status: 200 });
}

function isSponsorshipEvent(payload: unknown): payload is SponsorshipEvent {
  if (!payload || typeof payload !== 'object' || !('action' in payload) || !('sponsorship' in payload)) {
    return false;
  }

  return (
    payload.action === 'created' ||
    payload.action === 'edited' ||
    payload.action === 'pending_cancellation' ||
    payload.action === 'cancelled' ||
    payload.action === 'pending_tier_change' ||
    payload.action === 'tier_changed'
  );
}
