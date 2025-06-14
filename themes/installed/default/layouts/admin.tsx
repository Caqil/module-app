import React from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen">
          {/* Admin Sidebar would go here */}
          <aside className="w-64 bg-card border-r">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
          </aside>
          
          {/* Main Admin Content */}
          <div className="flex-1 flex flex-col">
            <header className="border-b bg-card px-6 py-4">
              <h1 className="text-xl font-semibold">Administration</h1>
            </header>
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
