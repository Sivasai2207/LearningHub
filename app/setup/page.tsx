'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createFirstTenant } from './actions'
import { ROUTES } from '@/lib/config/routes'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    
    const result = await createFirstTenant(formData)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else if (result?.tenantSlug) {
      toast.success('Company created successfully!')
      router.push(ROUTES.tenant(result.tenantSlug).admin.dashboard)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome! Let's Set Up Your Company</CardTitle>
          <CardDescription>Create your company workspace to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                placeholder="Acme Corporation" 
                required 
              />
              <p className="text-xs text-gray-500">This will be displayed throughout the platform</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySlug">Company URL Slug</Label>
              <Input 
                id="companySlug" 
                name="companySlug" 
                placeholder="acme-corp" 
                pattern="[a-z0-9-]+"
                required 
              />
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only. This will be used in your URL: /t/your-slug/admin
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
