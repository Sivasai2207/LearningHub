import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant/context'
import { SearchResults } from '@/components/search/SearchResults'

export default async function SearchPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ tenantSlug: string }>,
    searchParams: Promise<{ q?: string }>
}) {
    const { tenantSlug } = await params
    const { q } = await searchParams
    const query = q || ''

    const tenant = await getTenantContext(tenantSlug)
    const supabase = await createClient()

    let results: { courses: any[], modules: any[], content: any[] } = { courses: [], modules: [], content: [] }

    if (query) {
        // Full Text Search
        const { data: courses } = await supabase
            .from('courses')
            .select('id, title, description')
            .eq('tenant_id', tenant?.id)
            .textSearch('search_vector', query)

        const { data: modules } = await supabase
            .from('modules')
            .select('id, title, course_id')
            .eq('tenant_id', tenant?.id)
            .textSearch('search_vector', query)

        const { data: content } = await supabase
            .from('content_items')
            .select('id, title, module_id')
            .eq('tenant_id', tenant?.id)
            .textSearch('search_vector', query)

        results = { 
            courses: courses || [], 
            modules: modules || [], 
            content: content || [] 
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
                <p className="text-gray-500 underline decoration-primary/30">
                    Results for &quot;{q}&quot; in {tenant?.name}
                </p>
            </div>
            
            <SearchResults results={results} tenantSlug={tenantSlug} />
        </div>
    )
}
