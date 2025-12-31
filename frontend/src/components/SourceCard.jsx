import { motion } from 'framer-motion'
import { ExternalLink, Globe } from 'lucide-react'

function SourceCard({ source, index }) {
  // Extract domain from URL
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain
    } catch {
      return 'Source'
    }
  }

  return (
    <motion.a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass source-card rounded-xl p-3 block group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-c-darker flex items-center justify-center">
            <Globe className="w-3 h-3 text-c-accent" />
          </div>
          <span className="text-xs text-c-accent truncate">
            {getDomain(source.url)}
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-c-primary transition-colors flex-shrink-0" />
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-white mb-1 line-clamp-2 group-hover:text-c-accent transition-colors">
        {source.title}
      </h4>

      {/* Snippet */}
      {source.snippet && (
        <p className="text-xs text-gray-400 line-clamp-2">
          {source.snippet}
        </p>
      )}
    </motion.a>
  )
}

export default SourceCard
