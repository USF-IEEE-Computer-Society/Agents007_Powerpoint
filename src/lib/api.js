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
    throw new Error(`${options.method ?? 'GET'} /api${path} failed (${response.status})`)
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
