export default function TailoredBullets({ result, generating }) {
  return (
    <section>
      <div className="flex items-baseline gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-navy">
          Tailored bullets
        </h2>
        {result && (
          <button
            type="button"
            onClick={() => download(result)}
            className="ml-auto rounded border border-ieee px-3 py-1.5 text-[0.8125rem]
                       font-medium text-ieee transition-colors hover:bg-ieee hover:text-white
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-ieee/40"
          >
            Download JSON
          </button>
        )}
      </div>

      {generating ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Reading the posting against everything you have saved. This takes a
          few seconds.
        </p>
      ) : !result ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Nothing generated yet. Paste a posting and your saved experiences come
          back rewritten for it.
        </p>
      ) : (
        <div className="mt-6 max-w-[38rem] space-y-7">
          {result.experiences.map((experience) => (
            <article key={experience.experienceId}>
              <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-navy">
                {experience.role}
              </h3>
              <p className="text-[0.9375rem] text-ieee">{experience.company}</p>
              <ul className="mt-2 space-y-1.5">
                {experience.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="relative pl-4 text-[0.9375rem] leading-relaxed text-ink/85
                               before:absolute before:left-0 before:text-muted before:content-['—']"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function download(result) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `tailored-bullets-${result.generatedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
