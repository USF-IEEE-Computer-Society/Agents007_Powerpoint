import { useState } from 'react'
import TailorForm from '../components/TailorForm'
import TailoredBullets from '../components/TailoredBullets'
import AgentRun from '../components/AgentRun'
import AgentGraph from '../components/AgentGraph'
import { tailorApi } from '../lib/api'

export default function TailorPage() {
  const [result, setResult] = useState(null)
  const [steps, setSteps] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function generate(jobDescription, maxExperiences) {
    setGenerating(true)
    setError('')
    setSteps([])
    setResult(null)
    try {
      // Each node reports as it finishes, so the graph is visible while it runs.
      const finished = await tailorApi.run(
        { jobDescription, maxExperiences },
        (step) => setSteps((prev) => [...prev, step]),
      )
      setResult(finished)
    } catch (failure) {
      setError(failure.detail ?? 'The agent run failed. Is the API running?')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <TailorForm onGenerate={generate} generating={generating} error={error} />
      <div>
        <AgentRun steps={steps} running={generating} />
        <TailoredBullets result={result} generating={generating} />
        <AgentGraph />
      </div>
    </>
  )
}
