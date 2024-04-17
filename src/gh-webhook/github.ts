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

  const bodyText = await request.text().catch(() => null);
  const headers = request.headers;

  if (bodyText == null) {
    return new Response('Failed to read request body', { status: 400, statusText: 'Bad Request' });
  }

  const authorized = await isAuthorized(headers, bodyText, githubSecret);

  if (!authorized) {
    return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  }

  let json: unknown | null;
  try {
    json = JSON.parse(bodyText);
  } catch {
    json = null;
  }

  if (json == null) {
    return new Response('Failed to parse request body', { status: 400, statusText: 'Bad Request' });
  }

  const isHuman = await isHumanEvent(json);

  if (!isHuman) {
    return new Response('Event skipped', { status: 200, statusText: 'OK' });
  }

  const sent = await sendToWebhook(json, headers, webhookUrl);

  if (!sent) {
    return new Response('Failed to send to Discord', { status: 500, statusText: 'Internal Server Error' });
  }

  return new Response('Event processed', { status: 200, statusText: 'OK' });
}

async function isAuthorized(headers: Headers, bodyText: string, githubSecret: string): Promise<boolean> {
  const untrustedSignature = headers.get('x-hub-signature-256');

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

async function sendToWebhook(json: unknown, headers: Headers, webhookUrl: string): Promise<boolean> {
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
      body: json as BodyInit,
    });

    return response.ok;
  } catch {
    return false;
  }
}
