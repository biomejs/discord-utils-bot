import { SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  InteractionResponseType,
} from 'discord-api-types/v10';
import { reply } from '../reply.js';

interface Rule {
  name: string;
  version: string;
  link: string;
  recommended: boolean;
  deprecated: boolean;
  fixKind?: 'safe' | 'unsafe';
  docs: string;
}

interface RulesMetadata {
  lints: {
    languages: {
      [language: string]: {
        [category: string]: Record<string, Rule>;
      };
    };
  };
}

export async function onLintRuleSlashCommand(interaction: APIChatInputApplicationCommandInteraction) {
  if (!interaction.data.options || interaction.data.options[0].type !== ApplicationCommandOptionType.String) {
    return new Response();
  }

  const rule = interaction.data.options[0].value;

  const { lints } = (await fetch('https://biomejs.dev/metadata/rules.json').then((res) => res.json())) as RulesMetadata;
  const ruleData = Object.values(lints.languages)
    .flatMap((language) => Object.values(language))
    .flatMap((category) => Object.values(category))
    .find((r) => r.name.toLowerCase() === rule.toLowerCase());

  if (!ruleData) {
    return reply(InteractionResponseType.ChannelMessageWithSource, {
      content: `Rule \`${rule}\` not found`,
      flags: 64,
    });
  }

  const release = ruleData.version === 'next' ? 'unreleased' : `since \`v${ruleData.version}\``;
  return reply(InteractionResponseType.ChannelMessageWithSource, {
    content: dedent`
      ## ${ruleData.name} (${release})
      ${ruleData.recommended ? '🌟 Recommended' : ''}${ruleData.deprecated ? '⚠️ Deprecated' : ''}
      ${ruleData.fixKind ? `\nFix kind: ${ruleData.fixKind}\n` : ''}
      -${ruleData.docs.split('\n\n')[0]}

      Docs: <${ruleData.link}>
    `,
  });
}

export async function onLintRuleAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction) {
  if (!interaction.data.options || interaction.data.options[0].type !== ApplicationCommandOptionType.String) {
    return new Response();
  }

  const rule = interaction.data.options[0].value;

  const { lints } = (await fetch('https://biomejs.dev/metadata/rules.json').then((res) => res.json())) as RulesMetadata;
  const rules = Object.values(lints.languages)
    .flatMap((language) => Object.values(language))
    .flatMap((category) => Object.values(category))
    .filter((r) => r.name.toLowerCase().includes(rule.toLowerCase()))
    .sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    })
    .slice(0, 25);

  return reply(InteractionResponseType.ApplicationCommandAutocompleteResult, {
    choices: rules.map((r) => ({
      name: r.version === 'next' ? `${r.name} (unreleased)` : r.name,
      value: r.name,
    })),
  });
}

export const slashCommandData = new SlashCommandBuilder()
  .setName('lint-rule')
  .setDescription('Get info from a specific lint rule')
  .addStringOption((option) =>
    option.setName('rule').setDescription('The name of the lint rule').setAutocomplete(true).setRequired(true),
  );
