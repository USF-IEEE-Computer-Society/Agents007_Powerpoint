import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ExperiencesPage from './pages/ExperiencesPage.jsx'
import JobsPage from './pages/JobsPage.jsx'
import TailorPage from './pages/TailorPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<ExperiencesPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="tailor" element={<TailorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
