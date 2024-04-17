import type { Env } from '..';

export async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const githubSecret = env.WEBHOOK_SECRET;
  const webhookUrl = env.DISCORD_WEBHOOK;

  if (!githubSecret || !webhookUrl) {
    return new Response('Internal server error', { status: 500 });
  }

  const bodyText = await request.text().catch(() => null);

  if (!bodyText) {
    return new Response('Failed to read request body', { status: 400 });
  }

  const authorized = await isAuthorized(request.headers, bodyText, githubSecret);

  if (!authorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return new Response('Failed to parse request body', { status: 400 });
  }

  const isHuman = await isHumanEvent(json);

  if (!isHuman) {
    return new Response('Webhook event triggered by bot, skipped', { status: 200 });
  }

  const sent = await sendToWebhook(bodyText, request.headers, webhookUrl);

  if (!sent) {
    return new Response('Failed to send to Discord', { status: 500 });
  }

  return new Response('Event processed', { status: 200 });
}

async function isAuthorized(headers: Headers, bodyText: string, githubSecret: string): Promise<boolean> {
  const untrustedSignature = headers.get('X-Hub-Signature-256');

  if (untrustedSignature == null) {
    return false;
  }

  const encoder = new TextEncoder();

  const data = encoder.encode(bodyText);
  const secret = encoder.encode(githubSecret);

  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, data);

  const hexSignature = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const trusted = encoder.encode(`sha256=${hexSignature}`);
  const untrusted = encoder.encode(untrustedSignature);

  return crypto.subtle.timingSafeEqual(trusted, untrusted);
}

async function isHumanEvent(json: unknown): Promise<boolean> {
  return (
    json !== null &&
    json !== undefined &&
    typeof json === 'object' &&
    'sender' in json &&
    json.sender !== null &&
    json.sender !== undefined &&
    typeof json.sender === 'object' &&
    'type' in json.sender &&
    json.sender.type !== null &&
    json.sender.type !== undefined &&
    typeof json.sender.type === 'string' &&
    json.sender.type === 'User'
  );
}

async function sendToWebhook(body: string, headers: Headers, webhookUrl: string): Promise<boolean> {
  const forwardHeaders = new Headers();

  for (const [key, value] of headers) {
    if (key !== 'host' && key !== 'authorization') {
      forwardHeaders.set(key, value);
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body,
    });

    return response.ok;
  } catch {
    return false;
  }
}
