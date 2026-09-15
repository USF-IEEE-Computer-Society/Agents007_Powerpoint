const LABELS = {
  select: 'Selecting',
  write: 'Writing bullets',
  critique: 'Checking against your own words',
}

/**
 * The live view of the graph running. Each node emits one step; a second
 * `write` after a `critique` is the cycle firing, which is the whole point of
 * showing this.
 */
export default function AgentRun({ steps, running }) {
  if (steps.length === 0 && !running) return null

  return (
    <ol className="mb-8 max-w-[38rem] space-y-2 border-b border-hairline pb-5">
      {steps.map((step, index) => {
        const isRevision = step.node === 'write' && step.revisions > 0
        return (
          <li
            key={`${step.node}-${index}`}
            className="flex items-baseline gap-3 text-[0.8125rem]"
          >
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${
                isRevision ? 'bg-usf-gold' : 'bg-usf-green'
              }`}
            />
            <span className="font-medium text-navy">
              {LABELS[step.node] ?? step.node}
              {isRevision && (
                <span className="text-muted"> · revision {step.revisions}</span>
              )}
            </span>
            <span className="text-muted">{step.detail}</span>
          </li>
        )
      })}

      {running && (
        <li className="flex items-baseline gap-3 text-[0.8125rem] text-muted">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 animate-pulse rounded-full bg-ieee"
          />
          Working…
        </li>
      )}
    </ol>
  )
}
