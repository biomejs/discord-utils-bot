import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import {
  type APIApplicationCommandInteraction,
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10';
import { reply } from '../reply.ts';

export async function onSupportedLanguagesSlashCommand(_interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          ### ✅ Full Support
          JavaScript, TypeScript, JSX, JSON, HTML, JSONC, CSS, GraphQL, GritQL
        `,
      },
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          ### 🟡 Experimental
          [Vue, Svelte, Astro](<https://biomejs.dev/internals/language-support/#html-super-languages-support>)
        `,
      },
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          ### ⏳ Working on it!
          [YAML](<https://github.com/biomejs/biome/issues/2365>), [Markdown](<https://github.com/biomejs/biome/issues/3718>)
        `,
      },
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          *For more info check out <https://biomejs.dev/internals/language-support>*
        `,
      },
    ],
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('supported-languages')
  .setDescription("See the status of Biome's language support");
