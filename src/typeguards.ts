import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIMessageComponentInteraction,
  type APIPingInteraction,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10';

export function isApplicationCommand(interaction: APIInteraction): interaction is APIApplicationCommandInteraction {
  return interaction.type === InteractionType.ApplicationCommand;
}

export function isAutocomplete(
  interaction: APIInteraction,
): interaction is APIApplicationCommandAutocompleteInteraction {
  return interaction.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isChatInputCommand(
  interaction: APIInteraction,
): interaction is APIChatInputApplicationCommandInteraction {
  return isApplicationCommand(interaction) && interaction.data.type === ApplicationCommandType.ChatInput;
}

export function isMessageComponent(interaction: APIInteraction): interaction is APIMessageComponentInteraction {
  return interaction.type === InteractionType.MessageComponent;
}

export function isPing(interaction: APIInteraction): interaction is APIPingInteraction {
  return interaction.type === InteractionType.Ping;
}
