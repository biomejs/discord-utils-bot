import type { Env } from '..';
import { sendDiscordEmbed } from '../discord-webhook.ts';
import { fetchOpenCollectiveOrder } from './api.ts';
import { buildOpenCollectiveSubscriptionEmbed } from './subscription-embed.ts';
import {
  OPEN_COLLECTIVE_SUBSCRIPTION_TYPES,
  type OpenCollectiveSubscriptionPayload,
  type OpenCollectiveSubscriptionType,
} from './types.ts';

const BIOME_COLLECTIVE_SLUG = 'biome';
const BIOME_COLLECTIVE_ID = 693207;

export async function handleOpenCollectiveWebhook(
  request: Request,
  env: Env,
  providedToken: string,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!env.OPENCOLLECTIVE_WEBHOOK_TOKEN || !env.OPENCOLLECTIVE_API_TOKEN || !env.DISCORD_SPONSORS_WEBHOOK) {
    return new Response('Internal server error', { status: 500 });
  }

  if (!(await verifyWebhookToken(providedToken, env.OPENCOLLECTIVE_WEBHOOK_TOKEN))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response('Failed to parse request body', { status: 400 });
  }

  if (!isRecord(payload) || typeof payload.type !== 'string') {
    return new Response('Invalid Open Collective payload', { status: 400 });
  }
  if (!isSubscriptionType(payload.type)) {
    return new Response('Unsupported activity skipped', { status: 200 });
  }
  if (!isSubscriptionPayload(payload)) {
    return new Response('Invalid subscription payload', { status: 400 });
  }
  if (payload.CollectiveId !== BIOME_COLLECTIVE_ID) {
    return new Response('Activity does not belong to Biome', { status: 403 });
  }

  let order = null;
  try {
    order = await fetchOpenCollectiveOrder(payload, env.OPENCOLLECTIVE_API_TOKEN);
    if (order.toAccount.slug !== BIOME_COLLECTIVE_SLUG) {
      return new Response('Contribution does not belong to Biome', { status: 403 });
    }
  } catch (error) {
    console.error('Failed to enrich Open Collective subscription:', error);
  }

  const embed = buildOpenCollectiveSubscriptionEmbed(payload, order);
  const sent = await sendDiscordEmbed(env.DISCORD_SPONSORS_WEBHOOK, embed);
  if (!sent) {
    return new Response('Failed to send Open Collective embed to Discord', { status: 502 });
  }

  return new Response('Open Collective event processed', { status: 200 });
}

async function verifyWebhookToken(provided: string, expected: string): Promise<boolean> {
  if (!provided) {
    return false;
  }

  const encoder = new TextEncoder();
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const [expectedKey, providedKey] = await Promise.all([
    crypto.subtle.importKey('raw', encoder.encode(expected), algorithm, false, ['sign']),
    crypto.subtle.importKey('raw', encoder.encode(provided), algorithm, false, ['verify']),
  ]);
  const proof = await crypto.subtle.sign('HMAC', expectedKey, encoder.encode('Open Collective webhook'));
  return crypto.subtle.verify('HMAC', providedKey, proof, encoder.encode('Open Collective webhook'));
}

function isSubscriptionType(type: string): type is OpenCollectiveSubscriptionType {
  return (OPEN_COLLECTIVE_SUBSCRIPTION_TYPES as readonly string[]).includes(type);
}

function isSubscriptionPayload(payload: Record<string, unknown>): payload is OpenCollectiveSubscriptionPayload {
  if (
    typeof payload.id !== 'number' ||
    typeof payload.createdAt !== 'string' ||
    typeof payload.CollectiveId !== 'number' ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.subscription) ||
    !isRecord(payload.data.order)
  ) {
    return false;
  }

  const { order, subscription } = payload.data;
  return (
    typeof subscription.id === 'number' &&
    typeof order.id === 'number' &&
    typeof order.totalAmount === 'number' &&
    typeof order.currency === 'string' &&
    typeof order.interval === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
