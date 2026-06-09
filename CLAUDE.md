# Fine Computers Portal — CLAUDE.md

## Project context
This is a stock and sales management portal for Fine Computers, a laptop 
shop in Trust Plaza, Sargodha, Pakistan. The shop buys laptops and 
components wholesale, upgrades them to customer specs, and sells them. 
Currency is PKR (Pakistani Rupees). All prices in PKR with no decimal 
places. The portal is used on 1 laptop and 2 mobile phones simultaneously.

## Tech stack
- Next.js 14 App Router (TypeScript)
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS + shadcn/ui components
- Recharts for all charts
- Dexie.js for offline IndexedDB queue
- next-pwa for PWA and service worker setup

## Core feature: Config Builder
The config builder is the most important feature. It works like this:
1. User selects a base laptop from inventory
2. User adds optional components (RAM, SSD, charger, etc.)
3. System calculates:
   - Total cost price = laptop cost + sum of component costs
   - Total sell price = laptop sell price + sum of component sell prices
   - Profit = total sell - total cost
   - Margin % = (profit / total sell) × 100
4. Configuration is saved and can be converted to a sale

## Offline-first strategy
- Supabase is the single source of truth
- When online: read/write directly to Supabase
- When offline: mutations go into a local Dexie.js IndexedDB queue
- On reconnect: sync queue flushes to Supabase automatically
- Service workers (next-pwa) cache app shell so app loads offline
- All data for the current session is also cached locally

## Multi-device realtime
Use Supabase Realtime subscriptions on the sales, inventory, and 
installments tables so all 3 devices update live when one device 
makes a change.

## Design requirements
- Mobile-first responsive design (works on small phone screens)
- Clean, simple UI — operators are shopkeepers, not tech users
- Large buttons and form fields (used on touch screens)
- Pakistani context: use PKR, support Urdu-named categories where needed
- Dark/light mode toggle

## Key pages
1. /dashboard — KPIs, daily summary, bar chart (revenue), donut (category split)
2. /inventory — Laptops tab + Components tab, with add/edit/delete
3. /config-builder — step-by-step: pick laptop → add components → see totals
4. /sales — list of sales, create new sale from config or manual
5. /customers — customer list with profile and purchase history
6. /analytics — full charts page: bar (weekly/monthly), donut (margins by brand)
7. /repairs — job cards list, create repair, update status, generate bill
8. /installments — credit sales list, mark payments received, flag overdue
9. /settings — manage suppliers, user accounts, low stock thresholds

## Database tables
See schema above. Always use Supabase RLS (Row Level Security). 
Owner sees everything. Staff role sees everything except financial 
summaries and settings.

## Laptop inventory fields
When creating/editing a laptop, the form must include these structured fields
(not freeform text) so the Config Builder can display specs clearly:
- brand (text)
- model (text)
- processor (text)
- base_ram_gb (integer, select: 4/8/12/16/32)
- base_storage_gb (integer, select: 128/256/512/1024/2048)
- storage_type (enum: SSD / HDD / eMMC)
- display_size (enum: 13 / 14 / 15.6 / 17)
- cost_price (integer, PKR)
- sell_price (integer, PKR)
- stock_qty (integer)

## Removed modules
No repair tracker. No refurbished items. Fine Computers sells new laptops
and accessories only. Remove /repairs from all navigation and routes.

## Charts spec
- Bar chart: X = day/week/month (toggle), Y = revenue in PKR 
  and profit in PKR as two separate bars side by side
- Donut chart 1: sales split by category (Laptops / Components / Repairs)
- Donut chart 2: profit margin split by laptop brand
- All charts use Recharts. Tooltips show PKR amounts formatted with commas.

## Component naming conventions
- All shadcn components in /components/ui/
- Feature components in /components/[feature-name]/
- Supabase client in /lib/supabase.ts
- Offline queue logic in /lib/offline-queue.ts
- All database types in /types/database.ts (generated from Supabase)

## Build order for Claude Code
Build in this exact sequence — one feature per session:
1. Supabase setup + auth (login page, session management)
2. Database schema (run SQL migrations in Supabase dashboard)
3. Inventory module (laptops + components CRUD)
4. Config Builder (the core feature — test thoroughly)
5. Sales module (linked to configs + customers)
6. Customer database
7. Dashboard with charts
8. Analytics page
9. Repair tracker
10. Installment tracker
11. PWA + offline sync setup (do this last)
12. Polish: WhatsApp share, low stock alerts, print receipts

## Removed modules
- Repairs tracker (already removed)
- Installments / Qist — Fine Computers does not sell on installments