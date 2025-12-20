import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight, Users, BookOpen, BarChart3 } from 'lucide-react'
import { ROUTES } from '@/lib/config/routes'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to appropriate dashboard
  if (user) {
    const { data: membership } = await supabase
      .from('tenant_memberships')
      .select('role, tenants(slug)')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .single()

    if (membership && membership.tenants) {
      const slug = (membership.tenants as any).slug
      const tenantRoutes = ROUTES.tenant(slug)
      const dashboardPath = ['owner', 'admin', 'trainer'].includes(membership.role)
        ? tenantRoutes.admin.dashboard
        : tenantRoutes.employee.dashboard
      redirect(dashboardPath)
    } else {
      // User exists but has no tenant - send to setup
      redirect(ROUTES.setup)
    }
  }

  // Not logged in - show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Learning Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.login}>
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href={ROUTES.signup}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Empower Your Team with 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Smarter Learning</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            The modern learning management system designed for growing companies. 
            Create courses, track progress, and upskill your workforce efficiently.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={ROUTES.signup}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={ROUTES.login}>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Rich Course Builder</h3>
            <p className="text-slate-400">
              Create engaging courses with videos, PDFs, and interactive content.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-cyan-600/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Team Management</h3>
            <p className="text-slate-400">
              Organize employees into cohorts and assign courses at scale.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Progress Analytics</h3>
            <p className="text-slate-400">
              Track completion rates and measure learning outcomes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
        <div className="text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Learning Hub. Built for modern teams.
        </div>
      </footer>
    </div>
  )
}
