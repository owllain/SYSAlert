# Task 5-a: Add Alert Notes System and Fix Entity View "Ver alertas" Filter

## Summary
Added alert notes/comments system and fixed "Ver alertas" button to filter by entity.

## Changes Made

### 1. Database Schema (prisma/schema.prisma)
- Added `Note` model: id, content, alertId (→Alert), userId (→User), createdAt, updatedAt
- Added `notes` relation on Alert model
- Added `notes` relation on User model
- Ran `bun run db:push` successfully

### 2. API Route (src/app/api/notes/route.ts) - NEW
- **GET**: List notes for alert (query: alertId), includes user relation, ordered by createdAt desc
- **POST**: Create note { content, alertId, userId }, validates alert/user exist, creates audit log (action: "add_note", entityType: "alert")
- **DELETE**: Delete note by id (query param)
- All audit log creation wrapped in try-catch

### 3. Alert Detail Dialog (src/components/alert-detail-dialog.tsx)
- Added full "Notas" section at bottom with cream background
- Fetches notes when dialog opens
- Shows note list with user avatar (initials), name, relative timestamp, content
- Textarea + Send button for adding notes (admin/analyst only, not viewer)
- Ctrl+Enter keyboard shortcut to submit
- Loading state with spinner, empty state with MessageSquare icon
- Note count badge in section header

### 4. Zustand Store (src/lib/store.ts)
- Added `selectedEntityId: string | null` state
- Added `setSelectedEntityId` action

### 5. Entities View (src/components/entities-view.tsx)
- "Ver alertas" button now calls `setSelectedEntityId(entity.id)` then `setActiveTab('latest-alerts')`

### 6. Latest Alerts View (src/components/latest-alerts-view.tsx)
- Reads `selectedEntityId` from store via useEffect
- Sets it as `filterEntityId` (default entity filter)
- Clears store value after applying

## Verification
- Lint passes with zero errors
- Dev server running without errors
