import { describe, expect, it } from 'vitest';
import { buildOpenCollectiveSubscriptionEmbed } from './subscription-embed.ts';
import { makeOpenCollectiveOrder, makeOpenCollectivePayload } from './test-fixtures.ts';

describe('buildOpenCollectiveSubscriptionEmbed', () => {
  it.each([
    ['subscription.canceled', 'Open Collective subscription cancelled', 0xd73a49],
    ['subscription.paused', 'Open Collective subscription paused', 0xbf8700],
    ['subscription.resumed', 'Open Collective subscription resumed', 0x2da44e],
  ] as const)('formats the %s activity', (type, title, color) => {
    const embed = buildOpenCollectiveSubscriptionEmbed(makeOpenCollectivePayload(type), makeOpenCollectiveOrder());

    expect(embed.title).toBe(title);
    expect(embed.color).toBe(color);
    expect(embed.author).toEqual({
      name: 'Sponsor Inc.',
      url: 'https://opencollective.com/sponsor',
      icon_url: 'https://images.opencollective.com/sponsor.png',
    });
    expect(embed.fields).toContainEqual({ name: 'Tier', value: 'Backer', inline: true });
    expect(embed.fields).toContainEqual({ name: 'Amount', value: '$5.00', inline: true });
    expect(embed.fields).toContainEqual({ name: 'Frequency', value: 'Monthly', inline: true });
  });

  it('does not expose an incognito contributor', () => {
    const order = makeOpenCollectiveOrder();
    if (order.fromAccount) {
      order.fromAccount.isIncognito = true;
    }

    const embed = buildOpenCollectiveSubscriptionEmbed(makeOpenCollectivePayload(), order);

    expect(embed.author).toEqual({ name: 'Anonymous contributor' });
  });

  it('uses payload details when enrichment is unavailable', () => {
    const payload = makeOpenCollectivePayload();
    payload.data.order.totalAmount = 1250;
    payload.data.order.currency = 'EUR';
    payload.data.order.interval = 'year';
    payload.data.tier = { name: 'Supporter' };

    const embed = buildOpenCollectiveSubscriptionEmbed(payload, null);

    expect(embed.author).toEqual({ name: 'Anonymous contributor' });
    expect(embed.fields).toContainEqual({ name: 'Tier', value: 'Supporter', inline: true });
    expect(embed.fields).toContainEqual({ name: 'Amount', value: '€12.50', inline: true });
    expect(embed.fields).toContainEqual({ name: 'Frequency', value: 'Yearly', inline: true });
  });
});
