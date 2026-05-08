# Task 5-c: Add dashboard heatmap, enhanced search, and severity indicator

## Agent: fullstack-developer

## Work Completed

### 1. Alert Activity Heatmap (Dashboard)
- Added "Mapa de Actividad" section between status breakdown cards and charts
- 7-column grid (L, M, Mi, J, V, S, D) showing last 4 weeks
- Cell colors: 0→#f8fafc, 1-2→#f5e9d4/60, 3-5→#f5e9d4, 6-10→#aa2d00/40, 11+→#aa2d00
- shadcn/ui Tooltip on each cell showing date and count
- Row labels and legend included
- Fetches /api/alerts?days=30 for heatmap data

### 2. Enhanced Alert Search
- All 3 alert views now search against: personName, personId, description, financialEntity.name
- Placeholder updated to "Buscar por nombre, ID, descripción o entidad..."

### 3. Alert Severity Indicator
- Severity logic: High (victima && economicAffectation), Medium (victima || economicAffectation), Low
- Colored dot (w-2.5 h-2.5 rounded-full) added as first column in all alert tables
- Severity badge added to alert-detail-dialog

## Files Modified
- src/components/dashboard-view.tsx
- src/components/my-alerts-view.tsx
- src/components/latest-alerts-view.tsx
- src/components/alert-history-view.tsx
- src/components/alert-detail-dialog.tsx

## Status
- All changes complete
- Lint passes with zero errors
