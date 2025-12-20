'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/admin/audit'
import { z } from 'zod'

// Schema for Course Import
// Expects: { courses: [ { title, description, modules: [ { title, content: [ { title, url, type } ] } ] } ] }
const contentSchema = z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['youtube', 'pdf', 'ppt', 'link'])
})

const moduleSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    content: z.array(contentSchema).optional()
})

const courseSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    modules: z.array(moduleSchema).optional()
})

const importSchema = z.object({
    courses: z.array(courseSchema)
})

export async function importContent(jsonString: string) {
    const supabase = await createClient()

    // 1. Validate
    let data;
    try {
        const raw = JSON.parse(jsonString)
        const parsed = importSchema.safeParse(raw)
        if (!parsed.success) return { error: 'Validation Error: ' + parsed.error.issues[0].message }
        data = parsed.data
    } catch (e) {
        return { error: 'Invalid JSON format' }
    }

    // 2. Process (Sequential for now to respect IDs)
    let stats = { courses: 0, modules: 0, items: 0 }

    try {
        for (const c of data.courses) {
            // Create Course
            const { data: course, error: cErr } = await supabase
                .from('courses')
                .insert({ title: c.title, description: c.description })
                .select()
                .single()

            if (cErr) throw new Error(`Failed to create course ${c.title}: ${cErr.message}`)
            stats.courses++

            if (c.modules) {
                let sortOrder = 1
                for (const m of c.modules) {
                    // Create Module
                    const { data: module, error: mErr } = await supabase
                        .from('modules')
                        .insert({
                            course_id: course.id,
                            title: m.title,
                            description: m.description,
                            sort_order: sortOrder++
                        })
                        .select()
                        .single()

                    if (mErr) throw new Error(`Failed to create module ${m.title}: ${mErr.message}`)
                    stats.modules++

                    if (m.content) {
                        for (const item of m.content) {
                            // Create Content
                            const { error: iErr } = await supabase
                                .from('content_items')
                                .insert({
                                    module_id: module.id,
                                    title: item.title,
                                    url: item.url,
                                    type: item.type
                                })

                            if (iErr) throw new Error(`Failed to create item ${item.title}: ${iErr.message}`)
                            stats.items++
                        }
                    }
                }
            }
        }
    } catch (e: any) {
        return { error: e.message }
    }

    // 3. Log
    await logAudit({
        action: 'IMPORT_BULK',
        entityType: 'system',
        metadata: stats
    })

    return { success: true, stats }
}
