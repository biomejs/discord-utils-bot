import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { dedent } from 'ts-dedent';
import { reply } from '../reply.js';

export async function onSupportedLanguagesSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    ### ✅ Full Support
    JavaScript, TypeScript, JSX, JSON, JSONC
    ### ⏳ Working on it!
    [CSS](<https://github.com/biomejs/biome/issues/1285>)
    ### ❓ Not yet
    HTML, Vue, Svelte, Markdown

    For more info check <https://biomejs.dev/internals/language-support>
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('supported-languages')
  .setDescription("See the status of Biome's language support");
