import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, Sparkles, Sliders, HelpCircle, ChevronRight } from 'lucide-react'
import { signOut } from '../lib/supabase'

const UserMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'S'
  const userName = user?.user_metadata?.full_name || 'S.Srikanth'
  const userHandle = `@${user?.email?.split('@')[0] || 'srikanthchauhan010'}`

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger (The small pill in the image) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-[#171717] hover:bg-[#222] transition-all border border-white/5 shadow-lg group"
      >
        <div className="w-9 h-9 rounded-full bg-[#007aff] flex items-center justify-center text-white font-medium text-lg">
          {userInitial.toUpperCase()}
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-white text-[13px] font-semibold">{userName}</span>
          <span className="text-gray-500 text-[11px]">Go</span>
        </div>
      </button>

      {/* Main Profile Dropdown (Matches requested image) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute bottom-full left-0 mb-4 w-[280px] bg-[#222222] rounded-[24px] border border-white/10 shadow-2xl p-2 z-[100]"
          >
            {/* User identification */}
            <div className="flex items-center gap-3 p-3 mb-1">
              <div className="w-11 h-11 rounded-full bg-gray-600/40 flex items-center justify-center text-gray-300 text-lg font-medium">
                {userInitial.toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-semibold text-[15px] truncate">{userName}</span>
                <span className="text-gray-500 text-[13px] truncate">{userHandle}</span>
              </div>
            </div>

            <div className="h-px bg-white/5 mx-2 mb-2" />

            {/* Menu Items */}
            <div className="space-y-0.5">
              <MenuButton icon={<Sparkles className="w-5 h-5" />} label="Upgrade plan" />
              <MenuButton icon={<Sliders className="w-5 h-5" />} label="Personalization" />
              <MenuButton icon={<Settings className="w-5 h-5" />} label="Settings" />
            </div>

            <div className="h-px bg-white/5 mx-2 my-2" />

            <div className="space-y-0.5">
              <MenuButton
                icon={<HelpCircle className="w-5 h-5" />}
                label="Help"
                trailing={<ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />}
              />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/5 transition-all text-left"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                <span className="text-[15px] font-medium">Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MenuButton = ({ icon, label, trailing }) => (
  <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/5 transition-all text-left group">
    <div className="text-gray-400 group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="text-[15px] font-medium flex-1">{label}</span>
    {trailing}
  </button>
)

export default UserMenu
