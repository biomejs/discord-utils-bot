import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { dedent } from 'ts-dedent';
import { reply } from '../reply.js';

export async function onPluginsSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    ⚠️ **In roadmap**
    There is no support for plugins yet, but it is planned for the future.

    From the [2024 roadmap](https://biomejs.dev/blog/roadmap-2024/):
    >>> ### Plugins
    We will explore plugins and come up with a design that fits Biome. Biome is different from other tools because Biome is a toolchain that has multiple tools in it, so we have to think out of the box and propose a design that might differ from the tools people are used to.

    We don't know yet what a Biome's plugin will look like, although a plugin should be able to tap all the tools that Biome offers.

    Some ideas that we will consider:

    - DSL
    - WASM
    - A Runtime
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('arewepluginsyet')
  .setDescription('Does Biome support plugins yet?');
