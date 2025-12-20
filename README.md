# Employee Learning Hub

## Overview
A Next.js + Supabase application for managing employee learning courses.
**Status**: Phase 3 Complete (Operational Hardening).

## Features
- **Authentication**: Email/Password + Role Management (Admin/Employee).
- **Admin Portal**: 
  - Manage Courses, Modules, Content.
  - **Employee Management**: Invite, Edit, Toggle Active.
  - **Assignments**: Assign courses to employees.
  - **Audit Logs**: Track all system changes.
  - **Bulk Import**: JSON import for courses.
- **Employee Portal**: 
  - View assigned courses only.
  - Read-only access to learning content.
- **Security**: Strict RLS + Service Role for User Mgmt.

## Setup Instructions

### 1. Supabase Project Setup
1. Create a new project at [Supabase](https://supabase.com).
2. Go to **Project Settings > API**.
3. Copy **Project URL**, **anon public key**, and **service_role secret**.

### 2. Environment Variables
1. Copy `.env.local.example` to `.env.local`.
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...  # Required for User Management
   ```

### 3. Database Migration
Run these SQL scripts in order via Supabase SQL Editor:
1. `db/migrations/00_init_schema.sql` (Base Schema)
2. `db/migrations/01_assignments_schema.sql` (Assignments)
3. `db/migrations/02_audit_schema.sql` (Audit Logs)
4. `db/policies/phase2_rls.sql` (Strict RLS)

### 4. Create First Admin
1. Sign up a new user via `/signup`.
2. In Supabase **Table Editor > profiles**, change `role` to `admin` and `active` to `TRUE`.

### 5. Running the App
```bash
npm install
npm run dev
```

## Testing & Verification

### Manual Test Plan
1. **Users**:
   - Go to `/admin/employees`. Click "Add Employee".
   - Create a user. Verify they appear in the list.
2. **Bulk Import**:
   - Go to `/admin/tools/import`.
   - Paste JSON from `db/seed/example_import.json` (create this if needed or use simple JSON).
   ```json
   { "courses": [{ "title": "Test Course", "modules": [] }] }
   ```
3. **Audit**:
   - Go to `/admin/audit`.
   - Verify that your Create User and Import actions are logged.
4. **Assignments & Access**:
   - Verify standard Phase 2 assignment flows still work.

### Troubleshooting
- **User Creation Failed?**: Check `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` and restart server.
- **Audit Logs Empty?**: Ensure policies in `02_audit_schema.sql` ran correctly.
