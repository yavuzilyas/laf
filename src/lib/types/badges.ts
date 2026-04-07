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
    name: 'Bastiat',
    description: '',
    icon: '/badge-pp/bastiat-badge-pp.png'
  },
  {
    type: 'rebel',
    minAmount: 1,
    maxAmount: 9.999999,
    name: 'Ludwig',
    description: '',
    icon: '/badge-pp/mises-badge-pp.png'
  },
  {
    type: 'sponsor',
    minAmount: 10,
    name: 'Murray',
    description: '',
    icon: '/badge-pp/murray-badge-pp.png'
  }
];

export const BADGE_ICONS = {
  pioneer: '/badge-pp/bastiat-badge-pp.jpeg',
  rebel: '/badge-pp/mises-badge-pp.jpeg',
  sponsor: '/badge-pp/murray-badge-pp.jpeg'
} as const;
