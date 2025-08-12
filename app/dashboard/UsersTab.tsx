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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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
                          // TODO: open update user modal
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
