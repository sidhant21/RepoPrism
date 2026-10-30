import { motion } from 'framer-motion'
import { Network, LayoutGrid, GitPullRequest } from 'lucide-react'

interface FeatureCard {
  id: string
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  delay: number
}

const FEATURES: FeatureCard[] = [
  {
    id: 'feature-canvas',
    icon: <Network size={18} strokeWidth={1.5} />,
    badge: 'Architecture',
    title: 'Visual System Canvas',
    description:
      'Interactive node-graph diagram mapping entrypoints to data stores. See the full shape of a codebase in seconds.',
    delay: 0.1,
  },
  {
    id: 'feature-explainer',
    icon: <LayoutGrid size={18} strokeWidth={1.5} />,
    badge: 'Explainer',
    title: 'Modular Explainer Cards',
    description:
      'Bite-sized breakdowns of core architecture, eliminating cognitive overload. Each card is a focused mental model.',
    delay: 0.2,
  },
  {
    id: 'feature-issues',
    icon: <GitPullRequest size={18} strokeWidth={1.5} />,
    badge: 'First PR',
    title: 'Targeted First Issues',
    description:
      'Curated GitHub issues and AI-detected codebase gaps ready for your first PR. No more "where do I even start?"',
    delay: 0.3,
  },
]

const FeaturePillars = () => {
  return (
    <section aria-labelledby="features-heading" className="w-full max-w-4xl mx-auto px-4">
      <h2 id="features-heading" className="sr-only">
        What RepoPrism gives you
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {FEATURES.map(feature => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </section>
  )
}

const FeatureCard = ({ id, icon, badge, title, description, delay }: FeatureCard) => {
  return (
    <motion.article
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="group relative flex flex-col gap-4 p-5 rounded-2xl transition-all duration-300 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'
        ;(e.currentTarget as HTMLElement).style.background =
          'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLElement).style.background =
          'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      }}
    >
      {/* Icon + Badge row */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a1a1aa',
          }}
        >
          {icon}
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#71717a',
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-2">
        <h3
          className="text-sm font-medium leading-snug"
          style={{ color: '#e4e4e7', fontFamily: "'Inter', sans-serif" }}
        >
          {title}
        </h3>
        <p
          className="text-xs leading-relaxed"
          style={{ color: '#71717a', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
        >
          {description}
        </p>
      </div>

      {/* Subtle bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
      />
    </motion.article>
  )
}

export default FeaturePillars
