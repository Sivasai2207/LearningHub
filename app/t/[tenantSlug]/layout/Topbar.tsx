'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function Topbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
      <div className="font-medium">Admin Dashboard</div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4"/>
            Sign Out
        </Button>
      </div>
    </header>
  )
}
