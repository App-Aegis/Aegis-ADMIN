'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { API_BASE_URL } from '@/lib/api'
import { useEffect, useState } from 'react'

interface TableInfo {
  name: string
  endpoint: string
}

export default function DatabaseTab() {
  const tables: TableInfo[] = [
    { name: 'Admins', endpoint: '/admins' },
    { name: 'App Usages', endpoint: '/app-usages' },
    { name: 'Children', endpoint: '/children' },
    { name: 'Devices', endpoint: '/devices' },
    { name: 'Feedbacks', endpoint: '/feedbacks' },
    { name: 'Location Histories', endpoint: '/location-histories' },
    { name: 'Logs', endpoint: '/logs' },
    { name: 'Parents', endpoint: '/parents' },
    { name: 'Payments', endpoint: '/payments' },
    { name: 'Plans', endpoint: '/plans' },
    { name: 'Policies', endpoint: '/policies' },
    { name: 'Subscriptions', endpoint: '/subscriptions' },
    { name: 'Web Histories', endpoint: '/web-histories' },
  ]
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedTable) return
    setLoading(true)
    setError(null)
    fetch(`${API_BASE_URL}${selectedTable.endpoint}`)
      .then((res) => res.json())
      .then((data) => {
        // Some endpoints return { items: [...] }, some return arrays directly
        if (Array.isArray(data)) {
          setRows(data)
        } else if (Array.isArray(data.items)) {
          setRows(data.items)
        } else {
          setRows([])
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load table data')
        setLoading(false)
      })
  }, [selectedTable])

  return (
    <div className="flex h-full w-full overflow-hidden">
      <aside className="w-64 border-r bg-gray-50 p-4 flex flex-col h-screen z-10 sticky left-0 top-0" style={{ minWidth: 256, maxHeight: '100vh' }}>
        <h2 className="font-bold mb-4 text-lg">Tables</h2>
        <div className="flex-1 overflow-y-auto">
          {tables.map((t) => (
            <Button key={t.name} variant={selectedTable?.name === t.name ? 'default' : 'ghost'} className="w-full justify-start mb-1" onClick={() => setSelectedTable(t)}>
              {t.name}
            </Button>
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto min-w-0">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {!selectedTable && <div className="text-gray-500">Select a table to view data.</div>}
        {selectedTable && (
          <Card className="p-4">
            <h3 className="font-semibold text-xl mb-2">{selectedTable.name}</h3>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {rows[0] &&
                        Object.keys(rows[0]).map((col) => (
                          <th key={col} className="border px-3 py-2 text-left font-bold">
                            {col}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={1} className="text-center py-4 text-gray-400">
                          No data
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.keys(row).map((col) => (
                            <td key={col} className="border px-3 py-2 whitespace-nowrap">
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
