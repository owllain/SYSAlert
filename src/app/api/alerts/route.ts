import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function validatePersonIdType(personIdType: string, personId: string): string | null {
  if (!['cedula', 'dimex', 'pasaporte'].includes(personIdType)) {
    return 'personIdType must be one of: cedula, dimex, pasaporte';
  }
  if (personIdType === 'cedula' && !/^\d{9}$/.test(personId)) {
    return 'La cédula debe tener exactamente 9 dígitos';
  }
  if (personIdType === 'dimex' && !/^\d{12}$/.test(personId)) {
    return 'El DIMEX debe tener exactamente 12 dígitos';
  }
  if (personIdType === 'pasaporte' && (personId.length === 0 || personId.length > 30)) {
    return 'El pasaporte debe tener entre 1 y 30 caracteres';
  }
  return null;
}

// GET /api/alerts - List alerts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const today = searchParams.get('today');
    const month = searchParams.get('month');
    const entityId = searchParams.get('entityId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const days = searchParams.get('days');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.createdBy = userId;
    }

    if (entityId) {
      where.financialEntityId = entityId;
    }

    if (search) {
      where.personId = search;
    }

    if (from && to) {
      // Custom date range overrides month/today
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (days) {
      // Past N days
      const n = parseInt(days, 10);
      if (!isNaN(n) && n > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (n - 1));
        startDate.setHours(0, 0, 0, 0);
        where.createdAt = {
          gte: startDate,
        };
      }
    } else if (today === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (month === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const alerts = await db.alert.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create an alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      economicAffectation,
      personName,
      personId,
      personIdType,
      description,
      createdBy,
      financialEntityId,
    } = body;

    if (!profile || economicAffectation === undefined || !personName || !personId || !personIdType || !description || !createdBy || !financialEntityId) {
      return NextResponse.json(
        { error: 'Missing required fields: profile, economicAffectation, personName, personId, personIdType, description, createdBy, financialEntityId' },
        { status: 400 }
      );
    }

    if (!['receptor', 'victima'].includes(profile)) {
      return NextResponse.json(
        { error: 'Profile must be one of: receptor, victima' },
        { status: 400 }
      );
    }

    const idError = validatePersonIdType(personIdType, personId);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    const creator = await db.user.findUnique({ where: { id: createdBy } });
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator user not found' },
        { status: 404 }
      );
    }

    const entity = await db.financialEntity.findUnique({
      where: { id: financialEntityId },
    });
    if (!entity) {
      return NextResponse.json(
        { error: 'Financial entity not found' },
        { status: 404 }
      );
    }

    const alert = await db.alert.create({
      data: {
        profile,
        economicAffectation: Boolean(economicAffectation),
        personName,
        personId,
        personIdType,
        description,
        createdBy,
        financialEntityId,
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log entry (non-blocking, resilient to schema changes)
    try {
      await db.auditLog.create({
        data: {
          action: 'create_alert',
          entityType: 'alert',
          entityId: alert.id,
          details: JSON.stringify({
            profile: alert.profile,
            personName: alert.personName,
            personId: alert.personId,
            financialEntity: entity.name,
          }),
          userId: createdBy,
        },
      });
    } catch (auditError) {
      console.warn('Audit log creation failed (schema may need update):', auditError);
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// PUT /api/alerts - Update an alert
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, profile, economicAffectation, personName, personId, personIdType, description, status, updatedBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.alert.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (profile && !['receptor', 'victima'].includes(profile)) {
      return NextResponse.json(
        { error: 'Profile must be one of: receptor, victima' },
        { status: 400 }
      );
    }

    if (status && !['active', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: active, resolved, dismissed' },
        { status: 400 }
      );
    }

    const effectivePersonIdType = personIdType || existing.personIdType;
    const effectivePersonId = personId || existing.personId;
    const idError = validatePersonIdType(effectivePersonIdType, effectivePersonId);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (profile !== undefined) updateData.profile = profile;
    if (economicAffectation !== undefined) updateData.economicAffectation = Boolean(economicAffectation);
    if (personName !== undefined) updateData.personName = personName;
    if (personId !== undefined) updateData.personId = personId;
    if (personIdType !== undefined) updateData.personIdType = personIdType;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const alert = await db.alert.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log entry (non-blocking, resilient to schema changes)
    try {
      if (status !== undefined && status !== existing.status) {
        // Status change - record as status_change
        await db.auditLog.create({
          data: {
            action: 'status_change',
            entityType: 'alert',
            entityId: id,
            details: JSON.stringify({
              from: existing.status,
              to: status,
              personName: existing.personName,
            }),
            userId: updatedBy || existing.createdBy,
          },
        });
      } else {
        // Regular update
        await db.auditLog.create({
          data: {
            action: 'update_alert',
            entityType: 'alert',
            entityId: id,
            details: JSON.stringify({
              personName: existing.personName,
              updatedFields: Object.keys(updateData),
            }),
            userId: updatedBy || existing.createdBy,
          },
        });
      }
    } catch (auditError) {
      console.warn('Audit log creation failed (schema may need update):', auditError);
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy');

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.alert.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    await db.alert.delete({ where: { id } });

    // Create audit log entry (non-blocking, resilient to schema changes)
    try {
      await db.auditLog.create({
        data: {
          action: 'delete_alert',
          entityType: 'alert',
          entityId: id,
          details: JSON.stringify({
            personName: existing.personName,
            personId: existing.personId,
            status: existing.status,
          }),
          userId: deletedBy || existing.createdBy,
        },
      });
    } catch (auditError) {
      console.warn('Audit log creation failed (schema may need update):', auditError);
    }

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
