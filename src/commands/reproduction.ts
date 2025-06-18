import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { type APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { reply } from '../reply.ts';

export async function onReproductionSlashCommand(_interaction: APIApplicationCommandInteraction) {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
    🙏 **Please provide a minimal reproduction**

    If possible, please provide a link to a minimal reproduction of your issue. You can either use our playground or create a minimal reproduction repository.

    - [Create a reproduction on the Playground](<https://biomejs.dev/playground/>)
    - Create a reproduction repository: \`npm create @biomejs/biome-reproduction\`

    **Why it's important**

    Providing a minimal reproduction is important because it helps us quickly understand and diagnose the issue by isolating the problem to its core components. This makes the debugging process  faster, reduces misunderstandings, and ensures the issue can be addressed efficiently.

    **What is a good minimal reproduction**

    A good minimal reproduction is a simplified version of your issue that includes only the necessary code or steps to reproduce the problem. It removes any unrelated features or complexity, focusing solely on the core issue. This makes it easier for us to quickly identify and fix the problem without unnecessary distractions.
    `,
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('reproduction')
  .setDescription('Ask for a minimal reproduction');
