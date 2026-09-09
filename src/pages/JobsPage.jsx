import { useState } from 'react'
import JobForm from '../components/JobForm'
import JobList from '../components/JobList'
import { api } from '../lib/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState('')

  async function add(job) {
    try {
      const saved = await api.createJob(job)
      setJobs((prev) => [...prev, saved])
      setError('')
      return true
    } catch {
      setError("Couldn't save that posting. Is the API running?")
      return false
    }
  }

  async function remove(id) {
    try {
      await api.deleteJob(id)
      setJobs((prev) => prev.filter((job) => job.id !== id))
      setError('')
    } catch {
      setError("Couldn't remove that posting. Is the API running?")
    }
  }

  return (
    <>
      <JobForm onAdd={add} error={error} />
      <JobList jobs={jobs} onRemove={remove} />
    </>
  )
}
