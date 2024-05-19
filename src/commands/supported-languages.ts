import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { reply } from '../reply.js';

export async function onSupportedLanguagesSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    ### ✅ Full Support
    JavaScript, TypeScript, JSX, JSON, JSONC
    ### ⚠️ Partial Support
    [Astro, Vue, Svelte](<https://github.com/biomejs/biome/issues/1719>) (Embedded JS only)
    ### ⏳ Working on it!
    [CSS](<https://github.com/biomejs/biome/issues/1285>), [GraphQL](<https://github.com/biomejs/biome/issues/1927>)\*, [YAML](<https://github.com/biomejs/biome/issues/2365>)\*
    ### ❓ Not yet
    HTML, Markdown
    Astro, Vue, Svelte (Full language support)

    \*Community contribution

    For more info check <https://biomejs.dev/internals/language-support>
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('supported-languages')
  .setDescription("See the status of Biome's language support");
