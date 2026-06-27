import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, BarChart3, ShoppingCart, FileText, Calendar, Menu, X, Plus, UtensilsCrossed } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

import { useState } from 'react'

interface LayoutProps {
  user: User
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/kasir', label: 'Buat Pesanan', icon: Plus },
    { path: '/orders', label: 'Pesanan', icon: ShoppingCart },
    { path: '/menus', label: 'Menu', icon: UtensilsCrossed },
    { path: '/daily-history', label: 'Riwayat Harian', icon: Calendar },
    { path: '/reports', label: 'Laporan', icon: FileText },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navbar - Same as Laravel */}
      <nav className="bg-primary-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="font-bold text-lg tracking-tight">Kopay</span>
              <span className="text-amber-300 text-xs font-medium">owner</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Desktop Logout */}
            <div className="hidden md:flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-primary-200 hover:text-white transition flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary-800"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-primary-200 hover:text-white hover:bg-primary-700/50 transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-2 border-t border-primary-700 pt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-primary-200 hover:text-white hover:bg-primary-800 transition flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
