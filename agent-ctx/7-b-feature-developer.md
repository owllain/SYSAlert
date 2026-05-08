---
Task ID: 7-b
Agent: feature-developer
Task: Add duplicate alert detection and bookmark/pin system for important alerts

Work Log:

## Feature 1: Duplicate Alert Detection

- Created API endpoint `GET /api/alerts/check-duplicate?personId=XXX&personIdType=XXX`
  - Returns `{ duplicate: boolean, existingAlerts: Alert[] }` where existingAlerts includes active alerts (status !== 'dismissed') with the same personId and personIdType
  - Includes financialEntity and creator relations in response
  - Validates ID length before querying (9 digits for cédula, 12 for DIMEX, any for pasaporte)
  - Limits results to 10 alerts, ordered by most recent first

- Updated AlertFormDialog (`src/components/alert-form-dialog.tsx`):
  - Replaced simple duplicate check with proper API call to `/api/alerts/check-duplicate`
  - Added `forceCreate` state to track user confirmation to create despite duplicates
  - When duplicates found, shows amber/yellow warning banner INSIDE the form:
    - "⚠️ Se encontraron X alertas existentes para esta persona"
    - Shows up to 3 matching alerts with: Entity name (with color dot), Profile badge, Status badge, Relative time
    - "Crear de todas formas" button to proceed despite duplicates
    - Default submit button is disabled when duplicates are found
  - Only checks when personId has valid length (9 for cédula, 12 for DIMEX, any for pasaporte)
  - Debounced check (500ms) to avoid excessive API calls
  - Small loading spinner (Loader2) inside the input field while checking
  - Input border changes to amber when duplicates detected
  - Amber-themed styling: bg-amber-50, border-amber-200, text-amber-800
  - AlertTriangle icon from lucide used as warning indicator

## Feature 2: Alert Bookmark/Pin System

- Added `BookmarkedAlert` model to Prisma schema:
  - Fields: id, userId, alertId, createdAt
  - @@unique([userId, alertId]) constraint
  - Added `bookmarks` relation to User model
  - Added `bookmarkedBy` relation to Alert model
  - Ran db:push successfully

- Created API endpoint `GET/POST /api/alerts/bookmark`:
  - GET: Returns array of bookmarked alert IDs for a given userId
  - POST: Body { userId, alertId, action: 'add' | 'remove' }
  - Creates/deletes BookmarkedAlert record
  - Returns { bookmarked: boolean }
  - Audit log entries for bookmark_add/bookmark_remove actions

- Updated AlertDetailDialog (`src/components/alert-detail-dialog.tsx`):
  - Added Bookmark/BookmarkCheck icon button in top-right corner of dialog header
  - When bookmarked: filled BookmarkCheck icon in coral (#aa2d00) color
  - When not bookmarked: outline Bookmark icon in gray
  - Toggle bookmark on click with API call
  - Shows "Marcada" badge when bookmarked
  - Toast notification: "Alerta marcada" / "Marca removida"
  - Accepts `bookmarkedIds` and `onBookmarkToggle` props from parent views

- Updated my-alerts-view.tsx:
  - Added bookmark icon column (first column) in alert table
  - Bookmarked alerts show filled coral BookmarkCheck icon
  - Non-bookmarked show outline gray Bookmark icon on row hover
  - Clicking bookmark icon toggles bookmark via API
  - Fetches user's bookmarked alert IDs on mount
  - Added "Mis Marcadores" pill toggle button next to search bar
  - Toggle styled as pill button with coral active state
  - Shows bookmark count badge
  - When active, filters alerts to only show bookmarked ones
  - Empty state for bookmark filter shows Bookmark icon and contextual message

- Updated latest-alerts-view.tsx:
  - Added bookmark icon column (first column) in alert table
  - Same toggle behavior as my-alerts-view.tsx
  - Fetches user's bookmarked alert IDs on mount
  - Bookmark state synced between table and detail dialog

- Updated alert-history-view.tsx:
  - Added bookmark icon column (first column, before checkbox) in alert table
  - Same toggle behavior as other views
  - Fetches user's bookmarked alert IDs on mount
  - Bookmark state synced between table and detail dialog
  - ColSpan for expanded row and empty state updated to account for new column

Stage Summary:
- 8 files modified/created: schema.prisma, api/alerts/check-duplicate/route.ts (new), api/alerts/bookmark/route.ts (new), alert-form-dialog.tsx, alert-detail-dialog.tsx, my-alerts-view.tsx, latest-alerts-view.tsx, alert-history-view.tsx
- Duplicate alert detection: Proper API endpoint with personId + personIdType matching, amber warning banner with up to 3 matching alerts, force create option, debounced checking
- Bookmark system: Full CRUD with Prisma model, API endpoints, bookmark toggle in all alert tables and detail dialog, "Mis Marcadores" filter in My Alerts view
- All styling follows Airtable-inspired design system (coral, forest, cream, amber for warnings)
- Lint passes with zero errors
- Dev server running without errors
