import { byMostRecent, formatRange } from '../lib/dates'

export default function ExperienceTimeline({ experiences, onRemove }) {
  const ordered = [...experiences].sort(byMostRecent)

  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight text-navy">
        Your record
      </h2>

      {ordered.length === 0 ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Nothing here yet. Add your first experience and it lands on this
          timeline, most recent at the top.
        </p>
      ) : (
        <ol className="mt-6 max-w-[38rem] border-l-2 border-navy/15">
          {ordered.map((exp) => (
            <li key={exp.id} className="relative pb-8 pl-6 last:pb-0">
              <span
                aria-hidden="true"
                className={`absolute -left-[7px] top-1.5 size-3 rounded-full ring-4 ring-ground ${
                  exp.current ? 'bg-usf-green' : 'bg-ieee'
                }`}
              />

              <div className="flex items-baseline gap-3">
                <p className="text-[0.8125rem] font-medium text-muted">
                  {formatRange(exp)}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(exp.id)}
                  className="ml-auto rounded text-[0.8125rem] text-muted/70 underline-offset-2
                             hover:text-ieee hover:underline focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-ieee/40"
                >
                  Remove
                </button>
              </div>

              <h3 className="mt-1 font-display text-lg font-bold leading-snug tracking-tight text-navy">
                {exp.role}
              </h3>
              <p className="text-[0.9375rem] text-ieee">
                {exp.company}
                {exp.location && (
                  <span className="text-muted"> — {exp.location}</span>
                )}
              </p>

              {exp.description && (
                <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink/80">
                  {exp.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
