// src/routes/api/reports/[id]/status/+server.ts
import { json } from '@sveltejs/kit';
import { updateReport, getReports } from '$db/queries';
import { notifyReportStatusChange } from '$lib/server/notifications-pg';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = (locals as any)?.user;

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status, notes } = await request.json();
    const reportId = params.id;

    if (!reportId) {
      return json({ error: 'Invalid report ID' }, { status: 400 });
    }

    if (!['reviewing', 'resolved', 'rejected'].includes(status)) {
      return json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the report to find the reporter ID
    const reports = await getReports({ id: reportId });
    const report = reports[0];
    
    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    const updates = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: notes || null
    };

    const result = await updateReport(reportId, updates);

    if (!result) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    // Send notification to the reporter
    if (report.reporter_id && report.reporter_id !== user.id) {
      try {
        await notifyReportStatusChange({
          reportId,
          reporterId: report.reporter_id,
          newStatus: status,
          notes: notes || null,
          moderatorId: user.id
        });
      } catch (notificationError) {
        // Don't fail the request if notification fails
      }
    }

    return json({ success: true, message: 'Report status updated' });
  } catch (error) {
    return json({ error: 'Failed to update report status' }, { status: 500 });
  }
};