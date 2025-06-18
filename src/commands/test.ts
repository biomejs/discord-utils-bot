import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { reply } from '../reply.ts';

export async function onTestSlashCommand(_interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: 'you just ran the test command. good job',
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('test')
  .setDescription('quick test. if this command doesnt work the bot is likely dead');
