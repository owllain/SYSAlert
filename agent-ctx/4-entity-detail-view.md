# Task 4: Entity Detail View with Alert Comparison Dashboard

## Summary
Added a new "Entidades" (Entities) view to the interbank alert system that shows detailed information about each financial entity and allows comparison of alert statistics between entities.

## Files Modified
1. **src/lib/store.ts** - Added `'entities'` to the `NavTab` type union
2. **src/components/entities-view.tsx** - Created new component (see details below)
3. **src/components/app-sidebar.tsx** - Added "Entidades" nav item with Building2 icon in General section (after Dashboard, before Users)
4. **src/app/page.tsx** - Added 'entities' case in renderContent and imported EntitiesView
5. **src/components/keyboard-shortcuts.tsx** - Updated Alt+number mappings (2=Entities, 3=Users, 4=Audit Log, 5=My Alerts, 6=Latest Alerts, 7=Alert History)

## Entities View Component Details
- **Header**: "Entidades Financieras" with subtitle "Comparación y detalle de entidades del sistema interbancario"
- **Three entity cards** in a grid (1 col mobile, 3 col desktop):
  - Entity-colored left border (4px: coral for BP, forest for BCR, dark for BNC)
  - Entity name and code badge at top
  - Alert count with Bell icon and user count with Users icon in 2-col stats grid
  - Active/Resolved/Dismissed breakdown as mini progress bar with color legend
  - Receptor/Víctima counts and economic affectation count
  - "Ver alertas" button that navigates to Latest Alerts tab
  - Skeleton loading states while data fetches
- **Comparación de Alertas** section with horizontal bar chart (Recharts BarChart):
  - Shows alerts by entity for the current month
  - Bars colored by entity colors (coral, forest, dark)
  - Custom tooltip with entity name and count
  - Empty state with ShieldAlert icon
- **Distribución por Perfil** section with comparison table:
  - Rows: Receptor, Víctima, Total, Afectación Económica
  - Columns: Each entity (with entity-colored header)
  - Shows count and percentage for each cell
  - Profile badges with colored backgrounds
  - Total row with percentage of overall alerts
  - Economic affectation row with DollarSign badge

## Design System
- Uses Airtable-inspired design system colors (coral #aa2d00, forest #0a2e0e, ink #181d26, cream #f5e9d4)
- Consistent border radius (12px for cards, 8px for inner elements)
- Skeleton loading states matching existing views
- Responsive grid layout (1 col mobile, 3 col desktop for cards; 1 col mobile, 2 col desktop for charts)

## Lint Status
- Passes with zero errors
