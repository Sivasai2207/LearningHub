import { getEmployees, getCourses } from '@/lib/data/assignments'
import AssignmentsManager from './AssignmentsManager'
import { getTenantContext } from '@/lib/tenant/context'
import { notFound } from 'next/navigation'

export default async function AssignmentsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params
    const tenant = await getTenantContext(tenantSlug)
    if (!tenant) notFound()

    // Fetch initial data on server
    const [employees, courses] = await Promise.all([
        getEmployees(tenant.id),
        getCourses(tenant.id)
    ])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Assignments</h1>
            <p className="text-gray-500">Assign courses to employees.</p>
            
            <AssignmentsManager 
                employees={employees} 
                courses={courses} 
                tenantId={tenant.id} 
                tenantSlug={tenant.slug} 
            />
        </div>
    )
}
