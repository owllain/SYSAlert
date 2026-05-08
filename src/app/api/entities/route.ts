import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const entities = await db.financialEntity.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      code: entity.code,
      userCount: entity._count.users,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial entities' },
      { status: 500 }
    );
  }
}
