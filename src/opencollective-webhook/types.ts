export const OPEN_COLLECTIVE_SUBSCRIPTION_TYPES = [
  'subscription.canceled',
  'subscription.paused',
  'subscription.resumed',
] as const;

export type OpenCollectiveSubscriptionType = (typeof OPEN_COLLECTIVE_SUBSCRIPTION_TYPES)[number];

export type OpenCollectiveSubscriptionPayload = {
  id: number;
  createdAt: string;
  type: OpenCollectiveSubscriptionType;
  CollectiveId: number;
  data: {
    subscription: { id: number };
    order: {
      id: number;
      idV2?: string;
      publicId?: string | null;
      totalAmount: number;
      currency: string;
      interval: string;
    };
    tier?: {
      name?: string | null;
    } | null;
  };
};

export type OpenCollectiveOrder = {
  publicId: string;
  frequency: string;
  amount: { value: number; currency: string };
  tier: { name: string } | null;
  fromAccount: OpenCollectiveAccount | null;
  toAccount: Pick<OpenCollectiveAccount, 'name' | 'slug'>;
};

type OpenCollectiveAccount = {
  name: string | null;
  slug: string;
  imageUrl: string | null;
  isIncognito: boolean;
};
