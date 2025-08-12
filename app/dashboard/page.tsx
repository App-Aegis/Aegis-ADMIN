'use client'

import { BarChart, Users } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/ui/card'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarSeparator } from '../../components/ui/sidebar'
import UsersTab from './UsersTab'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'revenue'>('users')
  const email = 'admin@example.com'

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
            <UsersTab />
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
