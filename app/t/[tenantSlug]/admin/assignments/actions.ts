'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/admin/audit'
import { ROUTES } from '@/lib/config/routes'

export async function getEmployeeAssignments(employeeId: string, tenantId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('employee_course_assignments')
        .select('course_id')
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)

    return data?.map(d => d.course_id) || []
}

export async function saveAssignments(employeeId: string, courseIds: string[], tenantId: string, tenantSlug: string) {
    const supabase = await createClient()

    // 1. Get current assignments for this tenant
    const { data: current } = await supabase
        .from('employee_course_assignments')
        .select('course_id')
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)

    const currentIds = new Set(current?.map(c => c.course_id) || [])
    const newIds = new Set(courseIds)

    // 2. Determine to Add
    const toAdd = courseIds.filter(id => !currentIds.has(id))

    // 3. Determine to Remove
    const toRemove = Array.from(currentIds).filter(id => !newIds.has(id))

    // 4. Perform Mutations
    if (toRemove.length > 0) {
        const { error } = await supabase
            .from('employee_course_assignments')
            .delete()
            .eq('employee_id', employeeId)
            .eq('tenant_id', tenantId)
            .in('course_id', toRemove)

        if (error) return { error: error.message }
    }

    if (toAdd.length > 0) {
        const { error } = await supabase
            .from('employee_course_assignments')
            .insert(toAdd.map(course_id => ({
                employee_id: employeeId,
                tenant_id: tenantId,
                course_id
            })))

        if (error) return { error: error.message }
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
        await logAudit({
            action: 'ASSIGNMENT_UPDATE',
            entityType: 'assignment',
            entityId: employeeId,
            metadata: { added: toAdd, removed: toRemove, tenantId }
        })
    }

    revalidatePath(ROUTES.tenant(tenantSlug).admin.assignments)
    return { success: true }
}
