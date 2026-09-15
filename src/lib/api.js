/**
 * Thin wrapper over the FastAPI service. Vite proxies /api to it in dev,
 * so these are same-origin requests.
 */

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const error = new Error(
      `${options.method ?? 'GET'} /api${path} failed (${response.status})`,
    )
    error.status = response.status
    // FastAPI puts the readable reason in `detail`. Keep it on the error so
    // the page can show why rather than just that something failed.
    error.detail = await response
      .json()
      .then((body) => (typeof body.detail === 'string' ? body.detail : null))
      .catch(() => null)
    throw error
  }

  // 204 has no body.
  return response.status === 204 ? null : response.json()
}

export const experiencesApi = {
  list: () => request('/experiences'),
  create: (experience) =>
    request('/experiences', { method: 'POST', body: JSON.stringify(experience) }),
  remove: (id) => request(`/experiences/${id}`, { method: 'DELETE' }),
}

export const jobsApi = {
  list: () => request('/jobs'),
  create: (job) => request('/jobs', { method: 'POST', body: JSON.stringify(job) }),
  remove: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
}

export const tailorApi = {
  graph: () => request('/agent/graph'),

  /**
   * Runs the agent, calling onEvent for each node as it finishes so the page
   * can show the graph working. Server-sent events over a POST, so this reads
   * the body stream directly rather than using EventSource (which is GET only).
   */
  async run({ jobDescription, maxExperiences }, onEvent) {
    const response = await fetch('/api/tailor/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription, maxExperiences }),
    })

    if (!response.ok) {
      const error = new Error(`Agent run failed (${response.status})`)
      error.detail = await response
        .json()
        .then((body) => (typeof body.detail === 'string' ? body.detail : null))
        .catch(() => null)
      throw error
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = null

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Events are separated by a blank line. Keep the trailing partial.
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const line = chunk.split('\n').find((l) => l.startsWith('data: '))
        if (!line) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'done') result = event.result
        else if (event.type === 'error') throw Object.assign(new Error(event.detail), { detail: event.detail })
        else onEvent(event)
      }
    }

    if (!result) throw new Error('The agent stream ended without a result')
    return result
  },

  /** Renders a result the browser already has — no second model call. */
  async pdf(result) {
    const response = await fetch('/api/tailor/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    })
    if (!response.ok) throw new Error(`PDF failed (${response.status})`)
    return response.blob()
  },
}
