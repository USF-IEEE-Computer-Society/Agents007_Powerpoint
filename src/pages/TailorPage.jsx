import { useState } from 'react'
import TailorForm from '../components/TailorForm'
import TailoredBullets from '../components/TailoredBullets'
import { tailorApi } from '../lib/api'

export default function TailorPage() {
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function generate(jobDescription, maxExperiences) {
    setGenerating(true)
    setError('')
    try {
      setResult(await tailorApi.generate(jobDescription, maxExperiences))
    } catch (failure) {
      // The API puts the useful part in `detail` — no experiences saved, no
      // API key, model call failed. Show that rather than a status code.
      setError(failure.detail ?? 'Generating bullets failed. Is the API running?')
      setResult(null)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <TailorForm onGenerate={generate} generating={generating} error={error} />
      <TailoredBullets result={result} generating={generating} />
    </>
  )
}
