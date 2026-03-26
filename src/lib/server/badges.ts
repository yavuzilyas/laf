import { getDonations } from '$db/queries';
import type { BadgeType, Badge } from '$lib/types/badges';
import { DONATION_BADGE_RULES } from '$lib/types/badges';

export const calculateDonationBadge = async (userId: string): Promise<Badge | null> => {
  try {
    // Get user's donations from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const donations = await getDonations({
      user_id: userId,
      from_date: oneYearAgo,
      status: 'approved'
    });

    // Calculate total donated amount in the last year
    const totalAmount = donations.reduce((sum: number, donation: any) => {
      return sum + parseFloat(donation.amount);
    }, 0);

    // Only award badges if user has donated something
    if (totalAmount <= 0) {
      return null;
    }

    // Find the appropriate badge based on total amount
    for (const rule of DONATION_BADGE_RULES.sort((a, b) => b.minAmount - a.minAmount)) {
      if (totalAmount >= rule.minAmount && (!rule.maxAmount || totalAmount <= rule.maxAmount)) {
        return {
          id: `${userId}-${rule.type}`,
          type: rule.type,
          name: rule.name,
          description: `Donated ${totalAmount.toFixed(6)} XMR in a year`,
          icon: rule.icon
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error calculating donation badge:', error);
    return null;
  }
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const badges: Badge[] = [];
  
  try {
    // Calculate donation badge
    const donationBadge = await calculateDonationBadge(userId);
    if (donationBadge) {
      badges.push(donationBadge);
    }
    
    // Future: Add other badge types here
    // const contributionBadge = await calculateContributionBadge(userId);
    // if (contributionBadge) badges.push(contributionBadge);
    
    return badges;
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
};

export const getBadgeByType = (type: BadgeType): Badge | null => {
  const rule = DONATION_BADGE_RULES.find(r => r.type === type);
  if (!rule) return null;
  
  return {
    id: rule.type,
    type: rule.type,
    name: rule.name,
    description: rule.description,
    icon: rule.icon
  };
};
