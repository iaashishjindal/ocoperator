export interface ExperimentBillEntry {
  name: string
  tokens_in: number
  tokens_out: number
  cost_usd: number
}

export interface ExperimentBill {
  models: ExperimentBillEntry[]
  total_cost_usd: number
  duration_mins: number
  notes?: string
}

export interface ExperimentMetadata {
  number: number
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  bill: ExperimentBill
}

// Add new experiment slugs here as you publish them
export const EXPERIMENT_SLUGS = [
  'experiment-001',
  'experiment-002',
  'experiment-003',
  'experiment-004',
] as const

export type ExperimentSlug = (typeof EXPERIMENT_SLUGS)[number]
