import { createServiceRoleClient } from '@/lib/supabase/admin'
import { getTenantContext } from '@/lib/tenant/context'
import { notFound } from 'next/navigation'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { CreateEmployeeDialog } from '@/components/employees/CreateEmployeeDialog'
import { RefreshButton } from '@/components/ui/RefreshButton'

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

export default async function EmployeesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params
    const tenant = await getTenantContext(tenantSlug)
    if (!tenant) notFound()

    // Use service role client to bypass RLS for admin data fetching
    const adminClient = createServiceRoleClient()
    const { data: memberships, error } = await adminClient
        .from('tenant_memberships')
        .select('*, profiles(*)')
        .eq('tenant_id', tenant.id)
        .order('joined_at', { ascending: false })

    // Flatten memberships
    const rawEmployees = memberships
        ?.filter((m: any) => m.profiles && m.profiles.id)
        .map((m: any) => ({
            ...(m.profiles as any),
            role: m.role,
            joined_at: m.joined_at,
            active: m.active
        })) || []

    // Fetch auth data for these users to get real last_sign_in and confirmed_at
    const employees = await Promise.all(rawEmployees.map(async (emp: any) => {
        const { data: { user }, error } = await adminClient.auth.admin.getUserById(emp.id)
        return {
            ...emp,
            last_sign_in_at: user?.last_sign_in_at,
            confirmed_at: user?.confirmed_at
        }
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                     <p className="text-gray-500">Manage user access and roles.</p>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshButton />
                    <CreateEmployeeDialog tenantId={tenant.id} tenantSlug={tenant.slug} />
                </div>
            </div>
            
            <EmployeeTable 
                employees={employees as any[]} 
                tenantSlug={tenant.slug} 
                tenantId={tenant.id}
            />
        </div>
    )
}
