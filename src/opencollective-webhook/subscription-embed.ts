import type { APIEmbed, APIEmbedField } from 'discord-api-types/v10';
import type { OpenCollectiveOrder, OpenCollectiveSubscriptionPayload } from './types.ts';

const BIOME_COLLECTIVE_URL = 'https://opencollective.com/biome';

const ACTIONS = {
  'subscription.canceled': { title: 'Open Collective subscription cancelled', color: 0xd73a49 },
  'subscription.paused': { title: 'Open Collective subscription paused', color: 0xbf8700 },
  'subscription.resumed': { title: 'Open Collective subscription resumed', color: 0x2da44e },
} as const;

export function buildOpenCollectiveSubscriptionEmbed(
  payload: OpenCollectiveSubscriptionPayload,
  order: OpenCollectiveOrder | null,
): APIEmbed {
  const action = ACTIONS[payload.type];
  const contributor = order?.fromAccount;
  const isAnonymous = !contributor || contributor.isIncognito;
  const amount = order?.amount ?? {
    value: payload.data.order.totalAmount / 100,
    currency: payload.data.order.currency,
  };
  const fields: APIEmbedField[] = [
    {
      name: 'Tier',
      value: order?.tier?.name || payload.data.tier?.name || 'Custom contribution',
      inline: true,
    },
    { name: 'Amount', value: formatAmount(amount.value, amount.currency), inline: true },
    {
      name: 'Frequency',
      value: formatFrequency(order?.frequency || payload.data.order.interval),
      inline: true,
    },
    { name: 'Subscription ID', value: String(payload.data.subscription.id), inline: true },
    {
      name: 'Contribution ID',
      value: order?.publicId || payload.data.order.publicId || payload.data.order.idV2 || String(payload.data.order.id),
      inline: true,
    },
  ];

  return {
    title: action.title,
    color: action.color,
    url: getContributionUrl(payload, order),
    author: isAnonymous
      ? { name: 'Anonymous contributor' }
      : {
          name: contributor.name || contributor.slug,
          url: `https://opencollective.com/${contributor.slug}`,
          ...(contributor.imageUrl ? { icon_url: contributor.imageUrl } : {}),
        },
    fields,
    footer: { text: 'Open Collective for Biome' },
    timestamp: payload.createdAt,
  };
}

function getContributionUrl(payload: OpenCollectiveSubscriptionPayload, order: OpenCollectiveOrder | null): string {
  const publicId = order?.publicId || payload.data.order.publicId;
  return publicId
    ? `https://opencollective.com/permalink/${encodeURIComponent(publicId)}`
    : `${BIOME_COLLECTIVE_URL}/contributions/${payload.data.order.id}`;
}

function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatFrequency(frequency: string): string {
  const normalized = frequency.toLowerCase();
  if (normalized === 'monthly' || normalized === 'month') {
    return 'Monthly';
  }
  if (normalized === 'yearly' || normalized === 'year') {
    return 'Yearly';
  }
  return frequency;
}
