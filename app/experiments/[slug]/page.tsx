import { EXPERIMENT_SLUGS, type ExperimentMetadata, type ExperimentSlug } from "@/lib/experiments"
import Link from "next/link"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return EXPERIMENT_SLUGS.map(slug => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const mod = await import(`@/content/experiments/${slug}.mdx`)
  const meta = mod.metadata as ExperimentMetadata
  return {
    title: `#${String(meta.number).padStart(3, '0')} ${meta.title} — OC Operator`,
    description: meta.summary,
  }
}

export default async function ExperimentPage({ params }: PageProps) {
  const { slug } = await params
  const mod = await import(`@/content/experiments/${slug}.mdx`)
  const Post = mod.default
  const meta = mod.metadata as ExperimentMetadata

  const totalTokensIn = meta.bill.models.reduce((sum, m) => sum + m.tokens_in, 0)
  const totalTokensOut = meta.bill.models.reduce((sum, m) => sum + m.tokens_out, 0)

  return (
    <div>
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-10">
        ← all experiments
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="text-xs font-mono text-stone-300 mb-2">
          Experiment #{String(meta.number).padStart(3, '0')}
        </div>
        <h1 className="text-3xl font-bold text-stone-900 leading-tight mb-3">
          {meta.title}
        </h1>
        <p className="text-stone-500 text-base leading-relaxed mb-4">{meta.summary}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-stone-400">
            {new Date(meta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {meta.tags.map(tag => (
            <span key={tag} className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-stone prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-stone-700 prose-p:leading-relaxed prose-a:text-stone-900 prose-a:underline-offset-2 max-w-none">
        <Post />
      </article>

      {/* The Bill */}
      <div className="mt-16 border border-stone-200 rounded-xl overflow-hidden">
        <div className="bg-stone-900 px-5 py-3 flex items-center gap-2">
          <span className="text-xs font-mono text-stone-300 font-semibold">THE BILL</span>
          <span className="text-xs text-stone-500 ml-auto">{meta.bill.duration_mins} mins</span>
        </div>
        <div className="px-5 py-4 bg-white">
          <div className="space-y-2 mb-4">
            {meta.bill.models.map(m => (
              <div key={m.name} className="flex items-center gap-2 text-sm font-mono">
                <span className="text-stone-500 bg-stone-50 px-2 py-0.5 rounded text-xs">{m.name}</span>
                <span className="text-stone-400">↑{m.tokens_in.toLocaleString()}</span>
                <span className="text-stone-400">↓{m.tokens_out.toLocaleString()}</span>
                <span className="text-stone-500 ml-auto">${m.cost_usd.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-sm">
            <span className="text-stone-400 font-mono text-xs">
              {(totalTokensIn + totalTokensOut).toLocaleString()} total tokens
            </span>
            <span className="font-semibold font-mono text-stone-900">
              ${meta.bill.total_cost_usd.toFixed(2)} total
            </span>
          </div>
          {meta.bill.notes && (
            <p className="mt-3 text-xs text-stone-400 italic">{meta.bill.notes}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-10 pt-6 border-t border-stone-100">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
          ← back to all experiments
        </Link>
      </div>
    </div>
  )
}
