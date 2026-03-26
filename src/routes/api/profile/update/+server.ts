import type { RequestHandler } from "@sveltejs/kit";
import { getUsers, updateUser } from "$db/queries";
import { error, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }: any) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
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
            'preferences'
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

        // Handle preferences updates
        if (profileData.location !== undefined || profileData.website !== undefined || 
            profileData.interests !== undefined || profileData.bannerColor !== undefined || 
            profileData.bannerImage !== undefined || profileData.socialLinks !== undefined) {
            
            const currentPreferences = locals.user.preferences || {};
            updateData.preferences = {
                ...currentPreferences,
                ...(profileData.location && { location: profileData.location }),
                ...(profileData.website && { website: profileData.website }),
                ...(profileData.interests && { interests: profileData.interests }),
                ...(profileData.bannerColor && { bannerColor: profileData.bannerColor }),
                ...(profileData.bannerImage && { bannerImage: profileData.bannerImage }),
                ...(profileData.socialLinks && { socialLinks: profileData.socialLinks })
            };
            
            delete updateData.location;
            delete updateData.website;
            delete updateData.interests;
            delete updateData.bannerColor;
            delete updateData.bannerImage;
            delete updateData.socialLinks;
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
        console.error('Profile update error:', err);
        throw error(500, 'Failed to update profile');
    }
};
