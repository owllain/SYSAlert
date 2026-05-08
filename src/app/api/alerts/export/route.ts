import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/alerts/export - Export alerts as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const entityId = searchParams.get('entityId');
    const profile = searchParams.get('profile');
    const status = searchParams.get('status');
    const today = searchParams.get('today');
    const month = searchParams.get('month');

    const where: Record<string, unknown> = {};

    if (entityId) {
      where.financialEntityId = entityId;
    }

    if (profile && ['receptor', 'victima'].includes(profile)) {
      where.profile = profile;
    }

    if (status && ['active', 'resolved', 'dismissed'].includes(status)) {
      where.status = status;
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

    // CSV Headers
    const headers = [
      'ID',
      'Perfil',
      'Nombre',
      'Identificación',
      'Tipo ID',
      'Afectación Económica',
      'Descripción',
      'Estado',
      'Entidad',
      'Creado Por',
      'Fecha Creación',
    ];

    const profileLabels: Record<string, string> = { receptor: 'Receptor', victima: 'Víctima' };
    const statusLabels: Record<string, string> = { active: 'Activa', resolved: 'Resuelta', dismissed: 'Descartada' };
    const idTypeLabels: Record<string, string> = { cedula: 'Cédula', dimex: 'DIMEX', pasaporte: 'Pasaporte' };

    function escapeCSV(value: string): string {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }

    const rows = alerts.map((alert) =>
      [
        escapeCSV(alert.id),
        escapeCSV(profileLabels[alert.profile] || alert.profile),
        escapeCSV(alert.personName),
        escapeCSV(alert.personId),
        escapeCSV(idTypeLabels[alert.personIdType] || alert.personIdType),
        alert.economicAffectation ? 'Sí' : 'No',
        escapeCSV(alert.description),
        escapeCSV(statusLabels[alert.status] || alert.status),
        escapeCSV(alert.financialEntity?.name || ''),
        escapeCSV(alert.creator?.name || ''),
        escapeCSV(new Date(alert.createdAt).toLocaleString('es-CR')),
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    const filename = `alertas_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting alerts:', error);
    return NextResponse.json(
      { error: 'Failed to export alerts' },
      { status: 500 }
    );
  }
}
