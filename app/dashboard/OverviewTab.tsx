import { Activity, MessageCircle, RefreshCw, Users as UsersIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Button } from '../../components/ui/button'
import { ChartContainer } from '../../components/ui/chart'
import { API_BASE_URL } from '../../lib/api'
import type { Feedback } from '../../models/feedback'
import type { Log } from '../../models/log'
import type { Parent } from '../../models/parent'

export default function OverviewTab() {
  const [users, setUsers] = useState<Parent[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'this_month' | 'this_quarter' | 'this_year' | 'last_month' | 'last_quarter' | 'last_year'>('this_month')
  const [refreshing, setRefreshing] = useState(false)

  function getDateRangeBounds(range: typeof dateRange): { start: Date; end: Date } {
    const now = new Date()
    let start: Date, end: Date
    switch (range) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'this_quarter': {
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
        break
      }
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      case 'last_month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        start = lastMonth
        end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      }
      case 'last_quarter': {
        const quarter = Math.floor(now.getMonth() / 3) - 1
        const year = quarter < 0 ? now.getFullYear() - 1 : now.getFullYear()
        const q = quarter < 0 ? 3 : quarter
        start = new Date(year, q * 3, 1)
        end = new Date(year, q * 3 + 3, 0, 23, 59, 59, 999)
        break
      }
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
    return { start, end }
  }

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, feedbacksRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/parents?page=1&pageSize=1000`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` } }),
        fetch(`${API_BASE_URL}/feedbacks?page=1&pageSize=1000`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` } }),
        fetch(`${API_BASE_URL}/logs?page=1&pageSize=1000&eventType=Login`, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` } }),
      ])
      if (!usersRes.ok || !feedbacksRes.ok || !logsRes.ok) throw new Error('Failed to fetch overview data')
      const usersData = await usersRes.json()
      const feedbacksData = await feedbacksRes.json()
      const logsData = await logsRes.json()
      setUsers(Array.isArray(usersData.items) ? usersData.items : Array.isArray(usersData) ? usersData : [])
      setFeedbacks(Array.isArray(feedbacksData.items) ? feedbacksData.items : Array.isArray(feedbacksData) ? feedbacksData : [])
      setLogs(Array.isArray(logsData.items) ? logsData.items : Array.isArray(logsData) ? logsData : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [dateRange])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  // Filter data by selected date range
  const { start: rangeStart, end: rangeEnd } = getDateRangeBounds(dateRange)
  function inRange(dateStr: string) {
    const d = new Date(dateStr)
    return d >= rangeStart && d <= rangeEnd
  }

  const totalUsers = users.length
  const feedbackByRating = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbacks.filter((fb) => fb.rating === star && inRange(fb.timestamp)).length,
  }))
  const totalFeedbacks = feedbacks.filter((fb) => inRange(fb.timestamp)).length
  // Active users: unique parentId in logs of type Login for selected range
  const activeUserIds = Array.from(new Set(logs.filter((log) => inRange(log.timestamp)).map((log) => log.parentId)))
  const activeUsers = activeUserIds.length

  // Chart data
  const feedbackChartData = feedbackByRating.map((f) => ({ name: `${f.star}★`, value: f.count }))
  // Users growth by month (last 6 months)
  const now = new Date()
  const userGrowthData = (() => {
    const months: { [k: string]: number } = {}
    for (let i = 5; i >= 0; --i) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      months[key] = 0
    }
    users.forEach((u) => {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (months[key] !== undefined && d >= rangeStart && d <= rangeEnd) months[key]++
    })
    return Object.entries(months).map(([k, v]) => ({ month: k, users: v }))
  })()
  // Active users chart (last 6 months)
  const activeChartData = (() => {
    const months: { [k: string]: Set<string> } = {}
    for (let i = 5; i >= 0; --i) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      months[key] = new Set()
    }
    logs.forEach((log) => {
      const d = new Date(log.timestamp)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (months[key] && d >= rangeStart && d <= rangeEnd) months[key].add(log.parentId)
    })
    return Object.entries(months).map(([k, v]) => ({ month: k, users: v.size }))
  })()

  if (loading) return <div className="p-8">Loading overview...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="flex items-center gap-2">
          <select className="border px-2 py-1 rounded text-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)}>
            <option value="last_year">Last Year</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="last_month">Last Month</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || refreshing} title="Refresh" className="bg-blue-500 hover:bg-blue-600 text-white">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationPlayState: loading || refreshing ? 'running' : 'paused' }} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Users Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center transition-all hover:scale-[1.025] hover:shadow-3xl">
          <UsersIcon className="w-7 h-7 text-blue-500 mb-2" />
          <div className="font-bold text-lg mb-2">Total Users</div>
          <div className="text-3xl font-bold mb-2">{totalUsers}</div>
          <div className="text-xs text-gray-500">
            {(() => {
              const signupsInRange = users.filter((u) => inRange(u.createdAt)).length
              return `${signupsInRange} new user${signupsInRange === 1 ? '' : 's'} in range`
            })()}
          </div>
        </div>
        {/* Feedback Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center transition-all hover:scale-[1.025] hover:shadow-3xl">
          <MessageCircle className="w-7 h-7 text-yellow-500 mb-2" />
          <div className="font-bold text-lg mb-2">Total Feedbacks</div>
          <div className="text-3xl font-bold mb-2">{totalFeedbacks}</div>
          <div className="text-xs text-gray-500">
            {(() => {
              const feedbacksInRange = feedbacks.filter((fb) => inRange(fb.timestamp))
              const avg = feedbacksInRange.length ? feedbacksInRange.reduce((sum, fb) => sum + fb.rating, 0) / feedbacksInRange.length : 0
              return `Average rating: ${avg.toFixed(1)}`
            })()}
          </div>
        </div>
        {/* Active Users Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center transition-all hover:scale-[1.025] hover:shadow-3xl">
          <Activity className="w-7 h-7 text-green-500 mb-2" />
          <div className="font-bold text-lg mb-2">Active Users</div>
          <div className="text-3xl font-bold mb-2">{activeUsers}</div>
          <div className="text-xs text-gray-500">Unique logins in selected range</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 transition-all hover:scale-[1.015] hover:shadow-3xl">
          <div className="font-semibold mb-2">Feedback Distribution by Star</div>
          <ChartContainer config={{ value: { color: '#3b82f6', label: 'Feedback Count' } }}>
            <BarChart data={feedbackChartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 transition-all hover:scale-[1.015] hover:shadow-3xl">
          <div className="font-semibold mb-2">User Growth (Last 6 Months)</div>
          <ChartContainer config={{ users: { color: '#10b981', label: 'New Users' } }}>
            <LineChart data={userGrowthData}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Line type="monotone" dataKey="users" stroke="#10b981" />
            </LineChart>
          </ChartContainer>
        </div>
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 md:col-span-2 transition-all hover:scale-[1.015] hover:shadow-3xl">
          <div className="font-semibold mb-2">Monthly Active Users (Last 6 Months)</div>
          <ChartContainer config={{ users: { color: '#f59e42', label: 'Active' } }}>
            <LineChart data={activeChartData}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Line type="monotone" dataKey="users" stroke="#f59e42" />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
