import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

function ThinkingIndicator({ status }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Avatar */}
      <motion.div
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-c-primary to-c-secondary flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </motion.div>

      {/* Simple animated dots only */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-c-primary to-c-secondary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default ThinkingIndicator
