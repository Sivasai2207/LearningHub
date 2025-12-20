import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/context'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CohortsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params
    const tenant = await getTenantContext(tenantSlug)
    const supabase = await createClient()
    
    const { data: cohorts } = await supabase
        .from('cohorts')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight">Cohorts</h1>
                     <p className="text-gray-500">Manage employee groups and mass assignments.</p>
                </div>
                <Button asChild>
                    <Link href={`/t/${tenantSlug}/admin/cohorts/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Cohort
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cohorts?.map(cohort => (
                    <Link 
                        key={cohort.id} 
                        href={`/t/${tenantSlug}/admin/cohorts/${cohort.id}`}
                        className="p-6 bg-white rounded-lg border hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-lg">{cohort.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{cohort.description || 'No description'}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
