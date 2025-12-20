'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ContentOpenButton({ 
    contentItemId, 
    externalUrl, 
    source 
}: { 
    contentItemId: string, 
    externalUrl?: string | null, 
    source: string 
}) {
    const [loading, setLoading] = useState(false)

    const handleOpen = async () => {
        if (source === 'external') {
            if (externalUrl) window.open(externalUrl, '_blank')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/content/signed-url?contentItemId=${contentItemId}`)
            const data = await res.json()
            if (data.url) {
                window.open(data.url, '_blank')
            } else {
                toast.error(data.error || 'Failed to open file')
            }
        } catch (err) {
            toast.error('Connection error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleOpen} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Open'}
            <ExternalLink className="w-3 h-3" />
        </Button>
    )
}
