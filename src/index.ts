import { type APIInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { PlatformAlgorithm, isValidRequest } from 'discord-verify';
import { onPluginsSlashCommand } from './commands/arewepluginsyet.js';
import { onSupportedLanguagesSlashCommand } from './commands/supported-languages.js';
import { onTestSlashCommand } from './commands/test.js';
import { handleGitHubWebhook } from './gh-webhook/github.js';
import { reply } from './reply.js';
import { isChatInputCommand, isMessageComponent, isPing } from './typeguards.js';
export type Env = {
  PUBLIC_KEY: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route requests based on the URL path
    switch (url.pathname) {
      case '/github':
        return handleGitHubWebhook(request, env);
      default:
        return handleDiscordInteraction(request, env);
    }
  },
};

async function handleDiscordInteraction(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get('X-Signature-Ed25519') || !request.headers.get('X-Signature-Timestamp')) {
    return Response.redirect('https://biomejs.dev');
  }

  const isValid = await isValidRequest(request, env.PUBLIC_KEY, PlatformAlgorithm.Cloudflare).catch(() => false);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const interaction = await request.json<APIInteraction>();
  return handleInteraction(interaction, env);
}

async function handleInteraction(interaction: APIInteraction, env: Env): Promise<Response> {
  if (isPing(interaction)) {
    return reply(InteractionResponseType.Pong);
  }

  if (isChatInputCommand(interaction)) {
    switch (interaction.data.name) {
      case 'arewepluginsyet':
        return onPluginsSlashCommand(interaction);
      case 'supported-languages':
        return onSupportedLanguagesSlashCommand(interaction);
      case 'test':
        return onTestSlashCommand(interaction);
    }
  }

  if (isMessageComponent(interaction)) {
    const [name] = interaction.data.custom_id.split(':');
    // add things here
  }

  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: "Unknown command, you probably shouldn't be able to see this. Please tell us about it!",
    flags: 64,
  });
}
