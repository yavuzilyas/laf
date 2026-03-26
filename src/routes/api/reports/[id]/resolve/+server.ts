// src/routes/api/reports/[id]/resolve/+server.ts
import { json } from '@sveltejs/kit';
import { updateReport } from '$db/queries';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = (locals as any)?.user;

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { approved, resolution } = await request.json();
    const reportId = params.id;

    if (!reportId) {
      return json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const updates = {
      status: approved ? 'resolved' : 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      resolution: resolution || (approved ? 'Approved' : 'Rejected')
    };

    const result = await updateReport(reportId, updates);

    if (!result) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    return json({ success: true, message: 'Report resolved' });
  } catch (error) {
    console.error('Resolve report error:', error);
    return json({ error: 'Failed to resolve report' }, { status: 500 });
  }
};
