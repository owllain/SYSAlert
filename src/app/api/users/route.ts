import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function validateIdType(idType: string, identification: string): string | null {
  if (!['cedula', 'dimex', 'pasaporte'].includes(idType)) {
    return 'idType must be one of: cedula, dimex, pasaporte';
  }
  if (idType === 'cedula' && !/^\d{9}$/.test(identification)) {
    return 'La cédula debe tener exactamente 9 dígitos';
  }
  if (idType === 'dimex' && !/^\d{12}$/.test(identification)) {
    return 'El DIMEX debe tener exactamente 12 dígitos';
  }
  if (idType === 'pasaporte' && (identification.length === 0 || identification.length > 30)) {
    return 'El pasaporte debe tener entre 1 y 30 caracteres';
  }
  return null;
}

// GET /api/users - List all users with financial entity
export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, email, identification, idType, role, financialEntityId, createdBy } = body;

    if (!name || !username || !email || !identification || !idType || !financialEntityId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, username, email, identification, idType, financialEntityId' },
        { status: 400 }
      );
    }

    const validRole = role || 'analyst';
    if (!['admin', 'analyst', 'viewer'].includes(validRole)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, analyst, viewer' },
        { status: 400 }
      );
    }

    const idError = validateIdType(idType, identification);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
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

    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        username,
        email,
        identification,
        idType,
        role: validRole,
        financialEntityId,
      },
      include: {
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log entry (non-blocking)
    if (createdBy) {
      try {
        await db.auditLog.create({
          data: {
            action: 'create_user',
            entityType: 'user',
            entityId: user.id,
            details: JSON.stringify({
              name: user.name,
              username: user.username,
              role: user.role,
              financialEntity: entity.name,
            }),
            userId: createdBy,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, username, email, identification, idType, role, financialEntityId, updatedBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const effectiveIdType = idType || existing.idType;
    const effectiveIdentification = identification || existing.identification;
    const idError = validateIdType(effectiveIdType, effectiveIdentification);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    if (role && !['admin', 'analyst', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, analyst, viewer' },
        { status: 400 }
      );
    }

    if (financialEntityId) {
      const entity = await db.financialEntity.findUnique({
        where: { id: financialEntityId },
      });
      if (!entity) {
        return NextResponse.json(
          { error: 'Financial entity not found' },
          { status: 404 }
        );
      }
    }

    if (username && username !== existing.username) {
      const duplicateUsername = await db.user.findUnique({ where: { username } });
      if (duplicateUsername) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
    }

    if (email && email !== existing.email) {
      const duplicateEmail = await db.user.findUnique({ where: { email } });
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (identification !== undefined) updateData.identification = identification;
    if (idType !== undefined) updateData.idType = idType;
    if (role !== undefined) updateData.role = role;
    if (financialEntityId !== undefined) updateData.financialEntityId = financialEntityId;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log entry (non-blocking)
    if (updatedBy) {
      try {
        await db.auditLog.create({
          data: {
            action: 'update_user',
            entityType: 'user',
            entityId: id,
            details: JSON.stringify({
              name: existing.name,
              username: existing.username,
              updatedFields: Object.keys(updateData),
            }),
            userId: updatedBy,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await db.user.delete({ where: { id } });

    // Create audit log entry (non-blocking)
    if (deletedBy) {
      try {
        await db.auditLog.create({
          data: {
            action: 'delete_user',
            entityType: 'user',
            entityId: id,
            details: JSON.stringify({
              name: existing.name,
              username: existing.username,
              role: existing.role,
            }),
            userId: deletedBy,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
