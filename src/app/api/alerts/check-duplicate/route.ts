import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/alerts/check-duplicate?personId=XXX&personIdType=XXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const personIdType = searchParams.get('personIdType');

    if (!personId || !personIdType) {
      return NextResponse.json(
        { error: 'personId and personIdType are required' },
        { status: 400 }
      );
    }

    // Validate ID length before checking
    let validLength = false;
    if (personIdType === 'cedula') {
      validLength = /^\d{9}$/.test(personId);
    } else if (personIdType === 'dimex') {
      validLength = /^\d{12}$/.test(personId);
    } else if (personIdType === 'pasaporte') {
      validLength = personId.length > 0;
    }

    if (!validLength) {
      return NextResponse.json({ duplicate: false, existingAlerts: [] });
    }

    // Find active alerts (not dismissed) with the same personId and personIdType
    const existingAlerts = await db.alert.findMany({
      where: {
        personId,
        personIdType,
        status: { not: 'dismissed' },
      },
      include: {
        financialEntity: {
          select: { id: true, name: true, code: true },
        },
        creator: {
          select: { id: true, name: true, username: true, financialEntity: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      duplicate: existingAlerts.length > 0,
      existingAlerts,
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
