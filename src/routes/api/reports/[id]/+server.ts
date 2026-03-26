// src/routes/api/reports/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = (locals as any)?.user;

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reportId = params.id;

    if (!reportId) {
      return json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const sql = 'DELETE FROM reports WHERE id = $1';
    const result = await query(sql, [reportId]);

    if (result.rowCount === 0) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    return json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    return json({ error: 'Failed to delete report' }, { status: 500 });
  }
};
