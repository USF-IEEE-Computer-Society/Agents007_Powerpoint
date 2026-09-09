import { useState } from 'react'
import JobForm from '../components/JobForm'
import JobList from '../components/JobList'

export default function JobsPage() {
  const [jobs, setJobs] = useState([])

  return (
    <>
      <JobForm onAdd={(job) => setJobs((prev) => [...prev, job])} />
      <JobList
        jobs={jobs}
        onRemove={(id) => setJobs((prev) => prev.filter((job) => job.id !== id))}
      />
    </>
  )
}
