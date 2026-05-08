import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/alerts/bookmark?userId=XXX - Get bookmarked alert IDs for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const bookmarks = await db.bookmarkedAlert.findMany({
      where: { userId },
      select: { alertId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookmarks.map(b => b.alertId));
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

// POST /api/alerts/bookmark - Add or remove a bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, alertId, action } = body;

    if (!userId || !alertId || !action) {
      return NextResponse.json(
        { error: 'userId, alertId, and action are required' },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "add" or "remove"' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      // Check if already bookmarked
      const existing = await db.bookmarkedAlert.findUnique({
        where: {
          userId_alertId: { userId, alertId },
        },
      });

      if (existing) {
        return NextResponse.json({ bookmarked: true });
      }

      await db.bookmarkedAlert.create({
        data: { userId, alertId },
      });

      // Audit log
      try {
        await db.auditLog.create({
          data: {
            action: 'bookmark_add',
            entityType: 'alert',
            entityId: alertId,
            details: JSON.stringify({ bookmarkAction: 'add' }),
            userId,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }

      return NextResponse.json({ bookmarked: true });
    } else {
      // Remove bookmark
      await db.bookmarkedAlert.deleteMany({
        where: { userId, alertId },
      });

      // Audit log
      try {
        await db.auditLog.create({
          data: {
            action: 'bookmark_remove',
            entityType: 'alert',
            entityId: alertId,
            details: JSON.stringify({ bookmarkAction: 'remove' }),
            userId,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }

      return NextResponse.json({ bookmarked: false });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 }
    );
  }
}
