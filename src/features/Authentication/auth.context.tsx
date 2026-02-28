import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { User } from '@supabase/supabase-js'
import supabase from '../../utils/supabase'
import type { RegisterDTO } from './Dto/RegisterDto'
import type { LoginDTO } from './Dto/loginDTo'

type AuthContextType = {
  user: User | null
  role: string | null
  poste: string | null
  isValidated: boolean
  signUp: (payload: RegisterDTO) => Promise<any>
  signIn: (payload: LoginDTO) => Promise<any>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [poste, setPoste] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          is_validated,
          roles (
            name
          ),
          postes (
            name
          )
        `)
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user data:', error)
        return { role: 'member', isValidated: false }
      }

      if (!data) {
        // Profile doesn't exist, self-heal by upserting
        console.warn("Profile missing. Auto-generating profile for user: ", currentUser.id);
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          fullname: currentUser.user_metadata?.fullname || currentUser.email?.split('@')[0] || 'Unknown User'
        });

        if (insertError) {
          console.error("Failed to auto-generate profile:", insertError);
        }
        return { role: 'member', poste: null, isValidated: false };
      }

      return {
        // @ts-ignore
        role: data?.roles?.name || 'member',
        // @ts-ignore
        poste: data?.postes?.name || null,
        isValidated: data?.is_validated || false
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
      return { role: 'member', poste: null, isValidated: false }
    }
  }

  useEffect(() => {
    // get current session
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchUserData(currentUser).then(res => {
          setRole(res.role)
          setPoste(res.poste)
          setIsValidated(res.isValidated)
          setLoading(false)
        })
      } else {
        setRole(null)
        setPoste(null)
        setIsValidated(false)
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchUserData(currentUser).then(res => {
            setRole(res.role)
            setPoste(res.poste)
            setIsValidated(res.isValidated)
          })
        } else {
          setRole(null)
          setPoste(null)
          setIsValidated(false)
        }
      },
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (payload: RegisterDTO) => {
    const { email, password, fullname, phone, birth_date } = payload

    // 0. Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existingProfile) {
      return { error: { message: 'A member with this email already exists.' } }
    }

    // 1. Create user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullname,
          phone,
          birth_date
        }
      }
    })
    if (error) return { error }

    return { data }
  }
  const signIn = (payload: LoginDTO) => {
    const { email, password } = payload
    return supabase.auth.signInWithPassword({ email, password })
  }

  const queryClient = useQueryClient()

  const signOut = async () => {
    try {
      setLoading(true) // Show loading state during logout
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error during sign out:', error)
    } finally {
      setUser(null)
      setRole(null)
      setPoste(null)
      setIsValidated(false)
      queryClient.clear()
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, poste, isValidated, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
