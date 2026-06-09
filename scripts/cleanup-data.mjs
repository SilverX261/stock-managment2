/**
 * Fine Computers Portal — Data Cleanup Script
 * Deletes all rows in dependency order to avoid FK constraint errors.
 * Run: node scripts/cleanup-data.mjs
 */
import { createClient } from '@supabase/supabase-js'

const URL  = 'https://gyiajuuwippqavnsyqer.supabase.co'
const KEY  = 'sb_publishable_3hr25QElZp7plfi_5NVj6w_CFdZ1p2g'

const supabase = createClient(URL, KEY)

// Ordered to respect FK constraints (child → parent)
const TABLES = [
  'installment_payments',
  'installments',
  'customer_returns',
  'sale_items',
  'sales',
  'config_items',
  'configs',
  'customers',
  'components',
  'laptops',
  'suppliers',
]

async function countRows(table) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count ?? 0
}

async function deleteAll(table) {
  // Supabase requires a filter on .delete() to prevent accidental wipes
  // Using neq on id (uuid) effectively matches all rows
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) {
    // settings table uses integer id
    if (table === 'settings') {
      const { error: e2 } = await supabase.from(table).delete().neq('id', -1)
      return e2
    }
    return error
  }
  return null
}

async function run() {
  console.log('\n🧹  Fine Computers — Data Cleanup\n')

  for (const table of TABLES) {
    const before = await countRows(table)
    if (before === 0) {
      console.log(`  ✓ ${table.padEnd(26)} already empty`)
      continue
    }

    const err = await deleteAll(table)
    if (err) {
      console.error(`  ✗ ${table.padEnd(26)} FAILED — ${err.message}`)
      console.error('    → This may be an RLS restriction. Run the SQL below in the Supabase dashboard.')
      console.error(`    → DELETE FROM "${table}";`)
    } else {
      const after = await countRows(table)
      if (after === 0) {
        console.log(`  ✓ ${table.padEnd(26)} deleted ${before} row${before !== 1 ? 's' : ''}`)
      } else {
        console.warn(`  ⚠ ${table.padEnd(26)} still has ${after} rows after delete (RLS may be blocking)`)
      }
    }
  }

  console.log('\n📋  Final row counts:\n')
  for (const table of TABLES) {
    const count = await countRows(table)
    const icon = count === 0 ? '✓' : '✗'
    console.log(`  ${icon} ${table.padEnd(26)} ${count} rows`)
  }

  console.log('\nDone.\n')
}

run().catch(console.error)
