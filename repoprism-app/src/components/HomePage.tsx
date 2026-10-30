import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Navbar from './Navbar'
import HeroInput from './HeroInput'
import FeaturePillars from './FeaturePillars'

const MicroPill = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: -6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 20px 0 rgba(0,0,0,0.5)',
    }}
  >
    <Sparkles size={11} strokeWidth={1.8} style={{ color: '#a1a1aa' }} />
    <span
      className="text-[11px] tracking-wide"
      style={{
        color: '#a1a1aa',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        letterSpacing: '0.04em',
      }}
    >
      Open Source Onboarding Reimagined
    </span>
  </motion.div>
)

const Headline = () => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
    className="flex flex-col gap-1 text-center"
  >
    <h1
      className="font-bold leading-tight tracking-tight"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        letterSpacing: '-0.04em',
        color: '#ffffff',
        lineHeight: 1.12,
      }}
    >
      Understand any codebase.
      <br />
      Make your first contribution.
    </h1>
  </motion.div>
)

const Subheadline = () => (
  <motion.p
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
    className="text-center max-w-xl mx-auto leading-relaxed"
    style={{
      color: '#71717a',
      fontFamily: "'Inter', sans-serif",
      fontWeight: 300,
      fontSize: 'clamp(13px, 1.8vw, 15px)',
    }}
  >
    Paste any public repository URL. Get an interactive architecture canvas,
    modular explainer cards, and curated issues you can actually fix.
  </motion.p>
)

const Footer = () => (
  <motion.footer
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.5 }}
    className="w-full flex flex-col items-center gap-2 pb-8 pt-4"
    aria-label="Page footer"
  >
    <p
      className="text-[11px] text-center"
      style={{ color: '#3f3f46', fontFamily: "'Inter', sans-serif" }}
    >
      Built for open-source contributors&nbsp;•&nbsp;Free &amp; open source
    </p>
    <p
      className="text-[11px] text-center"
      style={{ color: '#27272a', fontFamily: "'JetBrains Mono', monospace" }}
    >
      Press{' '}
      <kbd
        className="inline-flex items-center px-1.5 rounded"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#3f3f46',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        Enter
      </kbd>{' '}
      to analyze
    </p>
  </motion.footer>
)

// Thin divider line with fade-out on ends
const Divider = () => (
  <div
    className="w-full max-w-4xl mx-auto"
    style={{
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)',
    }}
  />
)

interface HomePageProps {
  onAnalyze?: (url?: string) => Promise<void> | void
}

const HomePage = ({ onAnalyze }: HomePageProps) => {
  const handleAnalyze = async (url: string) => {
    if (onAnalyze) {
      await onAnalyze(url)
    }
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{ background: '#050505' }}
    >
      {/* Background layers */}
      <div className="ambient-glow" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6"
        style={{ paddingTop: '120px', paddingBottom: '60px' }}
      >
        {/* Hero section */}
        <section
          className="w-full flex flex-col items-center gap-6 mb-16"
          aria-labelledby="hero-headline"
        >
          <MicroPill />
          <div className="flex flex-col items-center gap-4">
            <Headline />
            <Subheadline />
          </div>

          {/* Central input — the focal point */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            <HeroInput onAnalyze={handleAnalyze} onQuickAnalyze={onAnalyze} />
          </motion.div>
        </section>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.6 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-4xl mb-12"
        >
          <Divider />
        </motion.div>

        {/* Feature pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl"
        >
          <FeaturePillars />
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

export default HomePage
