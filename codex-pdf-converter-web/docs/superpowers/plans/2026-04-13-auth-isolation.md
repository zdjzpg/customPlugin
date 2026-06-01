# Auth Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add account/password login, admin-only staff management, owner-based paper/submission isolation, and required student intake validation.

**Architecture:** Introduce lightweight token sessions in MySQL, bootstrap auth tables/columns on server start, scope teacher APIs by authenticated user ownership, and extend the Vue app with a login page, auth-aware route guards, admin user management, and shared student validation.

**Tech Stack:** Vue 3, Vue Router, Express, mysql2, Node crypto, Node test runner.

---

### Task 1: Shared auth and student validation helpers

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\tests\authStudent.test.cjs`
- Create: `D:\aa-workplace\EnglishQuestion\server\auth.js`
- Create: `D:\aa-workplace\EnglishQuestion\src\shared\studentValidation.js`

- [ ] Write failing tests for password hashing/verification and required student field detection.
- [ ] Run the tests to confirm failure.
- [ ] Implement the minimal helpers.
- [ ] Re-run the tests to confirm pass.

### Task 2: Schema bootstrap and SQL initialization

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\server\schema.js`
- Modify: `D:\aa-workplace\EnglishQuestion\server\index.js`
- Modify: `D:\aa-workplace\EnglishQuestion\sql\init_kids_english.sql`

- [ ] Ensure `users`, `user_sessions`, and ownership columns exist.
- [ ] Seed the default `admin / 123456` account.
- [ ] Backfill existing papers/submissions to the admin owner.

### Task 3: Authenticated APIs and owner isolation

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\server\paperRepository.js`
- Modify: `D:\aa-workplace\EnglishQuestion\server\index.js`

- [ ] Add login/logout/me endpoints and bearer-token middleware.
- [ ] Scope paper CRUD and submission listing by authenticated owner unless admin.
- [ ] Add admin-only staff CRUD/reset/status endpoints.
- [ ] Validate required student info on submission.

### Task 4: Frontend auth flow and admin page

**Files:**
- Create: `D:\aa-workplace\EnglishQuestion\src\views\LoginView.vue`
- Create: `D:\aa-workplace\EnglishQuestion\src\views\UserManagementView.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\router\index.js`
- Modify: `D:\aa-workplace\EnglishQuestion\src\api\client.js`
- Modify: `D:\aa-workplace\EnglishQuestion\src\store\examStore.js`
- Modify: `D:\aa-workplace\EnglishQuestion\src\App.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\src\styles.css`

- [ ] Add login screen and persistent auth token loading.
- [ ] Add admin-only staff management UI.
- [ ] Show the current user and logout action outside the student exam page.

### Task 5: Student required fields and final verification

**Files:**
- Modify: `D:\aa-workplace\EnglishQuestion\src\views\PaperView.vue`
- Modify: `D:\aa-workplace\EnglishQuestion\package.json`

- [ ] Enforce the four required intake fields in the student entry screen.
- [ ] Add a verification script for the new tests.
- [ ] Run tests and production build.
