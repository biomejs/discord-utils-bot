import type { APIEmbed } from 'discord-api-types/v10';

export async function sendDiscordEmbed(webhookUrl: string, embed: APIEmbed): Promise<boolean> {
  const url = new URL(webhookUrl);
  url.searchParams.set('wait', 'true');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
        allowed_mentions: { parse: [] },
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending embed to Discord:', error);
    return false;
  }
}
