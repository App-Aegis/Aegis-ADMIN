import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
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

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateForm, setUpdateForm] = useState({ id: '', firstName: '', lastName: '', email: '', password: '', isVerified: false })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')

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
    fetchUsers()
  }, [])

  // Sorting logic
  const sortedUsers = [...users].sort((a, b) => {
    if (!sortBy) return 0
    let valA, valB
    switch (sortBy) {
      case 'name':
        valA = `${a.firstName} ${a.lastName}`.toLowerCase()
        valB = `${b.firstName} ${b.lastName}`.toLowerCase()
        break
      case 'email':
        valA = a.email.toLowerCase()
        valB = b.email.toLowerCase()
        break
      case 'isVerified':
        valA = a.isVerified ? 1 : 0
        valB = b.isVerified ? 1 : 0
        break
      case 'createdAt':
        valA = new Date(a.createdAt).getTime()
        valB = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  return (
    <Card className="p-8 w-full max-w-4xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-center">Users</h1>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
            Add
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                document.cookie = 'token=; Max-Age=0; path=/'
                window.location.href = '/login'
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div style={{ minHeight: 400 }}>
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead
                  className="border border-gray-300 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('name')
                      setSortOrder('asc')
                    }
                  }}
                >
                  Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
                <TableHead
                  className="border border-gray-300 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    if (sortBy === 'email') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('email')
                      setSortOrder('asc')
                    }
                  }}
                >
                  Email {sortBy === 'email' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
                <TableHead
                  className="border border-gray-300 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    if (sortBy === 'isVerified') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('isVerified')
                      setSortOrder('asc')
                    }
                  }}
                >
                  Verified {sortBy === 'isVerified' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
                <TableHead
                  className="border border-gray-300 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    if (sortBy === 'createdAt') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('createdAt')
                      setSortOrder('asc')
                    }
                  }}
                >
                  Created At {sortBy === 'createdAt' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
                <TableHead className="border border-gray-300 px-4 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user: User) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="border border-gray-200 px-4 py-2">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="border border-gray-200 px-4 py-2">{user.email}</TableCell>
                  <TableCell className="border border-gray-200 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={user.isVerified}
                      onChange={async (e) => {
                        const newVerified = e.target.checked
                        try {
                          const res = await fetch(`${API_BASE_URL}/parents/${user.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              accept: 'text/plain',
                              Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                            },
                            body: JSON.stringify({ isVerified: newVerified }),
                          })
                          if (res.ok) {
                            fetchUsers()
                          } else {
                          }
                        } catch {}
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-200 px-4 py-2">{new Date(user.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-200 px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUpdateForm({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            password: '',
                            isVerified: user.isVerified,
                          })
                          setUpdateError('')
                          setUpdateOpen(true)
                        }}
                      >
                        Update
                      </Button>
                      <Button variant="destructive" size="sm" disabled={deleteLoadingId === user.id} onClick={() => setConfirmDeleteId(user.id)}>
                        {deleteLoadingId === user.id ? 'Deleting...' : 'Delete'}
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
      {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this user?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!!deleteLoadingId}
              onClick={async () => {
                if (!confirmDeleteId) return
                setDeleteLoadingId(confirmDeleteId)
                setDeleteError(null)
                try {
                  const res = await fetch(`${API_BASE_URL}/parents/${confirmDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                      accept: '*/*',
                      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                    },
                  })
                  if (res.ok) {
                    fetchUsers()
                    setConfirmDeleteId(null)
                  } else {
                    const err = await res.text()
                    setDeleteError(err || 'Failed to delete user')
                  }
                } catch {
                  setDeleteError('Failed to delete user')
                }
                setDeleteLoadingId(null)
              }}
            >
              {deleteLoadingId ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setUpdateLoading(true)
              setUpdateError('')
              try {
                const res = await fetch(`${API_BASE_URL}/parents/${updateForm.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    accept: 'text/plain',
                    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                  },
                  body: JSON.stringify({
                    firstName: updateForm.firstName,
                    lastName: updateForm.lastName,
                    email: updateForm.email,
                    password: updateForm.password,
                    isVerified: updateForm.isVerified,
                  }),
                })
                if (res.ok) {
                  setUpdateOpen(false)
                  setUpdateForm({ id: '', firstName: '', lastName: '', email: '', password: '', isVerified: false })
                  fetchUsers()
                } else {
                  const err = await res.text()
                  setUpdateError(err || 'Failed to update user')
                }
              } catch {
                setUpdateError('Failed to update user')
              }
              setUpdateLoading(false)
            }}
            className="space-y-4"
          >
            <Input placeholder="First Name" value={updateForm.firstName} onChange={(e) => setUpdateForm((f) => ({ ...f, firstName: e.target.value }))} required />
            <Input placeholder="Last Name" value={updateForm.lastName} onChange={(e) => setUpdateForm((f) => ({ ...f, lastName: e.target.value }))} required />
            <Input type="email" placeholder="Email" value={updateForm.email} onChange={(e) => setUpdateForm((f) => ({ ...f, email: e.target.value }))} required />
            <Input type="password" placeholder="Password (leave blank to keep current)" value={updateForm.password} onChange={(e) => setUpdateForm((f) => ({ ...f, password: e.target.value }))} />
            <div className="flex items-center gap-2">
              <label htmlFor="isVerified">Verified:</label>
              <input id="isVerified" type="checkbox" checked={updateForm.isVerified} onChange={(e) => setUpdateForm((f) => ({ ...f, isVerified: e.target.checked }))} />
            </div>
            {updateError && <div className="text-red-500 text-sm">{updateError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setAddLoading(true)
              setAddError('')
              try {
                const res = await fetch(`${API_BASE_URL}/parents`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                  },
                  body: JSON.stringify(addForm),
                })
                if (res.ok) {
                  setAddOpen(false)
                  setAddForm({ firstName: '', lastName: '', email: '', password: '' })
                  fetchUsers()
                } else {
                  const err = await res.text()
                  setAddError(err || 'Failed to add user')
                }
              } catch {
                setAddError('Failed to add user')
              }
              setAddLoading(false)
            }}
            className="space-y-4"
          >
            <Input placeholder="First Name" value={addForm.firstName} onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))} required />
            <Input placeholder="Last Name" value={addForm.lastName} onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))} required />
            <Input type="email" placeholder="Email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} required />
            <Input type="password" placeholder="Password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} required />
            {addError && <div className="text-red-500 text-sm">{addError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
