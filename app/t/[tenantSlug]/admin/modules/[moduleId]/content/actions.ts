'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/admin/audit'
import { ROUTES } from '@/lib/config/routes'

const contentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    type: z.enum(['youtube', 'pdf', 'ppt', 'link', 'doc', 'image', 'video', 'zip']),
    content_source: z.enum(['external', 'storage']).default('external'),
    storage_path: z.string().optional(),
})

export async function createContent(moduleId: string, formData: FormData, tenantId: string, tenantSlug: string) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as any
    const content_source = (formData.get('content_source') as any) || 'external'
    const storage_path = formData.get('storage_path') as string

    const validation = contentSchema.safeParse({ title, url, type, content_source, storage_path })
    if (!validation.success) {
        return { error: helperZodError(validation.error) }
    }

    const { data: newItem, error } = await supabase
        .from('content_items')
        .insert({
            module_id: moduleId,
            tenant_id: tenantId,
            title,
            url: content_source === 'external' ? url : '',
            type,
            content_source,
            storage_path: content_source === 'storage' ? storage_path : null
        })
        .select('id')
        .single()

    if (error) return { error: error.message }

    await logAudit({
        action: 'CONTENT_CREATE',
        entityType: 'content',
        entityId: newItem.id,
        metadata: { title, moduleId, tenantId }
    })

    revalidatePath(ROUTES.tenant(tenantSlug).admin.content(moduleId))
    return { success: true }
}

export async function updateContent(id: string, moduleId: string, formData: FormData, tenantSlug: string) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as any

    // For update, we usually don't change source easily but we can support it
    const content_source = (formData.get('content_source') as any) || 'external'
    const storage_path = formData.get('storage_path') as string

    const validation = contentSchema.safeParse({ title, url, type, content_source, storage_path })
    if (!validation.success) {
        return { error: helperZodError(validation.error) }
    }

    const { error } = await supabase
        .from('content_items')
        .update({
            title,
            url: content_source === 'external' ? url : '',
            type,
            content_source,
            storage_path: content_source === 'storage' ? storage_path : null
        })
        .eq('id', id)

    if (error) return { error: error.message }

    await logAudit({
        action: 'CONTENT_UPDATE',
        entityType: 'content',
        entityId: id,
        metadata: { title, moduleId }
    })

    revalidatePath(ROUTES.tenant(tenantSlug).admin.content(moduleId))
    return { success: true }
}

export async function deleteContent(id: string, moduleId: string, tenantSlug: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('content_items').delete().eq('id', id)

    if (error) return { error: error.message }

    await logAudit({
        action: 'CONTENT_DELETE',
        entityType: 'content',
        entityId: id,
        metadata: { moduleId }
    })

    revalidatePath(ROUTES.tenant(tenantSlug).admin.content(moduleId))
    return { success: true }
}

function helperZodError(error: z.ZodError) {
    return error.issues.map(e => e.message).join(', ')
}
