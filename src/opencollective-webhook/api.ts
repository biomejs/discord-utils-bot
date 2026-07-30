import type { OpenCollectiveOrder, OpenCollectiveSubscriptionPayload } from './types.ts';

const API_URL = 'https://api.opencollective.com/graphql/v2';

const ORDER_QUERY = `
  query WebhookOrder($order: OrderReferenceInput!) {
    order(order: $order) {
      publicId
      frequency
      amount { value currency }
      tier { name }
      fromAccount { name slug imageUrl isIncognito }
      toAccount { name slug }
    }
  }
`;

export async function fetchOpenCollectiveOrder(
  payload: OpenCollectiveSubscriptionPayload,
  personalToken: string,
): Promise<OpenCollectiveOrder> {
  const orderId = payload.data.order.publicId || payload.data.order.idV2;
  const orderReference = orderId ? { id: orderId } : { legacyId: payload.data.order.id };
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Personal-Token': personalToken,
    },
    body: JSON.stringify({ query: ORDER_QUERY, variables: { order: orderReference } }),
    redirect: 'error',
  });

  if (!response.ok) {
    throw new Error(`Open Collective API returned ${response.status}`);
  }

  const result: unknown = await response.json();
  if (!isOrderResponse(result)) {
    throw new Error('Open Collective API returned an invalid order');
  }

  return result.data.order;
}

function isOrderResponse(value: unknown): value is { data: { order: OpenCollectiveOrder } } {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.order)) {
    return false;
  }

  const { order } = value.data;
  const validTier = order.tier === null || (isRecord(order.tier) && typeof order.tier.name === 'string');
  const validFromAccount =
    order.fromAccount === null ||
    (isRecord(order.fromAccount) &&
      (order.fromAccount.name === null || typeof order.fromAccount.name === 'string') &&
      typeof order.fromAccount.slug === 'string' &&
      (order.fromAccount.imageUrl === null || typeof order.fromAccount.imageUrl === 'string') &&
      typeof order.fromAccount.isIncognito === 'boolean');
  return (
    typeof order.publicId === 'string' &&
    typeof order.frequency === 'string' &&
    isRecord(order.amount) &&
    typeof order.amount.value === 'number' &&
    typeof order.amount.currency === 'string' &&
    validTier &&
    validFromAccount &&
    isRecord(order.toAccount) &&
    (order.toAccount.name === null || typeof order.toAccount.name === 'string') &&
    typeof order.toAccount.slug === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
