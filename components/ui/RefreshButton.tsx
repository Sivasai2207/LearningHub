'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RefreshButton() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        // Reset after a short delay
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
    )
}
