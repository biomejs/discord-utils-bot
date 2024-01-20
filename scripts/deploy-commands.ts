import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import type { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import {
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody,
  Routes,
} from 'discord-api-types/v10';

if (!process.env.DISCORD_TOKEN || !process.env.APPLICATION_ID) {
  console.error('Missing CLIENT_SECRET or APPLICATION_ID environment variables');
  process.exit(1);
}

console.log('Deploying commands...');

interface CommandFile {
  contextMenuCommandData: ContextMenuCommandBuilder;
  slashCommandData: SlashCommandBuilder;
}

const directory = join(import.meta.dirname, '../src/commands');
const files = await readdir(directory);

const commands: (
  | RESTPostAPIContextMenuApplicationCommandsJSONBody
  | RESTPostAPIChatInputApplicationCommandsJSONBody
)[] = [];

for (const file of files) {
  const loadedFile = await loadFile<CommandFile>(directory, file);

  if (loadedFile) {
    commands.push(loadedFile.slashCommandData?.toJSON() ?? loadedFile.contextMenuCommandData?.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands });

console.log(`Deployed ${commands.length} commands`);

async function loadFile<T>(directory: string, file: string) {
  if (!file.endsWith('.ts')) {
    return;
  }

  const data = (await import(`file://${join(directory, file)}`)) as T;
  return data;
}
