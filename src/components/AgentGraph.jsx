import { useEffect, useRef, useState } from 'react'
import { tailorApi } from '../lib/api'

/**
 * Renders the agent's own diagram, fetched from the compiled graph rather than
 * drawn by hand — so it can never drift from what the code actually does.
 *
 * mermaid is loaded lazily: it is large, and only this panel needs it.
 */
export default function AgentGraph() {
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)
  const renderId = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function draw() {
      try {
        const { mermaid: source } = await tailorApi.graph()
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' })

        // Ids must be unique per render or mermaid reuses a stale node.
        renderId.current += 1
        const { svg: rendered } = await mermaid.render(
          `agent-graph-${renderId.current}`,
          source,
        )
        if (!cancelled) setSvg(rendered)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    draw()
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) return null

  return (
    <details className="mt-8 max-w-[38rem] border-t border-hairline pt-4">
      <summary
        className="cursor-pointer list-none text-[0.8125rem] font-medium text-ieee
                   underline-offset-2 hover:underline focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-ieee/40"
      >
        How the agent works
      </summary>

      <p className="mt-3 max-w-[58ch] text-[0.8125rem] leading-relaxed text-muted">
        A LangGraph state machine, not a single call. It picks experiences,
        drafts bullets, then criticises its own draft against what you actually
        wrote. If the critic finds an invented claim, the dotted edge sends the
        bullets back to be rewritten — up to twice, so it cannot loop forever.
      </p>

      <div className="mt-4 overflow-x-auto rounded border border-hairline bg-white p-4">
        {svg ? (
          <div
            className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
            // Mermaid output, generated from our own graph — not user content.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <p className="text-[0.8125rem] text-muted">Loading diagram…</p>
        )}
      </div>
    </details>
  )
}
