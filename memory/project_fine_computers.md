---
name: project-fine-computers
description: Fine Computers portal project — stack, build order, and key setup decisions
metadata:
  type: project
---

Fine Computers Portal is a stock/sales management PWA for a laptop shop in Sargodha, Pakistan. Built with Next.js 14 App Router + TypeScript, Supabase (auth/DB/realtime), Tailwind CSS v3, and shadcn/ui (Tailwind v3 compatible hand-written components, NOT the new shadcn v4 CLI which uses base-nova/Tailwind v4).

**Why:** CLAUDE.md spec; currency is PKR; runs on 1 laptop + 2 phones simultaneously.

**Build order:**
1. ✅ Supabase setup + auth (login page, session management)
2. ✅ Database schema — `supabase/migrations/001_initial_schema.sql` written; user must paste into Supabase SQL editor. `types/database.ts` manually written to match. Repairs module removed from scope.
3. ✅ Inventory module — Laptops + Components tabs, forms with dropdown selectors, realtime, delete confirm dialogs, FAB on mobile. Nav shell added to protected layout.
4. ✅ Config Builder — 3-step wizard (laptop select → add components → review). Saves to configs+config_items, converts to sale (sales+sale_items), decrements inventory on sale. Live profit/margin preview. RAM total computed from base + upgrade components.
5. ✅ Sales module — list with revenue/profit stats, sale detail modal, quick manual sale form (laptop+component picker, customer link/create, editable sell prices), WhatsApp invoice share (Urdu-friendly message), realtime.
6. ✅ Customer database — list with total spend, `/customers/[id]` profile page with purchase history, edit customer, WhatsApp share on each sale in history.
7. ✅ Dashboard — 4 KPI cards (today revenue/profit, laptop/component stock), 7-day bar chart (revenue + profit), donut chart (Laptops / Accessories / Components), recent 5 sales table. Installments removed from scope entirely (route + nav).
8. ✅ Analytics — date range filter (week/month/year/all), revenue+profit bar chart with daily/weekly/monthly toggle, profit by brand donut, units by brand donut, all-time summary stats (5 cards), top 5 configs by margin % table.
9. Repair tracker
10. Installment tracker
11. PWA + offline sync (Dexie.js)
12. Polish

**Key setup facts:**
- shadcn components are hand-written (Tailwind v3 / radix-ui based) because `npx shadcn@latest` v4.x installs `@base-ui/react` + Tailwind v4 CSS which is incompatible with Next.js 14 + Tailwind v3.
- types/database.ts MUST include `Relationships: []` on every table AND `CompositeTypes: { [_ in never]: never }` at schema level — Supabase v2.107 requires these fields or `.update()` infers `never` as the parameter type.
- Repairs module is permanently removed from scope (no route, no nav entry).
- Nav shell: sidebar on md+, top bar + bottom nav (5 primary routes) on mobile. Lives in `components/nav/app-nav.tsx`.
- Supabase client (`lib/supabase.ts`) uses `createBrowserClient` — lazy-imported in the login submit handler to avoid SSR prerender errors.
- Server Supabase client in `lib/supabase-server.ts` uses `createServerClient` from `@supabase/ssr`.
- Middleware protects all routes except `/login`; redirects `/` → `/dashboard` or `/login`.
- `types/database.ts` is fully written to match 001_initial_schema.sql; can regenerate via `npx supabase gen types typescript --project-id gyiajuuwippqavnsyqer` after login.
- `.env.local` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new Supabase key format, not the old ANON_KEY). All 4 Supabase client files updated.
- All placeholder pages exist under `app/(protected)/[route]/page.tsx`.

**How to apply:** Always use Tailwind v3 patterns and radix-ui for new UI components; never re-run `npx shadcn@latest init` as it will overwrite with v4 styles.
