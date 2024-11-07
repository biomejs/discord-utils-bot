import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { reply } from '../reply.js';

export async function onPluginsSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    🚨 **Plugins are coming to Biome 2.0** 🚨

    See the umbrella issue: <https://github.com/biomejs/biome/issues/2463>
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('arewepluginsyet')
  .setDescription('Does Biome support plugins yet?');
