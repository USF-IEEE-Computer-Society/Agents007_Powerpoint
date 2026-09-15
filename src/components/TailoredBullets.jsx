import { useState } from 'react'
import { tailorApi } from '../lib/api'

export default function TailoredBullets({ result, generating }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  async function downloadPdf() {
    setDownloading(true)
    setDownloadError('')
    try {
      const blob = await tailorApi.pdf(result)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tailored-bullets-${result.generatedAt.slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError("Couldn't build the PDF. Is the API running?")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section>
      <div className="flex items-baseline gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-navy">
          Your strongest {result ? result.selected.length : ''} for this job
        </h2>
        {result && result.selected.length > 0 && (
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="ml-auto shrink-0 rounded bg-ieee px-3 py-1.5 text-[0.8125rem]
                       font-medium text-white transition-colors hover:bg-ieee-dark
                       disabled:opacity-60 focus:outline-none focus-visible:ring-2
                       focus-visible:ring-ieee/40 focus-visible:ring-offset-2"
          >
            {downloading ? 'Building…' : 'Download PDF'}
          </button>
        )}
      </div>

      {downloadError && (
        <p role="alert" className="mt-3 text-[0.8125rem] text-red-800">
          {downloadError}
        </p>
      )}

      {generating ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Reading the posting against everything you have saved, and picking the
          ones that fit.
        </p>
      ) : !result ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          Nothing generated yet. Paste a posting and the experiences worth
          putting on this resume come back rewritten for it.
        </p>
      ) : result.selected.length === 0 ? (
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
          None of your saved experiences were a strong match for this posting.
          Try a different posting, or add experiences closer to this kind of
          work.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[0.8125rem] text-muted">
            Picked from {result.consideredCount}, strongest first
            {result.revisions > 0 &&
              ` · ${result.revisions} revision${result.revisions > 1 ? 's' : ''} after review`}
          </p>

          <ol className="mt-6 max-w-[38rem] space-y-7">
            {result.selected.map((experience, index) => (
              <li key={experience.experienceId} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full
                             bg-ieee text-[0.75rem] font-semibold text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-navy">
                    {experience.role}
                  </h3>
                  <p className="text-[0.9375rem] text-ieee">
                    {experience.company}
                  </p>
                  {experience.whyChosen && (
                    <p className="mt-1 text-[0.8125rem] italic leading-relaxed text-muted">
                      {experience.whyChosen}
                    </p>
                  )}
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
                </div>
              </li>
            ))}
          </ol>

          {result.notSelected.length > 0 && (
            <p className="mt-8 max-w-[38rem] border-t border-hairline pt-4 text-[0.8125rem] leading-relaxed text-muted">
              <span className="font-medium">Left out:</span>{' '}
              {result.notSelected.map((e) => e.role).join(', ')}
            </p>
          )}
        </>
      )}
    </section>
  )
}
