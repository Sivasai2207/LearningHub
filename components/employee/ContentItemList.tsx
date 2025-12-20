import { ContentItem } from '@/types/db'
import { FileText, Link as LinkIcon, Video, Presentation, ExternalLink, FileQuestion, FileVideo, ImageIcon, Archive } from 'lucide-react'
import { ContentOpenButton } from '@/components/content/ContentOpenButton'

const TYPE_ICONS = {
    youtube: Video,
    pdf: FileText,
    ppt: Presentation,
    link: LinkIcon,
    doc: FileText,
    image: ImageIcon,
    video: FileVideo,
    zip: Archive
}

export function ContentItemList({ items }: { items: ContentItem[] }) {
    if (items.length === 0) {
        return <div className="text-muted-foreground italic">No content items available.</div>
    }

    return (
        <div className="space-y-4">
            {items.map((item) => {
                 const rawItem = item as any // Handle new fields
                 const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] || LinkIcon
                 
                 return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-md">
                                <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{item.title}</h4>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] text-muted-foreground uppercase bg-gray-50 px-1.5 py-0.5 rounded border font-mono">
                                        {item.type}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase bg-gray-50 px-1.5 py-0.5 rounded border font-mono">
                                        {rawItem.content_source || 'external'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <ContentOpenButton 
                            contentItemId={item.id}
                            externalUrl={item.url}
                            source={rawItem.content_source || 'external'}
                        />
                    </div>
                 )
            })}
        </div>
    )
}
