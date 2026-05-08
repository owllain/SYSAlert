---
Task ID: 3
Agent: full-stack-developer
Task: Create all API routes for interbank alert system

Work Log:
- Read existing project structure, Prisma schema, and db client setup
- Created /api/seed/route.ts - GET endpoint that seeds 3 financial entities (Banco Popular/BP, Banco de Costa Rica/BCR, Banco Nacional de Costa Rica/BNC) with upsert logic
- Created /api/entities/route.ts - GET endpoint that lists all financial entities with user count using _count aggregation
- Created /api/users/route.ts - Full CRUD (GET, POST, PUT, DELETE) with ID type validation (cedula=9 digits, dimex=12 digits, pasaporte=max 30 chars), unique constraint checking for username/email, role validation, and financial entity existence verification
- Created /api/alerts/route.ts - Full CRUD (GET, POST, PUT, DELETE) with query filters (userId, today, month, entityId), person ID type validation, profile validation (receptor/victima), status validation (active/resolved/dismissed), and creator/entity existence checks
- Reset database and re-seeded to ensure correct entity codes (BNC instead of BN)
- Tested all endpoints via curl: seed, entities, users CRUD, alerts CRUD, ID validation
- All endpoints return proper JSON responses with appropriate status codes
- Lint check passed with no errors

Stage Summary:
- 4 API route files created at src/app/api/{seed,entities,users,alerts}/route.ts
- All routes use `import { db } from '@/lib/db'` for Prisma client
- Full validation implemented: ID types (cedula/dimex/pasaporte), roles (admin/analyst/viewer), profiles (receptor/victima), statuses (active/resolved/dismissed)
- Alert filtering by userId, today, month, and entityId supported
- All database operations wrapped in try/catch with proper error responses
- Database seeded with 3 entities and verified working
