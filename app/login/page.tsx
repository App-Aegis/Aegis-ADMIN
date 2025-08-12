'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { API_BASE_URL } from '../../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        // Decode JWT to check for Admin role
        function parseJwt(token: string) {
          try {
            return JSON.parse(atob(token.split('.')[1]))
          } catch {
            return null
          }
        }
        const payload = parseJwt(data.token)
        // Accept roles as array, string, or namespaced claim
        const roles = payload?.roles || payload?.role || payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || []
        const hasAdmin = Array.isArray(roles) ? roles.includes('Admin') : typeof roles === 'string' ? roles === 'Admin' : false
        if (hasAdmin) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('email', email)
          document.cookie = `token=${data.token}; path=/; SameSite=Lax`
          console.log('Login successful, redirecting to dashboard...')
          router.push('/dashboard')
        } else {
          setError('You do not have admin access.')
        }
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('Login failed')
      console.error('Login error:', err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="p-8 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
