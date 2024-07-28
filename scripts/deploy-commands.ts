import { glob } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import type { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

if (!process.env.DISCORD_TOKEN || !process.env.APPLICATION_ID) {
  console.error('Missing DISCORD_TOKEN or APPLICATION_ID environment variables');
  process.exit(1);
}

console.log('Deploying commands...');

interface CommandFile {
  contextMenuCommandData: ContextMenuCommandBuilder;
  slashCommandData: SlashCommandBuilder;
}

const files = glob(join(import.meta.dirname, '../src/commands/*.ts'));
const commands = await Array.fromAsync(files, async (file) => {
  const loadedFile = (await import(`file:${file}`)) as CommandFile;

  return loadedFile.slashCommandData?.toJSON() ?? loadedFile.contextMenuCommandData?.toJSON();
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands });

console.log(`Deployed ${commands.length} commands`);
