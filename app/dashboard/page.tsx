'use client'

import { BarChart, FileText, LayoutDashboard, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarSeparator } from '../../components/ui/sidebar'
import UsersTab from './UsersTab'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'feedback' | 'logs'>('overview')
  let email = ''
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        email = payload.email || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/email'] || ''
      } catch {}
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
          <SidebarHeader className="mb-2">
            <span className="font-bold text-xl tracking-tight">Aegis+ Admin Dashboard</span>
          </SidebarHeader>
          <SidebarContent className="flex flex-col h-full">
            <SidebarMenu className="flex flex-col gap-1">
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'overview'} tooltip="Overview" onClick={() => setActiveTab('overview')}>
                <LayoutDashboard className="mr-2" />
                <span>Overview</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'users'} tooltip="Users" onClick={() => setActiveTab('users')}>
                <Users className="mr-2" />
                <span>Users</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'revenue'} tooltip="Revenue" onClick={() => setActiveTab('revenue')}>
                <BarChart className="mr-2" />
                <span>Revenue</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'feedback'} tooltip="Feedback" onClick={() => setActiveTab('feedback')}>
                <MessageCircle className="mr-2" />
                <span>Feedback</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'logs'} tooltip="Logs" onClick={() => setActiveTab('logs')}>
                <FileText className="mr-2" />
                <span>Logs</span>
              </SidebarMenuButton>
            </SidebarMenu>
            <SidebarSeparator />
          </SidebarContent>
          {/* User avatar at bottom */}
          <div className="absolute bottom-0 left-0 w-full flex items-center justify-start pl-6 pb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer size-12 shadow-lg">
                  <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">{email ? email[0].toUpperCase() : '?'}</AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-56 flex flex-col items-center">
                <div className="mb-2 text-lg font-semibold">{email}</div>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded w-full"
                  onClick={() => {
                    localStorage.removeItem('token')
                    document.cookie = 'token=; Max-Age=0; path=/'
                    window.location.href = '/login'
                  }}
                >
                  Logout
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </Sidebar>
        <main className="flex-1">
          {activeTab === 'overview' && (
            <div className="p-8 w-full">
              <h1 className="text-2xl font-bold mb-6">Coming soon</h1>
            </div>
          )}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'revenue' && (
            <div className="p-8 w-full">
              <h1 className="text-2xl font-bold mb-6">Coming soon</h1>
            </div>
          )}
          {activeTab === 'feedback' && (
            <div className="p-8 w-full">
              <h1 className="text-2xl font-bold mb-6">Coming soon</h1>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="p-8 w-full">
              <h1 className="text-2xl font-bold mb-6">Coming soon</h1>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
