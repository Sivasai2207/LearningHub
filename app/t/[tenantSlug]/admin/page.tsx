import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Layers, Users } from 'lucide-react'
import { getTenantContext } from '@/lib/tenant/context'
import { notFound } from 'next/navigation'

export default async function AdminDashboard({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  if (!tenant) notFound()

  const supabase = await createClient()

  // Parallel fetch using Promise.all
  const [courses, modules, members] = await Promise.all([
     supabase.from('courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
     supabase.from('modules').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
     supabase.from('tenant_memberships').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('role', 'employee'),
  ])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active training courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Modules
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Learning modules across courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.count || 0}</div>
             <p className="text-xs text-muted-foreground">
              Registered employees
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
