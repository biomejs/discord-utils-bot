import type { Env } from '..';

export async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, statusText: 'Method Not Allowed' });
  }

  const githubSecret = env.GITHUB_SECRET;
  const webhookUrl = env.DISCORD_WEBHOOK;

  if (!githubSecret || !webhookUrl) {
    return new Response('Internal server error', { status: 500, statusText: 'Internal Server Error' });
  }

  const authorized = await isAuthorized(request, githubSecret);

  if (!authorized) {
    return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  }

  const isHuman = await isHumanEvent(request);

  if (!isHuman) {
    return new Response('Event skipped', { status: 200, statusText: 'OK' });
  }

  const sent = await sendToWebhook(request, webhookUrl);

  if (!sent) {
    return new Response('Failed to send to Discord', { status: 500, statusText: 'Internal Server Error' });
  }

  return new Response('Event processed', { status: 200, statusText: 'OK' });
}

async function isAuthorized(request: Request, githubSecret: string): Promise<boolean> {
  const untrustedSignature = request.headers.get('x-hub-signature-256');

  if (untrustedSignature == null) {
    return false;
  }

  const bodyText = await request.text().catch(() => null);

  if (bodyText == null) {
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

async function isHumanEvent(request: Request): Promise<boolean> {
  const json = await request.json();

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

async function sendToWebhook(request: Request, webhookUrl: string): Promise<boolean> {
  const headers = request.headers;
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
      body: request.body,
    });

    return response.ok;
  } catch {
    return false;
  }
}
