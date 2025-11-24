// src/routes/moderation/+page.server.ts
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const user = (locals as any)?.user;
  
  // Check if user is moderator or admin
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    throw redirect(303, '/403');
  }

  return {
    user
  };
};

