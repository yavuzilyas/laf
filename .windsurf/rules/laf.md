---
trigger: manual
---

**Liberterian Anarchist Activity – Web Platform**

Open-source web platform for the Liberterian Anarchist Activity community.

---

## Open Source Principles

* Public repository
* Transparent development process
* No hidden business logic
* No proprietary dependencies
* Community contributions are welcome
* Code must remain auditable and readable

All contributions must follow the standards defined in this document.

---

## Tech Stack

* **Framework:** SvelteKit
* **Frontend:** Svelte 5 (Runes API only)
* **Language:** TypeScript (strict mode)
* **Database:** PostgreSQL
* **Legacy Database:** MongoDB (fully deprecated)
* **Package Manager:** pnpm (required)
* **Password Hashing:** argon2
* **UI Components:** shadcn-svelte
* **Styling:** TailwindCSS

---

## Core Architectural Rules

* Server-first design
* Minimal dependencies
* Explicit types everywhere
* No unnecessary abstractions
* Small, single-responsibility components
* Clear separation between database, server logic, and UI

---

## Svelte 5 Rules

* Use `$state`, `$derived`, `$effect`
* Do not use legacy Svelte syntax
* Avoid global stores unless strictly necessary
* Explicit prop typing required
* No unnecessary reactive chains

Example:

```ts
let count = $state(0)
let doubled = $derived(count * 2)

$effect(() => {
  console.log(count)
})
```

---

## TypeScript Rules

* `any` is forbidden unless justified
* All functions must have explicit return types
* Shared types: `src/lib/types`
* Database models and frontend DTOs must be separated
* Strict null checks enabled

---

## Database: PostgreSQL

### General Rules

* snake_case for tables and columns
* Primary key: `id UUID DEFAULT gen_random_uuid()`
* Explicit foreign keys
* `NOT NULL` where applicable
* `created_at TIMESTAMP DEFAULT now()`
* Optional soft delete: `deleted_at TIMESTAMP`

### Query Rules

* Always use parameterized queries
* Prevent N+1 queries
* Add indexes for frequently filtered columns
* No raw dynamic SQL concatenation

---

## MongoDB → PostgreSQL Migration Notes

* ObjectId → UUID
* Embedded documents must be normalized
* Arrays may require junction tables
* Dates must use TIMESTAMP
* Remove schema-less patterns

MongoDB must not be reintroduced.

---

## Authentication & Security

* Passwords hashed using argon2
* No plaintext password logging
* HTTP-only cookies for sessions
* CSRF protection required
* Rate limiting on auth routes
* Admin routes guarded server-side
* No client-side authorization logic

---

## Project Structure

```
src/
 ├ lib/
 │  ├ components/
 │  ├ server/
 │  ├ db/
 │  ├ types/
 │  └ utils/
 ├ routes/
 └ hooks.server.ts
```

---

## UI Rules

* Use shadcn components as base
* Accessible markup required (ARIA where needed)
* Dark mode supported
* Avoid visual clutter
* Typography must prioritize readability

---

## Code Standards

* pnpm only (npm/yarn not allowed)
* ESLint required
* Prettier required
* No unnecessary comments
* No dead code
* No console logs in production
* Commit format:

```
feat:
fix:
refactor:
chore:
```

---

## Performance Rules

* Optimize server load functions
* Avoid unnecessary reactive recalculations
* Use database indexes properly
* Avoid over-fetching data
* Prefer server rendering where possible

---

## Content Policy

This platform represents an anti-authoritarian, anti-state, non-hierarchical political perspective.

The platform must not:

* Promote violence
* Publish illegal content
* Contain explicit hate speech

---

## Development

Install:

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
pnpm preview
```

---

## Roadmap

* Role-based authorization
* Markdown-based publishing system
* Event system
* Multi-language support
* Optional ActivityPub / federation integration

---

If you want, I can also generate:

* a CONTRIBUTING.md
* a SECURITY.md
* a PostgreSQL schema draft
* or a clean initial folder boilerplate structure
