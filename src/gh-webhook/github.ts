import crypto from 'node:crypto';
import type { Env } from '..';

export async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, statusText: 'Method Not Allowed' });
  }

  const githubSecret = process.env.GITHUB_SECRET;
  const WebhookURL = process.env.WEBHOOK_URL;

  if (!githubSecret || !WebhookURL) {
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

  const sent = await sendToWebhook(request);

  if (!sent) {
    return new Response('Failed to send to Discord', { status: 500, statusText: 'Internal Server Error' });
  }

  return new Response('Event processed', { status: 200, statusText: 'OK' });
}

async function isAuthorized(request: Request, githubSecret: string): Promise<boolean> {
  const header_signature = request.headers.get('x-hub-signature-256');

  if (header_signature == null) {
    return false;
  }

  const bodyText = await request.text().catch(() => null);

  if (bodyText == null) {
    return false;
  }

  const split = header_signature.split('=')[1];

  if (!split) {
    return false;
  }

  const calculatedSignature = crypto.createHmac('sha256', githubSecret).update(bodyText).digest('hex');
  const trusted = Buffer.from(`sha256=${calculatedSignature}`);
  const untrusted = Buffer.from(header_signature);

  return crypto.timingSafeEqual(trusted, untrusted);
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

async function sendToWebhook(request: Request): Promise<boolean> {
  const headers = request.headers;
  const forwardHeaders = new Headers();

  for (const [key, value] of headers) {
    if (key !== 'host' && key !== 'authorization') {
      forwardHeaders.set(key, value);
    }
  }

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK, {
      method: 'POST',
      headers: forwardHeaders,
      body: request.body,
    });

    return response.ok;
  } catch {
    return false;
  }
}
