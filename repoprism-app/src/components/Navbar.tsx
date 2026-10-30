import { motion } from 'framer-motion'
import { GitBranch, Star, Zap } from 'lucide-react'

const PrismLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <polygon
      points="16,2 30,26 2,26"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <polygon points="16,10 23,22 9,22" fill="white" opacity="0.14" />
    <line x1="16" y1="2" x2="16" y2="10" stroke="white" strokeWidth="1.4" opacity="0.45" />
  </svg>
)

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      aria-label="Main navigation"
    >
      <div
        className="mx-auto max-w-5xl px-4 sm:px-6 mt-3 sm:mt-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px 0 rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between h-14 px-2">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2.5">
            <PrismLogo />
            <span
              className="text-white font-semibold text-base tracking-tight"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              RepoPrism
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              v0.1
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* GitHub star button */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              id="nav-github-star"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#d4d4d8',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.25)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#d4d4d8'
              }}
              aria-label="Star on GitHub"
            >
              <GitBranch size={12} strokeWidth={1.8} />
              <span>Star</span>
              <div className="flex items-center gap-0.5" style={{ color: '#71717a' }}>
                <Star size={10} fill="currentColor" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>0</span>
              </div>
            </a>

            {/* ⌘K chip */}
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#71717a',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
              }}
              title="Open command palette"
              aria-label="Press ⌘K to open command palette"
            >
              <Zap size={10} strokeWidth={1.8} />
              <span>⌘K</span>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
