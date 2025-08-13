import { Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { API_BASE_URL } from '../../lib/api'
import type { Parent } from '../../models/parent'

export default function UsersTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalResults, setTotalResults] = useState(0)
  const [users, setUsers] = useState<Parent[]>([])
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

  function fetchUsers({ page: fetchPage = page, pageSize: fetchPageSize = pageSize } = {}) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    params.append('page', String(fetchPage))
    params.append('pageSize', String(fetchPageSize))
    fetch(`${API_BASE_URL}/parents?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setUsers(data.items)
          setTotalResults(typeof data.totalResults === 'number' ? data.totalResults : 0)
        } else if (Array.isArray(data)) {
          setUsers(data)
          setTotalResults(0)
        } else {
          setUsers([])
          setTotalResults(0)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to fetch users')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsers({ page, pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

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
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setAddOpen(true)} title="Add User" className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fetchUsers({ page, pageSize })} disabled={loading} title="Refresh" className="bg-blue-500 hover:bg-blue-600 text-white">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {/* Pagination controls (top) */}
      <div className="flex items-center gap-4 mb-4 justify-center">
        <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
          &lt; Previous
        </Button>
        {/* Pagination numbers: always show first and last page, with ellipses if needed */}
        {(() => {
          const pages = []
          const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
          const start = Math.max(2, page - 2)
          const end = Math.min(totalPages - 1, page + 2)
          // Always show first page
          pages.push(
            <Button key={1} size="sm" variant={page === 1 ? 'outline' : 'ghost'} className={page === 1 ? 'border' : ''} onClick={() => setPage(1)} style={{ minWidth: 32 }} disabled={page === 1}>
              1
            </Button>
          )
          if (start > 2) {
            pages.push(
              <span key="start-ellipsis" className="px-2">
                ...
              </span>
            )
          }
          for (let i = start; i <= end; i++) {
            if (i > 1 && i < totalPages) {
              pages.push(
                <Button key={i} size="sm" variant={i === page ? 'outline' : 'ghost'} className={i === page ? 'border' : ''} onClick={() => setPage(i)} style={{ minWidth: 32 }} disabled={i === page}>
                  {i}
                </Button>
              )
            }
          }
          if (end < totalPages - 1) {
            pages.push(
              <span key="end-ellipsis" className="px-2">
                ...
              </span>
            )
          }
          if (totalPages > 1) {
            pages.push(
              <Button
                key={totalPages}
                size="sm"
                variant={page === totalPages ? 'outline' : 'ghost'}
                className={page === totalPages ? 'border' : ''}
                onClick={() => setPage(totalPages)}
                style={{ minWidth: 32 }}
                disabled={page === totalPages}
              >
                {totalPages}
              </Button>
            )
          }
          return pages
        })()}
        <Button size="sm" variant="ghost" disabled={page * pageSize >= totalResults} onClick={() => setPage(page + 1)}>
          Next &gt;
        </Button>
        <select
          className="border px-2 py-1 rounded"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setPage(1)
          }}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
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
                  className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
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
                  className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
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
                  className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
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
                  className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
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
                <TableHead className="border border-gray-300 px-4 py-2 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user: Parent) => (
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
                            fetchUsers({ page, pageSize })
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
                        variant="ghost"
                        size="icon"
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
                        title="Update"
                        className="bg-yellow-400 hover:bg-yellow-500 text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteLoadingId === user.id}
                        onClick={() => setConfirmDeleteId(user.id)}
                        title="Delete"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    fetchUsers({ page, pageSize })
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
    </div>
  )
}
