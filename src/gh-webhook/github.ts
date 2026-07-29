import type { APIEmbed } from 'discord-api-types/v10';
import type { Env } from '..';
import { verifyGitHubSignature } from './signature.ts';
import { buildWorkflowRunEmbed, type WorkflowRunPayload } from './workflow-embed.ts';

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

  const authorized = await verifyGitHubSignature(request.headers, bodyText, githubSecret);

  if (!authorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return new Response('Failed to parse request body', { status: 400 });
  }

  const eventType = request.headers.get('X-GitHub-Event');

  if (eventType === 'workflow_run') {
    const workflowWebhookUrl = env.DISCORD_WORKFLOW_WEBHOOK;
    if (!workflowWebhookUrl) {
      return new Response('Workflow webhook not configured', { status: 500 });
    }

    const payload = json as WorkflowRunPayload;
    if (payload.action !== 'completed' && payload.action !== 'in_progress') {
      return new Response('Skipped workflow_run action', { status: 200 });
    }

    const embed = buildWorkflowRunEmbed(payload);
    const sent = await sendEmbedToWebhook(embed, workflowWebhookUrl);

    if (!sent) {
      return new Response('Failed to send workflow embed to Discord', { status: 500 });
    }

    return new Response('Workflow event processed', { status: 200 });
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

async function sendEmbedToWebhook(embed: APIEmbed, webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return response.ok;
  } catch (e) {
    console.error('Error sending workflow embed to Discord:', e);
    return false;
  }
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
  } catch (e) {
    console.error('Error sending to discord webhook:', e);
    return false;
  }
}
