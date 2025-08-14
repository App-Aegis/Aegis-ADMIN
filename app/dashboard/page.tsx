'use client'
import { BarChart, Database, FileText, LayoutDashboard, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarSeparator, SidebarTrigger, useSidebar } from '../../components/ui/sidebar'
import FeedbackTab from './FeedbackTab'
import LogsTab from './LogsTab'
import OverviewTab from './OverviewTab'
import RevenueTab from './RevenueTab'
import UsersTab from './UsersTab'
import DatabaseTab from './database/page'

// Responsive sidebar header title
function SidebarHeaderTitle() {
  const { state } = useSidebar()
  return (
    <div className={state === 'collapsed' ? 'hidden' : 'flex-1 min-w-0 max-w-full overflow-hidden whitespace-nowrap pr-12'}>
      <SidebarTitle />
    </div>
  )
}

// Sidebar title responsive to sidebar state
function SidebarTitle() {
  const { state } = useSidebar()
  return <span className="font-bold text-xl tracking-tight transition-all duration-200">{state === 'collapsed' ? 'A+' : 'Aegis+ Admin Dashboard'}</span>
}

// Avatar at bottom, responsive to sidebar state
function SidebarUserProfile({ email }: { email: string }) {
  const { state } = useSidebar()
  return (
    <div className={`absolute bottom-0 left-0 w-full flex items-center pb-4 transition-all duration-200 ${state === 'collapsed' ? 'justify-center pl-0' : 'justify-start pl-6'}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Avatar className={`cursor-pointer shadow-lg transition-all duration-200 ${state === 'collapsed' ? 'size-8' : 'size-12'}`}>
            <AvatarFallback className={`font-bold bg-primary text-primary-foreground ${state === 'collapsed' ? 'text-base' : 'text-xl'}`}>{email ? email[0].toUpperCase() : '?'}</AvatarFallback>
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
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'feedback' | 'logs' | 'database'>('overview')
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
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} email={email} />
    </SidebarProvider>
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function DashboardLayout({ activeTab, setActiveTab, email }: { activeTab: 'overview' | 'users' | 'revenue' | 'feedback' | 'logs' | 'database'; setActiveTab: (tab: any) => void; email: string }) {
    const { state } = useSidebar()
    const sidebarWidth = state === 'collapsed' ? 'ml-12' : 'ml-72'
    return (
      <div className="relative min-h-screen bg-background">
        <Sidebar className="fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg w-72 z-20" collapsible="icon">
          <SidebarHeader className={`mb-2 flex items-center min-w-0 ${state === 'collapsed' ? 'flex-col justify-start gap-2 h-20 p-0 w-12' : 'flex-row justify-between'}`}>
            {state !== 'collapsed' && <SidebarHeaderTitle />}
            <SidebarTrigger className={`p-0 w-8 h-8 flex items-center justify-center ${state === 'collapsed' ? 'my-2' : ''}`} />
          </SidebarHeader>
          <SidebarContent className="flex flex-col h-full items-center">
            <SidebarMenu className="flex flex-col gap-1 items-center">
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
              <SidebarMenuButton className="mb-1" variant="default" size="lg" isActive={activeTab === 'database'} tooltip="Database" onClick={() => setActiveTab('database')}>
                <Database className="mr-2" />
                <span>Database (read-only)</span>
              </SidebarMenuButton>
            </SidebarMenu>
            <SidebarSeparator />
          </SidebarContent>
          {/* User avatar at bottom, responsive to sidebar state */}
          <SidebarUserProfile email={email} />
        </Sidebar>
        <main className={`flex-1 transition-all duration-200 ${sidebarWidth}`}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'feedback' && <FeedbackTab />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'database' && <DatabaseTab />}
        </main>
      </div>
    )
  }
}
