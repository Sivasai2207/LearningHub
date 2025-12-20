import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { getTenantContext } from '@/lib/tenant/context'
import { notFound } from 'next/navigation'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  
  if (!tenant) {
      notFound()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  )
}
