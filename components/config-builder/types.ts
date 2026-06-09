import type { Laptop, Component } from '@/types/database'

export type SelectedComponent = {
  component: Component
  quantity: number
}

export type ConfigStep = 1 | 2 | 3

export interface ConfigState {
  step: ConfigStep
  laptop: Laptop | null
  components: SelectedComponent[]
}

// Compute totals from current state
export function computeTotals(laptop: Laptop | null, components: SelectedComponent[]) {
  const laptopCost = laptop?.cost_price ?? 0
  const laptopSell = laptop?.sell_price ?? 0
  const compCost = components.reduce((s, c) => s + c.component.cost_price * c.quantity, 0)
  const compSell = components.reduce((s, c) => s + c.component.sell_price * c.quantity, 0)
  const totalCost = laptopCost + compCost
  const totalSell = laptopSell + compSell
  const profit = totalSell - totalCost
  const margin = totalSell > 0 ? (profit / totalSell) * 100 : 0
  return { laptopCost, laptopSell, compCost, compSell, totalCost, totalSell, profit, margin }
}

// Extract numeric GB value from freeform text like "8GB DDR4" or "16 GB"
export function extractGb(text: string | null | undefined): number {
  if (!text) return 0
  const m = text.match(/\b(\d+)\s*GB\b/i)
  return m ? parseInt(m[1]) : 0
}

// Compute total RAM (base + RAM component upgrades)
export function totalRamGb(laptop: Laptop, components: SelectedComponent[]): number {
  const upgradeGb = components
    .filter(c => c.component.category === 'RAM')
    .reduce((s, c) => {
      const gb = extractGb(c.component.specification) || extractGb(c.component.name)
      return s + gb * c.quantity
    }, 0)
  return laptop.base_ram_gb + upgradeGb
}

// Format PKR with comma separator
export function pkr(n: number) {
  return 'PKR ' + Math.round(n).toLocaleString('en-PK')
}
