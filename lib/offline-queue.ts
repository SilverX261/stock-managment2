/**
 * Offline mutation queue backed by IndexedDB via Dexie.js.
 * Write operations queue here when the device is offline.
 * The queue flushes automatically when the 'online' event fires.
 */

import Dexie, { type Table } from 'dexie'

export type QueuedMutation = {
  id?: number
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: Record<string, unknown>
  createdAt: number
  retries: number
}

class OfflineDB extends Dexie {
  mutations!: Table<QueuedMutation>

  constructor() {
    super('fine-computers-offline-v1')
    this.version(1).stores({
      mutations: '++id, table, operation, createdAt',
    })
  }
}

// Lazy-init: Dexie must only run in the browser (IndexedDB is not available in SSR)
let _db: OfflineDB | null = null
function getDB(): OfflineDB {
  if (!_db) _db = new OfflineDB()
  return _db
}

export const offlineQueue = {
  /** Queue a mutation to be replayed when back online. */
  async add(mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retries'>): Promise<void> {
    await getDB().mutations.add({
      ...mutation,
      createdAt: Date.now(),
      retries: 0,
    })
  },

  /**
   * Flush all queued mutations to Supabase in chronological order.
   * Stops on the first failure to preserve write order.
   */
  async flush(): Promise<{ synced: number; failed: boolean }> {
    if (typeof window === 'undefined') return { synced: 0, failed: false }

    const mutations = await getDB().mutations.orderBy('createdAt').toArray()
    if (!mutations.length) return { synced: 0, failed: false }

    // Lazy import keeps Supabase client out of SSR
    const { createClient } = await import('./supabase')
    const supabase = createClient()

    let synced = 0

    for (const mutation of mutations) {
      try {
        let error: { message: string } | null = null

        if (mutation.operation === 'INSERT') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = await (supabase.from(mutation.table as any) as any)
            .insert(mutation.payload)
          error = res.error
        } else if (mutation.operation === 'UPDATE') {
          const { id, ...data } = mutation.payload
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = await (supabase.from(mutation.table as any) as any)
            .update(data)
            .eq('id', id)
          error = res.error
        } else if (mutation.operation === 'DELETE') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = await (supabase.from(mutation.table as any) as any)
            .delete()
            .eq('id', mutation.payload.id)
          error = res.error
        }

        if (error) throw new Error(error.message)

        await getDB().mutations.delete(mutation.id!)
        synced++
      } catch {
        // Increment retry count; stop processing to preserve order
        await getDB().mutations.update(mutation.id!, { retries: mutation.retries + 1 })
        return { synced, failed: true }
      }
    }

    return { synced, failed: false }
  },

  /** Number of pending mutations waiting to sync. */
  async pendingCount(): Promise<number> {
    if (typeof window === 'undefined') return 0
    return getDB().mutations.count()
  },

  /** Clear the entire queue (use with caution). */
  async clear(): Promise<void> {
    await getDB().mutations.clear()
  },
}
