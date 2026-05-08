import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET /api/alerts/export - Export alerts as CSV or XLSX
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
    const format = searchParams.get('format') || 'csv';

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

    const profileLabels: Record<string, string> = { receptor: 'Receptor', victima: 'Víctima' };
    const statusLabels: Record<string, string> = { active: 'Activa', resolved: 'Resuelta', dismissed: 'Descartada' };
    const idTypeLabels: Record<string, string> = { cedula: 'Cédula', dimex: 'DIMEX', pasaporte: 'Pasaporte' };

    // XLSX Export
    if (format === 'xlsx') {
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

      const rows = alerts.map((alert) => ({
        'ID': alert.id,
        'Perfil': profileLabels[alert.profile] || alert.profile,
        'Nombre': alert.personName,
        'Identificación': alert.personId,
        'Tipo ID': idTypeLabels[alert.personIdType] || alert.personIdType,
        'Afectación Económica': alert.economicAffectation ? 'Sí' : 'No',
        'Descripción': alert.description,
        'Estado': statusLabels[alert.status] || alert.status,
        'Entidad': alert.financialEntity?.name || '',
        'Creado Por': alert.creator?.name || '',
        'Fecha Creación': new Date(alert.createdAt).toLocaleString('es-CR'),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create Alertas sheet
      const ws = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      ws['!cols'] = [
        { wch: 36 },  // ID
        { wch: 10 },  // Perfil
        { wch: 25 },  // Nombre
        { wch: 20 },  // Identificación
        { wch: 12 },  // Tipo ID
        { wch: 22 },  // Afectación Económica
        { wch: 50 },  // Descripción
        { wch: 12 },  // Estado
        { wch: 25 },  // Entidad
        { wch: 25 },  // Creado Por
        { wch: 22 },  // Fecha Creación
      ];

      // Apply header styling
      const headerStyle: XLSX.Style = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: 'AA2D00' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'AA2D00' } },
          bottom: { style: 'thin', color: { rgb: 'AA2D00' } },
          left: { style: 'thin', color: { rgb: 'AA2D00' } },
          right: { style: 'thin', color: { rgb: 'AA2D00' } },
        },
      };

      // Apply header styles to first row
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Alertas');

      // Create Resumen (Summary) sheet
      const entityBreakdown = alerts.reduce((acc, alert) => {
        const name = alert.financialEntity?.name || 'Sin entidad';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const profileBreakdown = alerts.reduce((acc, alert) => {
        const label = profileLabels[alert.profile] || alert.profile;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusBreakdown = alerts.reduce((acc, alert) => {
        const label = statusLabels[alert.status] || alert.status;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Determine date range
      let dateRangeLabel = 'Mes en curso';
      if (today === 'true') {
        dateRangeLabel = `Hoy (${new Date().toLocaleDateString('es-CR')})`;
      } else if (from && to) {
        dateRangeLabel = `${new Date(from).toLocaleDateString('es-CR')} - ${new Date(to).toLocaleDateString('es-CR')}`;
      } else {
        const now = new Date();
        dateRangeLabel = now.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
      }

      const summaryData: Record<string, string | number>[] = [
        { 'Métrica': 'Total de Alertas', 'Valor': alerts.length },
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': 'Por Entidad', 'Valor': '' },
        ...Object.entries(entityBreakdown).map(([name, count]) => ({
          'Métrica': `  ${name}`,
          'Valor': count,
        })),
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': 'Por Perfil', 'Valor': '' },
        ...Object.entries(profileBreakdown).map(([name, count]) => ({
          'Métrica': `  ${name}`,
          'Valor': count,
        })),
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': 'Por Estado', 'Valor': '' },
        ...Object.entries(statusBreakdown).map(([name, count]) => ({
          'Métrica': `  ${name}`,
          'Valor': count,
        })),
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': 'Rango de Fechas', 'Valor': dateRangeLabel },
        { 'Métrica': 'Fecha de Exportación', 'Valor': new Date().toLocaleString('es-CR') },
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      // Set column widths for summary
      wsSummary['!cols'] = [
        { wch: 30 },
        { wch: 25 },
      ];

      // Style section headers
      const sectionHeaderStyle: XLSX.Style = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: 'AA2D00' } },
        border: {
          top: { style: 'thin', color: { rgb: 'AA2D00' } },
          bottom: { style: 'thin', color: { rgb: 'AA2D00' } },
          left: { style: 'thin', color: { rgb: 'AA2D00' } },
          right: { style: 'thin', color: { rgb: 'AA2D00' } },
        },
      };

      // Find and style section headers
      const sectionHeaders = ['Por Entidad', 'Por Perfil', 'Por Estado'];
      summaryData.forEach((row, idx) => {
        if (sectionHeaders.includes(String(row['Métrica']))) {
          const cellRef = XLSX.utils.encode_cell({ r: idx, c: 0 });
          const cellRef2 = XLSX.utils.encode_cell({ r: idx, c: 1 });
          if (wsSummary[cellRef]) wsSummary[cellRef].s = sectionHeaderStyle;
          if (wsSummary[cellRef2]) wsSummary[cellRef2].s = sectionHeaderStyle;
        }
      });

      // Style the "Total de Alertas" row
      const totalStyle: XLSX.Style = {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: 'F5E9D4' } },
      };
      const totalCellA = XLSX.utils.encode_cell({ r: 0, c: 0 });
      const totalCellB = XLSX.utils.encode_cell({ r: 0, c: 1 });
      if (wsSummary[totalCellA]) wsSummary[totalCellA].s = totalStyle;
      if (wsSummary[totalCellB]) wsSummary[totalCellB].s = totalStyle;

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const filename = `alertas_interbancarias_${new Date().toISOString().split('T')[0]}.xlsx`;

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV Export (default)
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
