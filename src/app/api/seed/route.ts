import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const ENTITIES = [
  { name: 'Banco Popular', code: 'BP' },
  { name: 'Banco de Costa Rica', code: 'BCR' },
  { name: 'Banco Nacional de Costa Rica', code: 'BNC' },
];

export async function GET() {
  try {
    const results = [];

    for (const entity of ENTITIES) {
      const existing = await db.financialEntity.findUnique({
        where: { code: entity.code },
      });

      if (!existing) {
        const created = await db.financialEntity.create({
          data: entity,
        });
        results.push({ ...created, created: true });
      } else {
        results.push({ ...existing, created: false });
      }
    }

    // Create default admin user if no users exist
    let defaultUser = null;
    const userCount = await db.user.count();
    if (userCount === 0) {
      const bpEntity = await db.financialEntity.findUnique({ where: { code: 'BP' } });
      if (bpEntity) {
        defaultUser = await db.user.create({
          data: {
            name: 'Administrador del Sistema',
            username: 'admin',
            email: 'admin@alertas.cr',
            identification: '000000000',
            idType: 'cedula',
            role: 'admin',
            financialEntityId: bpEntity.id,
          },
          include: {
            financialEntity: {
              select: { name: true, code: true },
            },
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Seed completed successfully',
      entities: results,
      defaultUser: defaultUser ? {
        id: defaultUser.id,
        name: defaultUser.name,
        username: defaultUser.username,
        email: defaultUser.email,
        role: defaultUser.role,
        financialEntityId: defaultUser.financialEntityId,
        financialEntityName: defaultUser.financialEntity.name,
      } : null,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
