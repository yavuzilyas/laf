export type BadgeType = 'pioneer' | 'rebel' | 'sponsor';

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge extends Badge {
  userId: string;
  earnedAt: Date;
}

export interface DonationBadgeRule {
  type: BadgeType;
  minAmount: number;
  maxAmount?: number;
  name: string;
  description: string;
  icon: string;
}

export const DONATION_BADGE_RULES: DonationBadgeRule[] = [
  {
    type: 'pioneer',
    minAmount: 0.000001,
    maxAmount: 0.999999,
    name: 'Pioneer',
    description: '',
    icon: '🌟'
  },
  {
    type: 'rebel',
    minAmount: 1,
    maxAmount: 9.999999,
    name: 'Rebel',
    description: '',
    icon: '⚡'
  },
  {
    type: 'sponsor',
    minAmount: 10,
    name: 'Sponsor',
    description: '',
    icon: '💎'
  }
];

export const BADGE_ICONS = {
  pioneer: '🌟',
  rebel: '⚡',
  sponsor: '💎'
} as const;
