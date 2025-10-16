import type { PageServerLoad } from './$types';
import { getUsersCollection } from '$db/mongo';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null
		};
	}

	// Get additional user data from database
	const users = await getUsersCollection();
	const userData = await users.findOne(
		{ nickname: locals.user.nickname },
		{ 
			projection: { 
				password: 0, // Exclude password
				mnemonicHashes: 0 // Exclude mnemonic hashes
			} 
		}
	);

	return {
		user: userData ? {
			...userData,
			_id: userData._id.toString() // Convert ObjectId to string
		} : locals.user
	};
};
