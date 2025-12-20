import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const contentItemId = searchParams.get('contentItemId')
    if (!contentItemId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = await createClient()

    // 1. Verify access via SELECT on content_items
    // RLS handles the permission check
    const { data: item, error: fetchError } = await supabase
        .from('content_items')
        .select('storage_path, tenant_id')
        .eq('id', contentItemId)
        .single()

    if (fetchError || !item || !item.storage_path) {
        return NextResponse.json({ error: 'Unauthorized or missing file' }, { status: 403 })
    }

    // 2. Generate Signed URL (15 mins TTL)
    const { data, error: signError } = await supabase
        .storage
        .from('learning-content')
        .createSignedUrl(item.storage_path, 900)

    if (signError) {
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
}
