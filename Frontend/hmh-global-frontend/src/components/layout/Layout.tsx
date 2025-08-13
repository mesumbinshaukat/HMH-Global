import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32"> {/* Add top padding to account for fixed header */}
        {children}
      </main>
      <Footer />

      {/* Subscription Modal */}
      <Dialog defaultOpen>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to our newsletter</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input type="email" placeholder="Enter your email" />
            <Button className="bg-pink-500 hover:bg-pink-600 text-white">Subscribe</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Layout
