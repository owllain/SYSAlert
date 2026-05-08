import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/audit-logs - List audit logs with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const count = searchParams.get('count');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    if (from && to) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (from) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startDate };
    } else if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { lte: endDate };
    }

    // If count param is provided, return only the total count
    if (count === 'true') {
      const total = await db.auditLog.count({ where });
      return NextResponse.json({ total });
    }

    const auditLogs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.auditLog.count({ where });

    return NextResponse.json({ data: auditLogs, total });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
