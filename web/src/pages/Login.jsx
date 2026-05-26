import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button, Card, Input } from '../components/ui/Library'
import client from '../api/client'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Role → redirect path (matches manuscript platform assignments)
const ROLE_ROUTES = {
  GENERAL_MANAGER: '/dashboard',
  PROJECT_MANAGER: '/pm/projects',
  SITE_MANAGER:    '/mobile',   // handled by React Native — fallback page
  PURCHASER:       '/mobile',   // handled by React Native — fallback page
  SYS_ADMIN:       '/admin',
}

// Role → display label
const ROLE_LABELS = {
  GENERAL_MANAGER: 'General Manager',
  PROJECT_MANAGER: 'Project Manager',
  SITE_MANAGER:    'Site Manager',
  PURCHASER:       'Purchaser',
  SYS_ADMIN:       'System Administrator',
}

export default function Login() {
  const navigate = useNavigate()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 1. Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error(authError.message)

      // 2. Get role from backend
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const dbUser = res.data

      // 3. Check account status
      if (dbUser.status === 'INACTIVE') {
        throw new Error('Your account has been deactivated. Contact your System Administrator.')
      }

      // 4. Store user info for layout
      const userInfo = {
        id:       dbUser.id,
        name:     dbUser.name,
        role:     dbUser.role,
        initials: dbUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        redirect: ROLE_ROUTES[dbUser.role] || '/dashboard',
        label:    ROLE_LABELS[dbUser.role] || dbUser.role,
      }
      localStorage.setItem('bxb_user', JSON.stringify(userInfo))
      localStorage.setItem('userId',   dbUser.id)
      localStorage.setItem('role',     dbUser.role)

      navigate(userInfo.redirect)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
          backgroundSize:  '24px 24px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">🧱</span>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', color: '#F0EDE8' }}
            >
              BRICK x BRICK
            </h1>
          </div>
          <p style={{ color: '#9A9590' }}>Built for builders.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#F0EDE8' }}>
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#F0EDE8' }}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#9A9590' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 border"
                style={{ color: '#E84B4B', backgroundColor: 'rgba(232,75,75,0.1)', borderColor: 'rgba(232,75,75,0.2)' }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              size="lg"
            >
              SIGN IN
            </Button>

            {/* Blockchain badge */}
            <div className="flex justify-center">
              <div
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border"
                style={{ color: '#9A9590', backgroundColor: '#1A1A1A', borderColor: '#2E2E2E' }}
              >
                <ShieldCheck size={14} style={{ color: '#6C63FF' }} />
                <span>Secured by Blockchain Audit</span>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}