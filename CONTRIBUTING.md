# Contributing

## Table of Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Bot](#running-the-bot)
- [Adding Commands](#adding-commands)
- [Submitting Changes](#submitting-changes)

## Getting Started

### Installation

If you haven't already, install [Node.js](https://nodejs.org) `24.0.0` or later.

Afterwards, install `pnpm` by running `corepack enable`.

[Corepack](https://nodejs.org/api/corepack.html#corepack) is a tool that manages package managers, and comes bundled with Node.js.

Then, install the needed dependencies with `pnpm install --frozen-lockfile`.

### Environment Setup

First, create an application on the [Discord Developer Portal](https://discord.com/developers/applications).

It will be a used as a test application for development purposes of the bot.

Then, create a `.dev.vars` file at the root of the project with the following variables obtained from the dev portal:

```env
APPLICATION_ID=
DISCORD_TOKEN=
DISCORD_WEBHOOK=
PUBLIC_KEY=
WEBHOOK_SECRET=
```

### Running the Bot

Make sure you run the `deploy-commands` script before you start! It updates the command list on Discord.

You can do that by running `node --run deploy-commands`.

Once that's done, you can run the bot locally with `node --run dev`.

You need to forward the port used, and specify it in the dev portal as the interactions endpoint URL.

## Adding Commands

Create a new file in the `src/commands` directory, with the following structure (you can use this as a template):

```ts
import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { reply } from '../reply.ts';

export async function onXSlashCommand(interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: 'you just ran the test command. good job',
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('replace-me')
  .setDescription('replace this too');
```

Rename the onXSlashCommand function to match the command name (i.e. `onTestSlashCommand` for a command named `test`),
and replace the placeholder text in the builder.

Then, import the command in `src/commands/index.ts` and add it to the switch statement in the handleInteraction function.

Remember to run `node --run deploy-commands` after adding a new command, to update the command list on Discord.

## Submitting Changes

When you're ready to submit your changes, make sure to run `node --run check` and `node --run typecheck` to ensure everything is in order.

Then, create a [pull request](https://github.com/biomejs/discord-utils-bot/pulls).

Once the PR is approved, it will be merged and deployed to the production bot.
