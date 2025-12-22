import { Button } from '@/components/ui/button'
import { Link as LinkIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Minimal type for assigned courses (subset of full Course)
type AssignedCourse = {
    id: string
    title: string
    status: string
    description?: string | null
}

export function AssignedCourseGrid({ courses, tenantSlug }: { courses: AssignedCourse[], tenantSlug: string }) {
    if (courses.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium">No courses assigned yet.</h3>
                <p className="text-muted-foreground">Check back later or contact your administrator.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
                <Card key={course.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                            {course.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {/* Progress could go here in Phase 3 */}
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={ROUTES.tenant(tenantSlug).employee.course(course.id)}>
                                View Modules
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
