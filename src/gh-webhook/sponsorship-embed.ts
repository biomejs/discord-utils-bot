import type { SponsorshipEvent, SponsorshipTier } from '@octokit/webhooks-types';
import type { APIEmbed, APIEmbedField } from 'discord-api-types/v10';

const COLORS = {
  cancelled: 0xd73a49,
  created: 0x2da44e,
  edited: 0x6e7781,
  pending: 0xbf8700,
  tierChanged: 0x0969da,
} as const;

export function buildSponsorshipEmbed(payload: SponsorshipEvent): APIEmbed {
  const { sponsorship } = payload;
  const fields: APIEmbedField[] = [
    { name: 'Tier', value: sponsorship.tier.name || 'Unnamed tier', inline: true },
    { name: 'Amount', value: formatTierAmount(sponsorship.tier), inline: true },
    { name: 'Billing', value: sponsorship.tier.is_one_time ? 'One-time' : 'Monthly', inline: true },
  ];

  let title: string;
  let color: number;

  switch (payload.action) {
    case 'created':
      title = sponsorship.tier.is_one_time ? 'New one-time sponsorship' : 'New monthly sponsorship';
      color = COLORS.created;
      break;
    case 'pending_cancellation':
      title = 'Sponsorship cancellation scheduled';
      color = COLORS.pending;
      addEffectiveDate(fields, payload.effective_date);
      break;
    case 'cancelled':
      title = 'Sponsorship cancelled';
      color = COLORS.cancelled;
      break;
    case 'pending_tier_change':
      title = 'Sponsorship tier change scheduled';
      color = COLORS.pending;
      fields.push({ name: 'Previous tier', value: formatTier(payload.changes.tier.from), inline: false });
      addEffectiveDate(fields, payload.effective_date);
      break;
    case 'tier_changed':
      title = 'Sponsorship tier changed';
      color = COLORS.tierChanged;
      fields.push({ name: 'Previous tier', value: formatTier(payload.changes.tier.from), inline: false });
      break;
    case 'edited': {
      title = 'Sponsorship privacy changed';
      color = COLORS.edited;
      const previousPrivacy = payload.changes.privacy_level?.from;
      fields.push({
        name: 'Privacy',
        value: previousPrivacy ? `${previousPrivacy} -> ${sponsorship.privacy_level}` : sponsorship.privacy_level,
        inline: false,
      });
      break;
    }
  }

  return {
    title,
    color,
    author: {
      name: sponsorship.sponsor.login,
      url: sponsorship.sponsor.html_url,
      icon_url: sponsorship.sponsor.avatar_url,
    },
    fields,
    footer: { text: `GitHub Sponsors for ${sponsorship.sponsorable.login}` },
  };
}

function addEffectiveDate(fields: APIEmbedField[], effectiveDate: string | undefined): void {
  if (effectiveDate) {
    fields.push({ name: 'Effective date', value: effectiveDate, inline: false });
  }
}

function formatTier(tier: SponsorshipTier): string {
  return `${tier.name || 'Unnamed tier'} (${formatTierAmount(tier)})`;
}

function formatTierAmount(tier: SponsorshipTier): string {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    tier.monthly_price_in_cents / 100,
  );
  return tier.is_custom_amount ? `${amount} (custom)` : amount;
}
