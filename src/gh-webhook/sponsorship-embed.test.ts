import type { SponsorshipEvent, SponsorshipTier } from '@octokit/webhooks-types';
import { describe, expect, it } from 'vitest';
import { buildSponsorshipEmbed } from './sponsorship-embed.ts';

const TIER: SponsorshipTier = {
  node_id: 'tier-1',
  created_at: '2026-01-01T00:00:00Z',
  description: 'Support Biome',
  monthly_price_in_cents: 500,
  monthly_price_in_dollars: 5,
  name: 'Supporter',
  is_one_time: false,
  is_custom_amount: false,
};

function makePayload(action: SponsorshipEvent['action'], overrides: Record<string, unknown> = {}): SponsorshipEvent {
  const base = {
    action,
    sponsorship: {
      node_id: 'sponsorship-1',
      created_at: '2026-07-27T12:00:00Z',
      sponsorable: makeUser('biomejs'),
      sponsor: makeUser('sponsor'),
      privacy_level: 'public',
      tier: TIER,
    },
    sender: makeUser('sponsor'),
    ...overrides,
  };

  return base as SponsorshipEvent;
}

function makeUser(login: string) {
  return {
    login,
    id: 1,
    node_id: `${login}-node`,
    avatar_url: `https://github.com/${login}.png`,
    gravatar_id: '',
    url: `https://api.github.com/users/${login}`,
    html_url: `https://github.com/${login}`,
    followers_url: '',
    following_url: '',
    gists_url: '',
    starred_url: '',
    subscriptions_url: '',
    organizations_url: '',
    repos_url: '',
    events_url: '',
    received_events_url: '',
    type: 'User' as const,
    site_admin: false,
  };
}

describe('buildSponsorshipEmbed', () => {
  it('builds a new monthly sponsorship embed', () => {
    const embed = buildSponsorshipEmbed(makePayload('created'));

    expect(embed.title).toBe('New monthly sponsorship');
    expect(embed.color).toBe(0x2da44e);
    expect(embed.author).toEqual({
      name: 'sponsor',
      url: 'https://github.com/sponsor',
      icon_url: 'https://github.com/sponsor.png',
    });
    expect(embed.fields).toContainEqual({ name: 'Amount', value: '$5.00', inline: true });
  });

  it('identifies one-time custom sponsorships', () => {
    const payload = makePayload('created');
    payload.sponsorship.tier = { ...TIER, monthly_price_in_cents: 2500, is_one_time: true, is_custom_amount: true };
    const embed = buildSponsorshipEmbed(payload);

    expect(embed.title).toBe('New one-time sponsorship');
    expect(embed.fields).toContainEqual({ name: 'Amount', value: '$25.00 (custom)', inline: true });
    expect(embed.fields).toContainEqual({ name: 'Billing', value: 'One-time', inline: true });
  });

  it('builds a pending cancellation embed with its effective date', () => {
    const embed = buildSponsorshipEmbed(
      makePayload('pending_cancellation', { effective_date: '2026-08-01T00:00:00Z' }),
    );

    expect(embed.title).toBe('Sponsorship cancellation scheduled');
    expect(embed.fields).toContainEqual({
      name: 'Effective date',
      value: '2026-08-01T00:00:00Z',
      inline: false,
    });
  });

  it('builds a cancelled sponsorship embed', () => {
    const embed = buildSponsorshipEmbed(makePayload('cancelled'));

    expect(embed.title).toBe('Sponsorship cancelled');
    expect(embed.color).toBe(0xd73a49);
  });

  it('builds a pending tier change with its previous tier and effective date', () => {
    const embed = buildSponsorshipEmbed(
      makePayload('pending_tier_change', {
        changes: { tier: { from: { ...TIER, name: 'Backer', monthly_price_in_cents: 100 } } },
        effective_date: '2026-08-01T00:00:00Z',
      }),
    );

    expect(embed.title).toBe('Sponsorship tier change scheduled');
    expect(embed.fields).toContainEqual({ name: 'Previous tier', value: 'Backer ($1.00)', inline: false });
    expect(embed.fields).toContainEqual({
      name: 'Effective date',
      value: '2026-08-01T00:00:00Z',
      inline: false,
    });
  });

  it('builds a completed tier change with its previous tier', () => {
    const embed = buildSponsorshipEmbed(
      makePayload('tier_changed', {
        changes: { tier: { from: { ...TIER, name: 'Backer', monthly_price_in_cents: 100 } } },
      }),
    );

    expect(embed.title).toBe('Sponsorship tier changed');
    expect(embed.color).toBe(0x0969da);
    expect(embed.fields).toContainEqual({ name: 'Previous tier', value: 'Backer ($1.00)', inline: false });
  });

  it('builds a privacy change with the old and new values', () => {
    const payload = makePayload('edited', { changes: { privacy_level: { from: 'public' } } });
    payload.sponsorship.privacy_level = 'private';
    const embed = buildSponsorshipEmbed(payload);

    expect(embed.title).toBe('Sponsorship privacy changed');
    expect(embed.fields).toContainEqual({ name: 'Privacy', value: 'public -> private', inline: false });
  });
});
