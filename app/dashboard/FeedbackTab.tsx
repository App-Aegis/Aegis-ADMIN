'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { API_BASE_URL } from '../../lib/api'
import type { Feedback } from '../../models/feedback'
import type { Parent } from '../../models/parent'

export default function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [parentDetails, setParentDetails] = useState<Record<string, Parent>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // fetchParent moved outside fetchFeedbacks to avoid dependency cycle
  const fetchParent = async (parentId: string): Promise<Parent | null> => {
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
  }

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks`, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch feedbacks')
      const feedbackList: Feedback[] = await res.json()
      setFeedbacks(feedbackList)
      // Fetch parent details in parallel
      const uniqueParentIds = Array.from(new Set(feedbackList.map((fb) => fb.parentId)))
      await Promise.all(uniqueParentIds.map((pid) => fetchParent(pid)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="p-8">Loading feedback...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <Button variant="outline" size="sm" onClick={fetchFeedbacks} disabled={loading}>
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Email</th>
              <th className="border border-gray-300 px-4 py-2">Rating</th>
              <th className="border border-gray-300 px-4 py-2">Comment</th>
              <th className="border border-gray-300 px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb) => {
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
