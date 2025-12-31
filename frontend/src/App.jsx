import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Trash2, Zap, LogIn, Paperclip, X, Image as ImageIcon, FileText, History, Globe, Mic } from 'lucide-react'
import MessageBubble from './components/MessageBubble'
import ThinkingIndicator from './components/ThinkingIndicator'
import SourceCard from './components/SourceCard'
import AuthModal from './components/AuthModal'
import UserMenu from './components/UserMenu'
import { saveChatMessage, getChatHistory, clearChatHistory } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'

// API Base URL - use environment variable in production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingStatus, setThinkingStatus] = useState('')
  const [currentSources, setCurrentSources] = useState([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState([]) // Separate state for sidebar history

  // Attachment menu state
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const isProcessing = useRef(false) // Ref to track processing state
  const { user, isAuthenticated } = useAuth()

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Load chat history for the sidebar only (keep main chat fresh)
  useEffect(() => {
    const loadHistory = async () => {
      if (isAuthenticated && user) {
        const history = await getChatHistory(user.id)
        if (history && history.length > 0) {
          setHistoryItems(history)
          // Note: We no longer call setMessages(history) here to keep the main view "fresh"
        }
      }
    }
    loadHistory()
  }, [isAuthenticated, user])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttachMenu && !event.target.closest('.attach-menu-container')) {
        setShowAttachMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAttachMenu])

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
    // Reset input so same file can be selected again if needed
    e.target.value = ''
  }

  const handleAttachmentOption = (type) => {
    setShowAttachMenu(false)
    if (fileInputRef.current) {
      if (type === 'image') {
        fileInputRef.current.accept = "image/png,image/jpeg,image/webp,.gif"
      } else if (type === 'pdf') {
        fileInputRef.current.accept = ".pdf"
      } else {
        fileInputRef.current.accept = ".pdf,.png,.jpg,.jpeg,.webp,.gif"
      }
      fileInputRef.current.click()
    }
  }

  // Handle sending message with streaming
  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading || isProcessing.current) return

    const userMessage = input.trim()
    const currentFile = selectedFile

    // Set locks and UI state
    isProcessing.current = true
    setIsLoading(true)
    setInput('')
    setSelectedFile(null)
    setThinkingStatus('Thinking...')
    setCurrentSources([])

    // Construct the new message object
    let displayContent = userMessage
    if (currentFile) {
      displayContent = userMessage ? `${userMessage} \n[Attached: ${currentFile.name}]` : `[Attached: ${currentFile.name}]`
    }

    const newUserMsg = { role: 'user', content: displayContent }

    // Save User message to Supabase
    if (isAuthenticated && user) {
      await saveChatMessage(user.id, 'user', displayContent)
      // Refresh history sidebar to show new search
      const history = await getChatHistory(user.id)
      setHistoryItems(history || [])
    }

    // Create the message chain to be used for this session
    // We use a local variable to prevent race conditions with state updates
    const currentMessageChain = [...messages, newUserMsg]

    // Optimistic Update
    setMessages(currentMessageChain)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('message', userMessage || 'Analyzing attached file...')

      // Sanitize history to send only role and content
      // Note: We use 'messages' (current state before optimistic update) to avoid sending the current message in history logic if backend appends it manually
      const historyPayload = messages.map(({ role, content }) => ({ role, content }))
      formData.append('conversation_history', JSON.stringify(historyPayload))

      if (currentFile) {
        formData.append('file', currentFile)
      }

      // Use streaming endpoint
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let sources = []

      // Add placeholder for assistant message
      setMessages([...currentMessageChain, { role: 'assistant', content: '', isStreaming: true }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'status') {
                setThinkingStatus(data.content)
              } else if (data.type === 'content') {
                assistantMessage += data.content
                setMessages([
                  ...currentMessageChain,
                  { role: 'assistant', content: assistantMessage, isStreaming: true },
                ])
              } else if (data.type === 'sources') {
                sources = data.content
                setCurrentSources(sources)
              } else if (data.type === 'done') {
                const updatedMessages = [
                  ...currentMessageChain,
                  { role: 'assistant', content: assistantMessage, sources: sources },
                ]
                setMessages(updatedMessages)

                // Save Assistant message to Supabase
                if (isAuthenticated && user) {
                  const { data } = await saveChatMessage(user.id, 'assistant', assistantMessage, sources)
                  // Refresh history sidebar
                  const updatedHistory = await getChatHistory(user.id)
                  setHistoryItems(updatedHistory)
                }
              } else if (data.type === 'error') {
                throw new Error(data.content)
              }
            } catch (e) {
              if (line.slice(6).trim()) {
                console.log('Parse error for line:', line)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([
        ...currentMessageChain,
        {
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${error.message}. Please make sure the backend server is running.`,
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
      setThinkingStatus('')
      isProcessing.current = false
    }
  }

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Clear conversation
  const handleClear = async () => {
    if (isAuthenticated && user) {
      await clearChatHistory(user.id)
      setHistoryItems([])
    }
    setMessages([])
    setCurrentSources([])
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Complete Black Background Theme */}
      <div className="fixed inset-0 pointer-events-none z-0 premium-bg">
        {/* Subtle Dark Matter Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Tactical Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-black/60 backdrop-blur-md border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-c-primary" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold animate-glow">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Ai Chatbot</span>
            </h1>
          </motion.div>

          <div className="flex items-center gap-2">


            {messages.length > 0 && (
              <motion.button
                onClick={handleClear}
                className="p-2 rounded-lg glass hover:bg-red-500/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Clear conversation"
              >
                <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-400" />
              </motion.button>
            )}

            {!isAuthenticated && (
              <motion.button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main chat area */}
      <main className="flex-1 pt-24 pb-60 px-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="orb-container mb-12"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  <div className="orb" />
                  <div className="orb-glow" />
                </motion.div>

                <h2 className="text-4xl md:text-5xl font-medium mb-4 text-white tracking-tight">
                  Ai Chatbot
                </h2>
                <p className="text-2xl md:text-3xl text-gray-400 font-light">
                  How can I help you with anything?
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    index={index}
                  />
                ))}

                {/* Sources */}
                {currentSources.length > 0 && (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {currentSources.map((source, i) => (
                      <SourceCard key={i} source={source} index={i} />
                    ))}
                  </motion.div>
                )}

                {/* Thinking indicator */}
                {isLoading && thinkingStatus && (
                  <ThinkingIndicator status={thinkingStatus} />
                )}


              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main >

      {/* Input area */}
      <motion.footer
        className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-black/20 backdrop-blur-3xl"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* File Preview */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                className="mb-3 flex items-center gap-2 bg-[#0a0a0f] border border-white/10 rounded-xl p-2 max-w-fit pr-4 shadow-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  {selectedFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Paperclip className="w-5 h-5 text-c-accent" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-200 font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex-1 relative flex flex-col bg-[#0d0d15]/80 border border-white/[0.08] rounded-3xl transition-all p-3 shadow-2xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Chat..."
                rows={1}
                autoComplete="off"
                name="chat-input-field"
                spellCheck="false"
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-white placeholder-gray-500 py-2 px-2 resize-none text-lg font-light"
                style={{
                  minHeight: '40px',
                  maxHeight: '200px',
                }}
                disabled={isLoading}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <div className="relative attach-menu-container">
                    <AnimatePresence>
                      {showAttachMenu && (
                        <motion.div
                          className="absolute bottom-full left-0 mb-3 p-1.5 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl flex flex-col gap-1 min-w-[160px] overflow-hidden"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            onClick={() => handleAttachmentOption('image')}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                          >
                            <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 group-hover:text-purple-300 transition-colors">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Upload Image</span>
                          </button>
                          <button
                            onClick={() => handleAttachmentOption('pdf')}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors text-left group"
                          >
                            <div className="p-1.5 rounded-md bg-red-500/20 text-red-400 group-hover:bg-red-500/30 group-hover:text-red-300 transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white">Upload PDF</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                      title="Attach File"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>

                  <button className="message-pill">
                    <ImageIcon className="w-4 h-4" />
                    <span>Create an image</span>
                  </button>

                  <button className="message-pill">
                    <Globe className="w-4 h-4" />
                    <span>Search the web</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                    <Mic className="w-5 h-5" />
                  </button>

                  <motion.button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedFile) || isLoading}
                    className={`p-2.5 rounded-xl transition-all ${(input.trim() || selectedFile) && !isLoading
                      ? 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10'
                      : 'text-gray-600 cursor-not-allowed'
                      }`}
                    whileHover={(input.trim() || selectedFile) && !isLoading ? { scale: 1.05 } : {}}
                    whileTap={(input.trim() || selectedFile) && !isLoading ? { scale: 0.95 } : {}}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-2">
            Ai Chatbot may produce inaccurate information. Verify important facts.
          </p>
        </div>
      </motion.footer >

      {/* Auth Modal */}
      < AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm glass-card border-l border-white/10 z-[70] flex flex-col p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-violet-400">
                  <History className="w-6 h-6" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">History</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-20 text-center">
                    <History className="w-12 h-12 text-gray-700 mb-4 opacity-20" />
                    <p className="text-gray-500 font-medium tracking-wide">Your history is clear</p>
                  </div>
                ) : (
                  [...historyItems].reverse().filter(m => m.role === 'user').map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-full text-left p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group relative cursor-pointer"
                      onClick={() => {
                        // Optional: Load this item into the main chat if clicked
                        setMessages([m]);
                        setShowHistory(false);
                      }}
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white mb-2 pr-4 leading-normal">
                        {m.content.slice(0, 100)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    handleClear();
                    setShowHistory(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all border border-red-500/20 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Clear Archive
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Profile - Bottom Left */}
      {isAuthenticated && (
        <div className="fixed bottom-6 left-6 z-[100]">
          <UserMenu user={user} />
        </div>
      )}
    </div >
  )
}

export default App
