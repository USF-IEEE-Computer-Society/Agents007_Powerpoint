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
  generate: (jobDescription, maxExperiences) =>
    request('/tailor', {
      method: 'POST',
      body: JSON.stringify({ jobDescription, maxExperiences }),
    }),

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
