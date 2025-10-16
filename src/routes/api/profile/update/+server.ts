import type { RequestHandler } from "@sveltejs/kit";
import { getUsersCollection } from "$db/mongo";
import { error, json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const profileData = await request.json();
        const users = await getUsersCollection();

        // Validate and sanitize the data
        const allowedFields = [
            'name', 
            'surname', 
            'bio', 
            'location', 
            'website', 
            'birthDate', 
            'interests',
            'socialLinks'
        ];

        const updateData: any = {};
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                updateData[field] = profileData[field];
            }
        }

        // Add updated timestamp
        updateData.updatedAt = new Date();

        // Update the user document
        const result = await users.updateOne(
            { nickname: locals.user.nickname },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
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
