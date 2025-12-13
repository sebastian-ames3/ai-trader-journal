'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signin')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Redirect to dashboard on success
      router.push('/')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('Check your email for a confirmation link')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setError(null)
    setMessage(null)
    setMagicLinkLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('Check your email for a magic link')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setMagicLinkLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo Section */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          {/* Brain Icon - matches the TradeMind design */}
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Brain outline */}
            <path
              d="M32 8C22 8 16 14 16 22c0 4 2 7 4 9-2 2-4 5-4 9 0 8 6 14 16 14s16-6 16-14c0-4-2-7-4-9 2-2 4-5 4-9 0-8-6-14-16-14z"
              stroke="hsl(var(--brand-green))"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Brain details - left */}
            <path
              d="M22 18c-2 2-2 6 0 8M22 32c-2 2-2 6 0 8"
              stroke="hsl(var(--brand-green))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Brain details - right */}
            <path
              d="M42 18c2 2 2 6 0 8M42 32c2 2 2 6 0 8"
              stroke="hsl(var(--brand-green))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Center line with chart accent */}
            <path
              d="M32 14v36"
              stroke="hsl(var(--brand-green))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Chart line accent */}
            <path
              d="M26 28l6-6 6 6 6-4"
              stroke="hsl(var(--brand-green))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Trade<span className="text-brand-green">Mind</span>
        </h1>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-border rounded-none h-12">
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-green rounded-none text-muted-foreground data-[state=active]:text-foreground"
            >
              Sign Up
            </TabsTrigger>
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-green rounded-none text-muted-foreground data-[state=active]:text-foreground"
            >
              Sign In
            </TabsTrigger>
          </TabsList>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="mt-6 border-brand-green/50 bg-brand-green/10">
              <AlertDescription className="text-brand-green">{message}</AlertDescription>
            </Alert>
          )}

          {/* Sign In Form */}
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="sr-only">
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Magic Link Option */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={magicLinkLoading}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors disabled:opacity-50"
              >
                {magicLinkLoading ? 'Sending...' : 'Send Magic Link (Passwordless)'}
              </button>
            </div>
          </TabsContent>

          {/* Sign Up Form */}
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="sr-only">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" className="sr-only">
                  Confirm Password
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-12 bg-muted/50 border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
