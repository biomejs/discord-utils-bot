import type {
  OpenCollectiveOrder,
  OpenCollectiveSubscriptionPayload,
  OpenCollectiveSubscriptionType,
} from './types.ts';

export function makeOpenCollectivePayload(
  type: OpenCollectiveSubscriptionType = 'subscription.canceled',
): OpenCollectiveSubscriptionPayload {
  return {
    id: 42,
    createdAt: '2026-07-30T10:00:00Z',
    type,
    CollectiveId: 693207,
    data: {
      subscription: { id: 456 },
      order: {
        id: 738113,
        idV2: 'encoded-order-id',
        publicId: 'order-public-id',
        totalAmount: 500,
        currency: 'USD',
        interval: 'month',
      },
      tier: { name: 'Backer' },
    },
  };
}

export function makeOpenCollectiveOrder(): OpenCollectiveOrder {
  return {
    publicId: 'order-public-id',
    frequency: 'MONTHLY',
    amount: { value: 5, currency: 'USD' },
    tier: { name: 'Backer' },
    fromAccount: {
      name: 'Sponsor Inc.',
      slug: 'sponsor',
      imageUrl: 'https://images.opencollective.com/sponsor.png',
      isIncognito: false,
    },
    toAccount: { name: 'Biome', slug: 'biome' },
  };
}
