import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/notes - List notes for an alert (query param: alertId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId query parameter is required' },
        { status: 400 }
      );
    }

    const notes = await db.note.findMany({
      where: { alertId },
      include: {
        user: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, alertId, userId } = body;

    if (!content || !alertId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: content, alertId, userId' },
        { status: 400 }
      );
    }

    const alert = await db.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const note = await db.note.create({
      data: {
        content,
        alertId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
      },
    });

    // Create audit log entry (non-blocking, resilient to schema changes)
    try {
      await db.auditLog.create({
        data: {
          action: 'add_note',
          entityType: 'alert',
          entityId: alertId,
          details: JSON.stringify({
            noteId: note.id,
            noteContent: content.substring(0, 100),
            personName: alert.personName,
          }),
          userId,
        },
      });
    } catch (auditError) {
      console.warn('Audit log creation failed (schema may need update):', auditError);
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    await db.note.delete({ where: { id } });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
