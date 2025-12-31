import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function MessageBubble({ message, index }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Custom components for ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const codeString = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="relative group my-4">
            <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                {match[1]}
              </span>
              <button
                onClick={() => handleCopy(codeString)}
                className="p-1.5 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-xl !bg-c-darker/80 !p-4 !m-0 border border-white/10"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code className="bg-c-primary/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    },
    p({ children }) {
      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
    },
    li({ children }) {
      return <li className="text-gray-200">{children}</li>
    },
    h1({ children }) {
      return <h1 className="text-2xl font-bold mb-3 text-white">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-xl font-bold mb-2 text-white">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-lg font-semibold mb-2 text-white">{children}</h3>
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-c-primary pl-4 my-3 italic text-gray-300">
          {children}
        </blockquote>
      )
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-c-accent hover:text-c-primary underline underline-offset-2 transition-colors"
        >
          {children}
        </a>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
            {children}
          </table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th className="bg-c-darker px-4 py-2 text-left text-sm font-semibold border-b border-white/10">
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td className="px-4 py-2 text-sm border-b border-white/5">
          {children}
        </td>
      )
    },
  }

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: index * 0.05,
      }}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-c-primary to-c-secondary flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[85%] md:max-w-[75%] ${isUser
            ? 'bg-c-primary/20 backdrop-blur-xl border border-c-primary/30 text-white rounded-2xl rounded-tr-md'
            : 'bg-white/[0.03] backdrop-blur-2xl border border-white/10 text-gray-100 rounded-2xl rounded-tl-md shadow-2xl'
          } px-5 py-3.5 ${message.isError ? 'border-red-500/50 bg-red-500/5' : ''}`}
      >
        {isUser ? (
          <p className="text-white">{message.content}</p>
        ) : (
          <div className={`prose prose-invert max-w-none ${message.isStreaming ? 'typing-cursor' : ''}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {message.content || ''}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
        >
          <User className="w-4 h-4 text-gray-300" />
        </motion.div>
      )}
    </motion.div>
  )
}

export default MessageBubble
