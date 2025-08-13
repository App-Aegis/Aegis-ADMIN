'use client'
import { Download, Edit2, Plus, RefreshCw, Search as SearchIcon, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { API_BASE_URL } from '../../lib/api'
import type { Feedback } from '../../models/feedback'
import type { Parent } from '../../models/parent'

export default function FeedbackTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalResults, setTotalResults] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ parentId: '', rating: '', comment: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateForm, setUpdateForm] = useState({ id: '', parentId: '', rating: '', comment: '' })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [parentDetails, setParentDetails] = useState<Record<string, Parent>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingRating, setPendingRating] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // fetchParent moved outside fetchFeedbacks to avoid dependency cycle
  const fetchParent = useCallback(async (parentId: string): Promise<Parent | null> => {
    if (!parentId) return null
    // Use functional update to always get latest state
    let parent: Parent | undefined
    setParentDetails((prev) => {
      parent = prev[parentId]
      return prev
    })
    if (parent) return parent
    try {
      const res = await fetch(`${API_BASE_URL}/parents/${parentId}`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      setParentDetails((prev) => ({ ...prev, [parentId]: data }))
      return data
    } catch {
      return null
    }
  }, [])
  const fetchFeedbacks = useCallback(
    async ({ search = '', rating = '', page = 1, pageSize = 10 }: { search?: string; rating?: string; page?: number; pageSize?: number }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (rating) params.append('rating', rating)
        params.append('page', String(page))
        params.append('pageSize', String(pageSize))
        const res = await fetch(`${API_BASE_URL}/feedbacks?${params.toString()}`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
          },
        })
        if (!res.ok) throw new Error('Failed to fetch feedbacks')
        const data = await res.json()
        if (Array.isArray(data.items) && typeof data.totalResults === 'number') {
          setFeedbacks(data.items)
          setTotalResults(data.totalResults)
        } else {
          setFeedbacks(Array.isArray(data) ? data : [])
          setTotalResults(0)
        }
        // Fetch parent details in parallel
        const uniqueParentIds: string[] = Array.from(new Set((Array.isArray(data.items) ? data.items : data).map((fb: Feedback) => String(fb.parentId))))
        await Promise.all(uniqueParentIds.map((pid) => fetchParent(pid)))
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [fetchParent]
  )

  useEffect(() => {
    fetchFeedbacks({ search, rating, page, pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rating, page, pageSize])

  // Keep pendingSearch/pendingRating in sync with search/rating when search/rating changes (e.g. after submit)
  useEffect(() => {
    setPendingSearch(search)
    setPendingRating(rating)
  }, [search, rating])

  if (loading) return <div className="p-8">Loading feedback...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/export`, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to export CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'feedbacks.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to export feedbacks')
    }
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setAddOpen(true)} title="Add Feedback" className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fetchFeedbacks({ search, rating })} disabled={loading} title="Refresh" className="bg-blue-500 hover:bg-blue-600 text-white">
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export CSV" className="bg-gray-500 hover:bg-gray-600 text-white">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <form
        className="flex gap-4 mb-6"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(pendingSearch)
          setRating(pendingRating)
          setPage(1)
        }}
      >
        <input className="border px-2 py-1 rounded" type="text" placeholder="Search feedback..." value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)} />
        <select className="border px-2 py-1 rounded" value={pendingRating} onChange={(e) => setPendingRating(e.target.value)}>
          <option value="">All Ratings</option>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
        <Button type="submit" size="icon" variant="ghost" className="bg-gray-700 hover:bg-gray-800 text-white" disabled={loading} title="Search">
          <SearchIcon className="w-5 h-5" />
        </Button>
      </form>
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th
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
              </th>
              <th
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
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer text-center"
                onClick={() => {
                  if (sortBy === 'rating') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('rating')
                    setSortOrder('asc')
                  }
                }}
              >
                Rating {sortBy === 'rating' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (sortBy === 'comment') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('comment')
                    setSortOrder('asc')
                  }
                }}
              >
                Comment {sortBy === 'comment' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (sortBy === 'timestamp') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('timestamp')
                    setSortOrder('asc')
                  }
                }}
              >
                Timestamp {sortBy === 'timestamp' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...feedbacks]
              .sort((a, b) => {
                if (!sortBy) return 0
                let valA, valB
                switch (sortBy) {
                  case 'name': {
                    const pa = parentDetails[a.parentId]
                    const pb = parentDetails[b.parentId]
                    valA = pa ? `${pa.firstName} ${pa.lastName}`.toLowerCase() : ''
                    valB = pb ? `${pb.firstName} ${pb.lastName}`.toLowerCase() : ''
                    break
                  }
                  case 'email': {
                    const pa = parentDetails[a.parentId]
                    const pb = parentDetails[b.parentId]
                    valA = pa ? pa.email.toLowerCase() : ''
                    valB = pb ? pb.email.toLowerCase() : ''
                    break
                  }
                  case 'rating':
                    valA = a.rating
                    valB = b.rating
                    break
                  case 'comment':
                    valA = a.comment.toLowerCase()
                    valB = b.comment.toLowerCase()
                    break
                  case 'timestamp':
                    valA = new Date(a.timestamp).getTime()
                    valB = new Date(b.timestamp).getTime()
                    break
                  default:
                    return 0
                }
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1
                return 0
              })
              .map((fb) => {
                const parent = parentDetails[fb.parentId]
                return (
                  <tr key={fb.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{parent ? `${parent.firstName} ${parent.lastName}` : <span className="text-gray-400 italic">Loading...</span>}</td>
                    <td className="border border-gray-200 px-4 py-2">{parent ? parent.email : <span className="text-gray-400 italic">Loading...</span>}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{fb.rating}</td>
                    <td className="border border-gray-200 px-4 py-2">{fb.comment}</td>
                    <td className="border border-gray-200 px-4 py-2 whitespace-nowrap">
                      {typeof window !== 'undefined' ? new Date(fb.timestamp).toLocaleString() : new Date(fb.timestamp).toISOString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUpdateForm({
                              id: fb.id,
                              parentId: fb.parentId,
                              rating: String(fb.rating),
                              comment: fb.comment,
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
                          disabled={deleteLoadingId === fb.id}
                          onClick={() => setConfirmDeleteId(fb.id)}
                          title="Delete"
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this feedback?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!!deleteLoadingId}
              onClick={async () => {
                if (!confirmDeleteId) return
                setDeleteLoadingId(confirmDeleteId)
                setDeleteError(null)
                try {
                  const res = await fetch(`${API_BASE_URL}/feedbacks/${confirmDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                      accept: '*/*',
                      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                    },
                  })
                  if (res.ok) {
                    fetchFeedbacks({ search, rating })
                    setConfirmDeleteId(null)
                  } else {
                    const err = await res.text()
                    setDeleteError(err || 'Failed to delete feedback')
                  }
                } catch {
                  setDeleteError('Failed to delete feedback')
                }
                setDeleteLoadingId(null)
              }}
              title="Delete"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Feedback</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setUpdateLoading(true)
              setUpdateError('')
              try {
                const res = await fetch(`${API_BASE_URL}/feedbacks/${updateForm.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    accept: 'text/plain',
                    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                  },
                  body: JSON.stringify({
                    parentId: updateForm.parentId,
                    rating: Number(updateForm.rating),
                    comment: updateForm.comment,
                  }),
                })
                if (res.ok) {
                  setUpdateOpen(false)
                  setUpdateForm({ id: '', parentId: '', rating: '', comment: '' })
                  fetchFeedbacks({ search, rating })
                } else {
                  const err = await res.text()
                  setUpdateError(err || 'Failed to update feedback')
                }
              } catch {
                setUpdateError('Failed to update feedback')
              }
              setUpdateLoading(false)
            }}
            className="space-y-4"
          >
            <Input placeholder="Parent ID" value={updateForm.parentId} onChange={(e) => setUpdateForm((f) => ({ ...f, parentId: e.target.value }))} required />
            <Input type="number" placeholder="Rating" value={updateForm.rating} onChange={(e) => setUpdateForm((f) => ({ ...f, rating: e.target.value }))} required min={1} max={5} />
            <Textarea placeholder="Comment" value={updateForm.comment} onChange={(e) => setUpdateForm((f) => ({ ...f, comment: e.target.value }))} required />
            {updateError && <div className="text-red-500 text-sm">{updateError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? 'Updating...' : 'Update Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setAddLoading(true)
              setAddError('')
              try {
                const res = await fetch(`${API_BASE_URL}/feedbacks`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
                  },
                  body: JSON.stringify({
                    parentId: addForm.parentId,
                    rating: Number(addForm.rating),
                    comment: addForm.comment,
                  }),
                })
                if (res.ok) {
                  setAddOpen(false)
                  setAddForm({ parentId: '', rating: '', comment: '' })
                  fetchFeedbacks({ search, rating })
                } else {
                  const err = await res.text()
                  setAddError(err || 'Failed to add feedback')
                }
              } catch {
                setAddError('Failed to add feedback')
              }
              setAddLoading(false)
            }}
            className="space-y-4"
          >
            <Input placeholder="Parent ID" value={addForm.parentId} onChange={(e) => setAddForm((f) => ({ ...f, parentId: e.target.value }))} required />
            <Input type="number" placeholder="Rating" value={addForm.rating} onChange={(e) => setAddForm((f) => ({ ...f, rating: e.target.value }))} required min={1} max={5} />
            <Textarea placeholder="Comment" value={addForm.comment} onChange={(e) => setAddForm((f) => ({ ...f, comment: e.target.value }))} required />
            {addError && <div className="text-red-500 text-sm">{addError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
