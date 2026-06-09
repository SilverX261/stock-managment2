-- =============================================================
-- Fine Computers Portal — Initial Schema (idempotent)
-- Safe to run multiple times. Paste into Supabase SQL Editor:
--   https://supabase.com/dashboard/project/gyiajuuwippqavnsyqer/sql/new
-- =============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────
-- Wrapped in DO blocks so re-running never errors on duplicate.

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storage_type AS ENUM ('HDD', 'SSD', 'NVMe');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE item_condition AS ENUM ('new', 'used', 'refurbished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('cash', 'installment', 'card', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE installment_status AS ENUM ('active', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sale_item_type AS ENUM ('laptop', 'component');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Helper: auto-update updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  role       user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── suppliers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  phone      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── laptops ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laptops (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand            TEXT NOT NULL,
  model            TEXT NOT NULL,
  processor        TEXT,
  base_ram_gb      INTEGER NOT NULL,
  base_storage_gb  INTEGER NOT NULL,
  storage_type     storage_type NOT NULL DEFAULT 'HDD',
  display_size     NUMERIC(4,1),
  condition        item_condition NOT NULL DEFAULT 'used',
  cost_price       INTEGER NOT NULL,
  sell_price       INTEGER NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1,
  supplier_id      UUID REFERENCES suppliers ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS laptops_updated_at ON laptops;
CREATE TRIGGER laptops_updated_at
  BEFORE UPDATE ON laptops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── components ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS components (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  specification TEXT,
  cost_price    INTEGER NOT NULL,
  sell_price    INTEGER NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 0,
  supplier_id   UUID REFERENCES suppliers ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS components_updated_at ON components;
CREATE TRIGGER components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── customers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── configs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  laptop_id            UUID NOT NULL REFERENCES laptops ON DELETE RESTRICT,
  notes                TEXT,
  laptop_cost_snapshot INTEGER NOT NULL,
  laptop_sell_snapshot INTEGER NOT NULL,
  total_cost_price     INTEGER NOT NULL,
  total_sell_price     INTEGER NOT NULL,
  created_by           UUID REFERENCES profiles ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── config_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id           UUID NOT NULL REFERENCES configs ON DELETE CASCADE,
  component_id        UUID NOT NULL REFERENCES components ON DELETE RESTRICT,
  quantity            INTEGER NOT NULL DEFAULT 1,
  cost_price_snapshot INTEGER NOT NULL,
  sell_price_snapshot INTEGER NOT NULL
);

-- ── sales ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID REFERENCES customers ON DELETE SET NULL,
  config_id        UUID REFERENCES configs ON DELETE SET NULL,
  sale_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  total_cost_price INTEGER NOT NULL,
  total_sell_price INTEGER NOT NULL,
  payment_type     payment_type NOT NULL DEFAULT 'cash',
  notes            TEXT,
  created_by       UUID REFERENCES profiles ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sale_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id             UUID NOT NULL REFERENCES sales ON DELETE CASCADE,
  item_type           sale_item_type NOT NULL,
  laptop_id           UUID REFERENCES laptops ON DELETE RESTRICT,
  component_id        UUID REFERENCES components ON DELETE RESTRICT,
  quantity            INTEGER NOT NULL DEFAULT 1,
  cost_price_snapshot INTEGER NOT NULL,
  sell_price_snapshot INTEGER NOT NULL,
  CONSTRAINT sale_items_check_item CHECK (
    (item_type = 'laptop'    AND laptop_id IS NOT NULL    AND component_id IS NULL) OR
    (item_type = 'component' AND component_id IS NOT NULL AND laptop_id IS NULL)
  )
);

-- ── installments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS installments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id              UUID NOT NULL REFERENCES sales ON DELETE RESTRICT,
  customer_id          UUID NOT NULL REFERENCES customers ON DELETE RESTRICT,
  total_amount         INTEGER NOT NULL,
  down_payment         INTEGER NOT NULL DEFAULT 0,
  monthly_installment  INTEGER NOT NULL,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  status               installment_status NOT NULL DEFAULT 'active',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS installments_updated_at ON installments;
CREATE TRIGGER installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── installment_payments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS installment_payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id   UUID NOT NULL REFERENCES installments ON DELETE CASCADE,
  amount           INTEGER NOT NULL,
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by      UUID REFERENCES profiles ON DELETE SET NULL,
  notes            TEXT
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_laptops_brand            ON laptops (brand);
CREATE INDEX IF NOT EXISTS idx_laptops_quantity         ON laptops (quantity);
CREATE INDEX IF NOT EXISTS idx_components_category      ON components (category);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date          ON sales (sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id        ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_installments_status      ON installments (status);
CREATE INDEX IF NOT EXISTS idx_installments_customer_id ON installments (customer_id);
CREATE INDEX IF NOT EXISTS idx_config_items_config_id   ON config_items (config_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id       ON sale_items (sale_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE laptops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE components           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_profiles"             ON profiles;
DROP POLICY IF EXISTS "auth_all_suppliers"            ON suppliers;
DROP POLICY IF EXISTS "auth_all_laptops"              ON laptops;
DROP POLICY IF EXISTS "auth_all_components"           ON components;
DROP POLICY IF EXISTS "auth_all_customers"            ON customers;
DROP POLICY IF EXISTS "auth_all_configs"              ON configs;
DROP POLICY IF EXISTS "auth_all_config_items"         ON config_items;
DROP POLICY IF EXISTS "auth_all_sales"                ON sales;
DROP POLICY IF EXISTS "auth_all_sale_items"           ON sale_items;
DROP POLICY IF EXISTS "auth_all_installments"         ON installments;
DROP POLICY IF EXISTS "auth_all_installment_payments" ON installment_payments;

-- No login required — anon key has full access to all tables.
CREATE POLICY "auth_all_profiles"             ON profiles             FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_suppliers"            ON suppliers            FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_laptops"              ON laptops              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_components"           ON components           FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_customers"            ON customers            FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_configs"              ON configs              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_config_items"         ON config_items         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_sales"                ON sales                FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_sale_items"           ON sale_items           FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_installments"         ON installments         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_installment_payments" ON installment_payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Realtime ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sales;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE laptops;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE components;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE installments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
