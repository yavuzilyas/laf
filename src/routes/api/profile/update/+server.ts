import type { RequestHandler } from "@sveltejs/kit";
import { getUsers, updateUser } from "$db/queries";
import { error, json } from "@sveltejs/kit";

// Simple rate limiting: max 5 profile updates per 5 minutes per user
const updateAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const attempts = updateAttempts.get(userId) || [];
  
  const validAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (validAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    updateAttempts.set(userId, validAttempts);
    return true;
  }
  
  validAttempts.push(now);
  updateAttempts.set(userId, validAttempts);
  return false;
}

export const POST: RequestHandler = async ({ request, locals }: any) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    // Rate limit check
    const userId = locals.user.id?.toString();
    if (!userId) {
        throw error(400, 'Invalid user');
    }
    
    if (isRateLimited(userId)) {
        throw error(429, 'Too many updates. Please wait a few minutes.');
    }

    try {
        const profileData = await request.json();

        // Validate and sanitize the data
        const allowedFields = [
            'name', 
            'surname', 
            'username',
            'bio', 
            'avatar_url',
            'preferences',
            'phone_number',
            'location',
            'email'
        ];

        const updateData: any = {};
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                updateData[field] = profileData[field];
            }
        }

        // Handle special cases for field name mapping
        if (profileData.avatar !== undefined) {
            updateData.avatar_url = profileData.avatar;
            delete updateData.avatar;
        }

        // Handle phone number field mapping (camelCase to snake_case)
        if (profileData.phoneNumber !== undefined) {
            updateData.phone_number = profileData.phoneNumber;
            delete updateData.phoneNumber;
        }

        // Handle email field from form data
        if (profileData.email !== undefined) {
            updateData.email = profileData.email;
        }

        // Handle preferences updates (no longer includes location)
        if (profileData.website !== undefined || 
            profileData.interests !== undefined || profileData.bannerColor !== undefined || 
            profileData.bannerImage !== undefined || profileData.socialLinks !== undefined ||
            profileData.phoneNumberVisible !== undefined || profileData.emailVisible !== undefined) {
            
            const currentPreferences = locals.user.preferences || {};
            updateData.preferences = {
                ...currentPreferences,
                ...(profileData.website && { website: profileData.website }),
                ...(profileData.interests && { interests: profileData.interests }),
                ...(profileData.bannerColor && { bannerColor: profileData.bannerColor }),
                ...(profileData.bannerImage && { bannerImage: profileData.bannerImage }),
                ...(profileData.socialLinks && { socialLinks: profileData.socialLinks }),
                ...(profileData.phoneNumberVisible !== undefined && { phoneNumberVisible: profileData.phoneNumberVisible }),
                ...(profileData.emailVisible !== undefined && { emailVisible: profileData.emailVisible })
            };
            
            delete updateData.website;
            delete updateData.interests;
            delete updateData.bannerColor;
            delete updateData.bannerImage;
            delete updateData.socialLinks;
            delete updateData.phoneNumberVisible;
            delete updateData.emailVisible;
        }

        // Update the user document
        const result = await updateUser(locals.user.id, updateData);

        if (!result) {
            throw error(404, 'User not found');
        }

        return json({ 
            success: true, 
            message: 'Profile updated successfully',
            updatedFields: Object.keys(updateData)
        });

    } catch (err) {
        throw error(500, 'Failed to update profile');
    }
};
