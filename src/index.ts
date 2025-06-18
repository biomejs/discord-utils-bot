import { type APIInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { isValidRequest, PlatformAlgorithm } from 'discord-verify';
import { onPluginsSlashCommand } from './commands/arewepluginsyet.ts';
import { onLintRuleAutocomplete, onLintRuleSlashCommand } from './commands/lint-rule.ts';
import { onReproductionSlashCommand } from './commands/reproduction.ts';
import { onSupportedLanguagesSlashCommand } from './commands/supported-languages.ts';
import { onTestSlashCommand } from './commands/test.ts';
import { handleGitHubWebhook } from './gh-webhook/github.ts';
import { reply } from './reply.ts';
import { isAutocomplete, isChatInputCommand, isMessageComponent, isPing } from './typeguards.ts';

export type Env = {
  PUBLIC_KEY: string;
  DISCORD_WEBHOOK: string;
  WEBHOOK_SECRET: string;
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route requests based on the URL path
    switch (url.pathname) {
      case '/github':
        return handleGitHubWebhook(request, env);
      default:
        return handleInteraction(request, env);
    }
  },
};

async function handleInteraction(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get('X-Signature-Ed25519') || !request.headers.get('X-Signature-Timestamp')) {
    return Response.redirect('https://biomejs.dev');
  }

  const isValid = await isValidRequest(request, env.PUBLIC_KEY, PlatformAlgorithm.Cloudflare).catch(() => false);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const interaction = await request.json<APIInteraction>();

  if (isPing(interaction)) {
    return reply(InteractionResponseType.Pong);
  }

  if (isChatInputCommand(interaction)) {
    switch (interaction.data.name) {
      case 'arewepluginsyet':
        return onPluginsSlashCommand(interaction);
      case 'lint-rule':
        return onLintRuleSlashCommand(interaction);
      case 'reproduction':
        return onReproductionSlashCommand(interaction);
      case 'supported-languages':
        return onSupportedLanguagesSlashCommand(interaction);
      case 'test':
        return onTestSlashCommand(interaction);
    }
  }

  if (isAutocomplete(interaction)) {
    switch (interaction.data.name) {
      case 'lint-rule':
        return onLintRuleAutocomplete(interaction);
    }
  }

  if (isMessageComponent(interaction)) {
    const [_name] = interaction.data.custom_id.split(':');
    // add things here
  }

  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: "Unknown command, you probably shouldn't be able to see this. Please tell us about it!",
    flags: 64,
  });
}
