import type { PageServerLoad } from './$types';
import { getArticlesCollection } from '$db/mongo';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const articles = await getArticlesCollection();
	
	// Find article by slug
	const article = await articles.findOne({ 
		slug: params.slug,
		status: 'published' // Only show published articles
	});

	if (!article) {
		throw error(404, 'Article not found');
	}

	// Increment view count
	await articles.updateOne(
		{ _id: article._id },
		{ $inc: { 'stats.views': 1 } }
	);

	// Convert ObjectId to string and return
	return {
		article: {
			...article,
			_id: article._id.toString()
		}
	};
};
