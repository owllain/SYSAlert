import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/alerts/bulk - Bulk status change for multiple alerts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds, status, updatedBy } = body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!status || !['active', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: active, resolved, dismissed' },
        { status: 400 }
      );
    }

    // Fetch existing alerts to get their current status
    const existingAlerts = await db.alert.findMany({
      where: { id: { in: alertIds } },
    });

    // Update all alerts
    const result = await db.alert.updateMany({
      where: { id: { in: alertIds } },
      data: { status },
    });

    // Create audit log entries for each alert (non-blocking)
    for (const alert of existingAlerts) {
      if (alert.status !== status) {
        try {
          await db.auditLog.create({
            data: {
              action: 'status_change',
              entityType: 'alert',
              entityId: alert.id,
              details: JSON.stringify({
                from: alert.status,
                to: status,
                personName: alert.personName,
                bulk: true,
              }),
              userId: updatedBy || alert.createdBy,
            },
          });
        } catch (auditError) {
          console.warn('Audit log creation failed:', auditError);
        }
      }
    }

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk updating alerts:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update alerts' },
      { status: 500 }
    );
  }
}
