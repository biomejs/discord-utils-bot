import type {
  APICommandAutocompleteInteractionResponseCallbackData,
  APIInteractionResponseCallbackData,
  InteractionResponseType,
} from 'discord-api-types/v10';

function respond(value: unknown) {
  const json = JSON.stringify(value);
  return new Response(json, {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}

export function reply(
  type: InteractionResponseType,
  data?: APIInteractionResponseCallbackData | APICommandAutocompleteInteractionResponseCallbackData,
) {
  return respond({ type, data });
}
