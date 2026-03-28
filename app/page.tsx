import Link from "next/link";
import { EXPERIMENT_SLUGS, type ExperimentMetadata } from "@/lib/experiments";

async function getAllExperiments(): Promise<ExperimentMetadata[]> {
  const experiments: ExperimentMetadata[] = []
  for (const slug of EXPERIMENT_SLUGS) {
    const mod = await import(`@/content/experiments/${slug}.mdx`)
    experiments.push(mod.metadata as ExperimentMetadata)
  }
  return experiments.sort((a, b) => b.number - a.number)
}

export default async function HomePage() {
  const experiments = await getAllExperiments()

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-stone-900 mb-3">The Log</h1>
        <p className="text-stone-500 leading-relaxed">
          A running record of AI experiments — what we were trying to do, what went sideways,
          and what we eventually figured out. Human challenges and AI challenges, documented together.
        </p>
      </div>

      <div className="space-y-0">
        {experiments.map((exp, i) => (
          <Link
            key={exp.slug}
            href={`/experiments/${exp.slug}`}
            className="group block py-6 border-b border-stone-100 last:border-0 hover:bg-stone-50 -mx-4 px-4 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-4">
              <span className="text-xs font-mono text-stone-300 mt-1 shrink-0 w-8 text-right">
                #{String(exp.number).padStart(3, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-stone-900 group-hover:text-stone-700 transition-colors mb-1">
                  {exp.title}
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-2">
                  {exp.summary}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {exp.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {experiments.length === 0 && (
        <p className="text-stone-400 text-sm">No experiments yet. Check back soon.</p>
      )}
    </div>
  )
}
