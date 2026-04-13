import type { RequestHandler } from "@sveltejs/kit";
import { getUsers, updateUser } from "$db/queries";
import { error, json } from "@sveltejs/kit";

// Simple rate limiting: max 15 profile updates per 5 minutes per user
const updateAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 15;

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
        const fullUserDoc = await getUsers({ id: userId });
        const user = fullUserDoc[0];
        
        if (!user) {
            throw error(404, 'User not found');
        }

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
            'email',
            'matrix_username'
        ];

        const updateData: any = {};
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                const value = typeof profileData[field] === 'string' ? profileData[field].trim() : profileData[field];
                
                // Treat empty strings as null for optional fields to avoid unique constraint issues
                if (field === 'email' || field === 'phone_number' || field === 'matrix_username' || field === 'location') {
                    updateData[field] = value || null;
                } else {
                    updateData[field] = value;
                }
            }
        }

        // Handle special cases for field name mapping
        if (profileData.avatar !== undefined) {
            updateData.avatar_url = profileData.avatar;
            delete updateData.avatar;
        }

        // Handle phone number field mapping (camelCase to snake_case)
        if (profileData.phoneNumber !== undefined) {
            const val = typeof profileData.phoneNumber === 'string' ? profileData.phoneNumber.trim() : profileData.phoneNumber;
            updateData.phone_number = val || null;
            delete updateData.phoneNumber;
        }

        // Handle matrix username field mapping (camelCase to snake_case)
        if (profileData.matrixUsername !== undefined) {
            const val = typeof profileData.matrixUsername === 'string' ? profileData.matrixUsername.trim() : profileData.matrixUsername;
            updateData.matrix_username = val || null;
            delete updateData.matrixUsername;
        }

        // Handle email field from form data
        if (profileData.email !== undefined) {
            const val = typeof profileData.email === 'string' ? profileData.email.trim() : profileData.email;
            updateData.email = val || null;
        }

        // Handle preferences updates
        if (profileData.website !== undefined || 
            profileData.interests !== undefined || profileData.bannerColor !== undefined || 
            profileData.bannerImage !== undefined || profileData.socialLinks !== undefined ||
            profileData.phoneNumberVisible !== undefined || profileData.emailVisible !== undefined) {
            
            const currentPreferences = user.preferences || {};
            updateData.preferences = {
                ...currentPreferences,
                ...(profileData.website !== undefined && { website: profileData.website }),
                ...(profileData.interests !== undefined && { interests: profileData.interests }),
                ...(profileData.bannerColor !== undefined && { bannerColor: profileData.bannerColor }),
                ...(profileData.bannerImage !== undefined && { bannerImage: profileData.bannerImage }),
                ...(profileData.socialLinks !== undefined && { socialLinks: profileData.socialLinks }),
                ...(profileData.phoneNumberVisible !== undefined && { phoneNumberVisible: profileData.phoneNumberVisible }),
                ...(profileData.emailVisible !== undefined && { emailVisible: profileData.emailVisible })
            };
            
            // Clean up temporary fields
            delete updateData.website;
            delete updateData.interests;
            delete updateData.bannerColor;
            delete updateData.bannerImage;
            delete updateData.socialLinks;
            delete updateData.phoneNumberVisible;
            delete updateData.emailVisible;
        }

        // Update the user document
        const result = await updateUser(user.id, updateData);

        if (!result) {
            throw error(500, 'Failed to update user in database');
        }

        return json({ 
            success: true, 
            message: 'Profile updated successfully',
            updatedFields: Object.keys(updateData)
        });

    } catch (err) {
        console.error('Error in profile update API:', err);
        throw error(500, 'Failed to update profile: ' + (err instanceof Error ? err.message : String(err)));
    }
}
