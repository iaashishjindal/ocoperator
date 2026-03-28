import Link from "next/link"

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-stone-300 font-mono text-sm mb-4">404</p>
      <h1 className="text-xl font-semibold text-stone-700 mb-6">This experiment doesn&apos;t exist yet.</h1>
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2">
        back to the log
      </Link>
    </div>
  )
}
