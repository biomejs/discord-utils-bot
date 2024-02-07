import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { dedent } from 'ts-dedent';
import { reply } from '../reply.js';

export async function onPluginsSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    ⚠️ **In roadmap**
    There is no support for plugins yet, but it is planned for the future.

    There is a [Biome Plugins Proposal RFC](<https://github.com/biomejs/biome/discussions/1762>) that aims to guide our implementation work.

    We want to support the following use cases:

    - Linter plugins
    - Formatter plugins
    - Transformation plugins
    - Codemods
    - A query engine

    Specifically, we want to explore these use cases through a combination of [GritQL](<https://docs.grit.io/tutorials/gritql>) plugins and/or JS/TS plugins.
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('arewepluginsyet')
  .setDescription('Does Biome support plugins yet?');
