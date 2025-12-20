'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadContentFile(moduleId: string, tenantId: string, file: File) {
    const supabase = await createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `tenant/${tenantId}/modules/${moduleId}/${fileName}`

    const { data, error } = await supabase
        .storage
        .from('learning-content')
        .upload(filePath, file)

    if (error) return { error: error.message }

    return { path: filePath, size: file.size, type: file.type }
}
