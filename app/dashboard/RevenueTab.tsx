/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Download, RefreshCw, Search as SearchIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { API_BASE_URL } from '../../lib/api'
import type { Payment } from '../../models/payment'

export default function RevenueTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalResults, setTotalResults] = useState(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [planId, setPlanId] = useState('')
  const [planOptions, setPlanOptions] = useState<{ id: string; name: string }[]>([])
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState('')

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Succeeded', label: 'Succeeded' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ]

  // Fetch available plans for filter dropdown
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/plans?page=1&pageSize=100`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.items)) {
        setPlanOptions(data.items.map((p: any) => ({ id: p.id, name: p.name })))
      } else if (Array.isArray(data)) {
        setPlanOptions(data.map((p: any) => ({ id: p.id, name: p.name })))
      }
    } catch {}
  }, [])

  const fetchPayments = useCallback(
    async ({ search = '', planId = '', status = '', page = 1, pageSize = 10 }: { search?: string; planId?: string; status?: string; page?: number; pageSize?: number }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (planId) params.append('planId', planId)
        if (status) params.append('status', status)
        params.append('page', String(page))
        params.append('pageSize', String(pageSize))
        const res = await fetch(`${API_BASE_URL}/payments?${params.toString()}`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
          },
        })
        if (!res.ok) throw new Error('Failed to fetch payments')
        const data = await res.json()
        if (Array.isArray(data.items) && typeof data.totalResults === 'number') {
          setPayments(data.items)
          setTotalResults(data.totalResults)
        } else {
          setPayments(Array.isArray(data) ? data : [])
          setTotalResults(0)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    fetchPayments({ search, planId, status, page, pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, planId, status, page, pageSize])
  useEffect(() => {
    setPendingSearch(search)
  }, [search])
  if (loading) return <div className="p-8">Loading revenue...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/export`, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to export CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'payments.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e + 'Failed to export payments')
    }
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setLoading(true)
              fetchPayments({ search, planId, status, page, pageSize })
            }}
            disabled={loading}
            title="Refresh"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
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
          setPage(1)
        }}
      >
        <input className="border px-2 py-1 rounded" type="text" placeholder="Search payments..." value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)} />
        <select
          className="border px-2 py-1 rounded"
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All Plans</option>
          {planOptions.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <select
          className="border px-2 py-1 rounded"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
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
                className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
                onClick={() => {
                  if (sortBy === 'parent') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('parent')
                    setSortOrder('asc')
                  }
                }}
              >
                User {sortBy === 'parent' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
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
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
                onClick={() => {
                  if (sortBy === 'amount') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('amount')
                    setSortOrder('asc')
                  }
                }}
              >
                Amount {sortBy === 'amount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
                onClick={() => {
                  if (sortBy === 'status') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('status')
                    setSortOrder('asc')
                  }
                }}
              >
                Status {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
                onClick={() => {
                  if (sortBy === 'plan') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('plan')
                    setSortOrder('asc')
                  }
                }}
              >
                Plan {sortBy === 'plan' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 cursor-pointer font-bold"
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
            </tr>
          </thead>
          <tbody>
            {[...payments]
              .sort((a, b) => {
                if (!sortBy) return 0
                let valA, valB
                switch (sortBy) {
                  case 'parent':
                    valA = a.parentFullName?.toLowerCase() || ''
                    valB = b.parentFullName?.toLowerCase() || ''
                    break
                  case 'email':
                    valA = a.parentEmail?.toLowerCase() || ''
                    valB = b.parentEmail?.toLowerCase() || ''
                    break
                  case 'amount':
                    valA = a.amount
                    valB = b.amount
                    break
                  case 'timestamp':
                    valA = new Date(a.timestamp).getTime()
                    valB = new Date(b.timestamp).getTime()
                    break
                  case 'status':
                    valA = a.status?.toLowerCase() || ''
                    valB = b.status?.toLowerCase() || ''
                    break
                  case 'plan':
                    valA = a.planName?.toLowerCase() || ''
                    valB = b.planName?.toLowerCase() || ''
                    break
                  default:
                    return 0
                }
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1
                return 0
              })
              .map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">{p.parentFullName}</td>
                  <td className="border border-gray-200 px-4 py-2">{p.parentEmail}</td>
                  <td className="border border-gray-200 px-4 py-2">{(p.amount / 100).toLocaleString(undefined, { style: 'currency', currency: p.currency || 'USD' })}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {p.status === 'Succeeded' ? (
                      <span className="inline-flex items-center rounded-md bg-green-500 text-white px-2 py-0.5 text-xs font-medium">Succeeded</span>
                    ) : p.status === 'Pending' || p.status === 'Processing' ? (
                      <span className="inline-flex items-center rounded-md bg-yellow-400 text-black px-2 py-0.5 text-xs font-medium">{p.status}</span>
                    ) : p.status === 'Failed' ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : p.status === 'Cancelled' ? (
                      <span className="inline-flex items-center rounded-md bg-gray-200 text-black px-2 py-0.5 text-xs font-medium">Cancelled</span>
                    ) : (
                      <Badge variant="outline">{p.status}</Badge>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{p.planName}</td>
                  <td className="border border-gray-200 px-4 py-2 whitespace-nowrap">{new Date(p.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
