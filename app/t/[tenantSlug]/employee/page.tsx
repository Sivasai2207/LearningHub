import { getMyAssignedCourses } from '@/lib/data/employee'
import { AssignedCourseGrid } from '@/components/employee/AssignedCourseGrid'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import { getTenantContext } from '@/lib/tenant/context'
import { ROUTES } from '@/lib/config/routes'

export default async function EmployeeDashboard({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params
    const tenant = await getTenantContext(tenantSlug)
    if (!tenant) notFound()

    const courses = await getMyAssignedCourses(tenant.id)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single()

    const handleSignOut = async () => {
        "use server"
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect(ROUTES.login)
    }

    return (
        <div className="min-h-screen bg-gray-50">
             <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Learning Hub</h1>
                        <p className="text-xs text-gray-500">Employee Portal</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700 hidden sm:inline-block">
                            Welcome, {profile?.full_name || user?.email}
                        </span>
                        <form action={handleSignOut}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">My Courses</h2>
                        <p className="text-muted-foreground">Continue your learning journey.</p>
                    </div>
                    
                    <AssignedCourseGrid courses={courses} tenantSlug={tenantSlug} />
                </div>
            </main>
        </div>
    )
}
