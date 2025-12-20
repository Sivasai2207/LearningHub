import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export const getMyAssignedCourses = cache(async (tenantId: string) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Use the new view for efficiency and correctness
    const { data } = await supabase
        .from('v_employee_effective_courses')
        .select(`
            id:course_id,
            title:course_title,
            status:course_status,
            description
        `)
        .eq('employee_id', user.id)
        .eq('tenant_id', tenantId)
        .eq('course_status', 'published')
        .order('course_title')

    return (data || []) as any[]
})

export const getCourseWithModules = cache(async (courseId: string) => {
    const supabase = await createClient()

    // RLS filters courses. If access denied, data is null.
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

    if (!course) return null // Or handle error

    const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order')

    return { course, modules: modules || [] }
})

export const getModuleWithContent = cache(async (moduleId: string) => {
    const supabase = await createClient()

    // Need module + course info for breadcrumbs
    const { data: moduleData } = await supabase
        .from('modules')
        .select('*, courses(*)')
        .eq('id', moduleId)
        .single()

    if (!moduleData) return null

    const { data: content } = await supabase
        .from('content_items')
        .select('*')
        .eq('module_id', moduleId)
    // .order('created_at') // or whatever order

    return { module: moduleData, content: content || [] }
})
