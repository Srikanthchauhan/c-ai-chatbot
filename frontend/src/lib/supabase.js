import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if credentials are provided
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Auth helper functions
export const signUpWithEmail = async (email, password, fullName) => {
  if (!supabase) return { data: null, error: { message: 'Auth not configured' } }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  return { data, error }
}

export const signInWithEmail = async (email, password) => {
  if (!supabase) return { data: null, error: { message: 'Auth not configured' } }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  if (!supabase) return { data: null, error: { message: 'Auth not configured' } }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  return { data, error }
}

export const signOut = async () => {
  if (!supabase) return { error: { message: 'Auth not configured' } }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const onAuthStateChange = (callback) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}

// Database helper functions for Chat History
export const saveChatMessage = async (userId, role, content, sources = []) => {
  console.log('Saving message to Supabase:', { role, contentLength: content.length });
  const { data, error } = await supabase
    .from('chat_history')
    .insert([
      {
        user_id: userId,
        role,
        content,
        sources, // Supabase handles jsonb as objects automatically
        created_at: new Date().toISOString()
      },
    ])
  if (error) console.error('Error saving message:', error);
  return { data, error }
}

export const getChatHistory = async (userId) => {
  console.log('Fetching history for user:', userId);
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

export const clearChatHistory = async (userId) => {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId)
  return { error }
}
