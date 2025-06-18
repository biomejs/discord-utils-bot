import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import { reply } from '../reply.js';

export async function onPluginsSlashCommand() {
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          ### 🚨 Plugins are here 🚨
          [Biome v2](<https://biomejs.dev/blog/biome-v2>) comes with our first iteration of [linter plugins](https://biomejs.dev/linter/plugins).
        `,
      },
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          You can put a GritQL snippet in a file anywhere in your project, but be mindful you use the \`.grit\` extension. Then, you can simply enable it as a plugin with the following configuration:
          \`\`\`json
          {
            "plugins": ["./path-to-plugin.grit"]
          }
          \`\`\`
        `,
      },
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: dedent`
          These plugins are still limited in scope: They only allow you to match code snippets and report diagnostics on them.
          Want to contribute? See the umbrella issue: <https://github.com/biomejs/biome/issues/2463>
        `,
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            url: 'https://biomejs.dev/linter/plugins',
            label: 'Documentation',
          },
        ],
      },
    ],
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('arewepluginsyet')
  .setDescription('Does Biome support plugins yet? (Yes!)');
