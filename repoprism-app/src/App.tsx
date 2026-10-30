import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HomePage from './components/HomePage'
import DashboardPage from './components/dashboard/DashboardPage'

type Page = 'home' | 'dashboard'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [analysisData, setAnalysisData] = useState<any | null>(null)

  const handleAnalyze = async (url?: string) => {
    if (!url) {
      // Instant fallback or quick analyze
      setPage('dashboard')
      return
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `Failed to analyze repository (${res.status})`)
      }

      const data = await res.json()
      setAnalysisData(data)
      setPage('dashboard')
    } catch (err) {
      console.error('Analysis request error:', err)
      throw err
    }
  }

  return (
    <AnimatePresence mode="wait">
      {page === 'home' ? (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <HomePage onAnalyze={handleAnalyze} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <DashboardPage data={analysisData} onBack={() => setPage('home')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
