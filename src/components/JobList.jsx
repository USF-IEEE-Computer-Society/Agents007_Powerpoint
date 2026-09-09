import { formatSavedOn } from '../lib/dates'

export default function JobList({ jobs, loading, onRemove }) {
  // Newest first. savedAt is an ISO string, so it sorts lexicographically.
  const ordered = [...jobs].sort((a, b) =>
    (b.savedAt ?? '').localeCompare(a.savedAt ?? ''),
  )

  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight text-navy">
        Saved postings
      </h2>

      {loading ? (
        <p className="mt-4 text-[0.9375rem] text-muted">Loading saved postings…</p>
      ) : ordered.length === 0 ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Nothing saved yet. Paste a posting and it lands here, so you can come
          back to it when you write your resume.
        </p>
      ) : (
        <ul className="mt-6 max-w-[38rem] divide-y divide-hairline border-t border-hairline">
          {ordered.map((job) => (
            <li key={job.id} className="py-5">
              <div className="flex items-baseline gap-3">
                <p className="text-[0.8125rem] font-medium text-muted">
                  Saved {formatSavedOn(job.savedAt)} · {countWords(job.description)} words
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(job.id)}
                  className="ml-auto rounded text-[0.8125rem] text-muted/70 underline-offset-2
                             hover:text-ieee hover:underline focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-ieee/40"
                >
                  Remove
                </button>
              </div>

              <h3 className="mt-1 font-display text-lg font-bold leading-snug tracking-tight text-navy">
                {job.title}
              </h3>
              <p className="text-[0.9375rem] text-ieee">{job.company}</p>

              {job.link && (
                <a
                  href={job.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-all text-[0.8125rem] text-muted underline
                             underline-offset-2 hover:text-ieee focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-ieee/40"
                >
                  {job.link}
                </a>
              )}

              <details className="group mt-3">
                <summary
                  className="cursor-pointer list-none text-[0.8125rem] font-medium text-ieee
                             underline-offset-2 hover:underline focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-ieee/40"
                >
                  <span className="group-open:hidden">Read the posting</span>
                  <span className="hidden group-open:inline">Hide the posting</span>
                </summary>
                <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink/80">
                  {job.description}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function countWords(text) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length.toLocaleString()
}
