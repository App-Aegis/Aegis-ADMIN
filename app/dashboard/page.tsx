'use client'

import { BarChart, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarSeparator } from '../../components/ui/sidebar'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { API_BASE_URL } from '../../lib/api'

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  isVerified: boolean
  createdAt: string
}

export default function DashboardPage() {
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : ''
  const [activeTab, setActiveTab] = useState<'users' | 'revenue'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function fetchUsers() {
    setLoading(true)
    setError('')
    fetch(`${API_BASE_URL}/parents`, {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to fetch users')
        setLoading(false)
      })
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
          <SidebarHeader className="mb-2">
            <span className="font-bold text-xl tracking-tight">Aegis Admin</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'users'} tooltip="Users" onClick={() => setActiveTab('users')}>
                <Users className="mr-2" />
                <span>Users</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'revenue'} tooltip="Revenue" onClick={() => setActiveTab('revenue')}>
                <BarChart className="mr-2" />
                <span>Revenue</span>
              </SidebarMenuButton>
            </SidebarMenu>
            <SidebarSeparator />
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex items-center justify-center">
          {activeTab === 'users' ? (
            <Card className="p-8 w-full max-w-4xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-center">Users</h1>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      /* TODO: open add user modal */
                    }}
                  >
                    Add
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                    Refresh
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : (
                <div style={{ minHeight: 400 }}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.isVerified ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  /* TODO: open update user modal */
                                }}
                              >
                                Update
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  /* TODO: handle delete user */
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>List of all users</TableCaption>
                  </Table>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 w-full max-w-md shadow-lg">
              <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>
              <div className="text-lg text-center">
                Welcome, <span className="font-semibold">{email}</span>
              </div>
            </Card>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
