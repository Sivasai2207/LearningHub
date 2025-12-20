import { getCourseWithModules } from '@/lib/data/employee'
import { ModuleList } from '@/components/employee/ModuleList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params
    const result = await getCourseWithModules(courseId)

    if (!result) {
        // If course not found OR not assigned (RLS returns null), 
        // we show not found or unauthorized via standard UI.
        // For security, better to treat as 404 to not leak existence.
        notFound()
    }

    const { course, modules } = result

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Button variant="ghost" size="sm" asChild className="mb-4 pl-0 hover:bg-transparent">
                <Link href="/employee" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </Button>
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-lg text-gray-600">{course.description}</p>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Modules</h2>
                <ModuleList modules={modules} />
            </div>
        </div>
    )
}
