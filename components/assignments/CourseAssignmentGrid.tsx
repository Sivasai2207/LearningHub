'use client'

import React, { useEffect, useState } from 'react'
import { Course } from '@/types/db'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { getEmployeeAssignments, saveAssignments } from '@/app/t/[tenantSlug]/admin/assignments/actions'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface CourseAssignmentGridProps {
    employeeId: string
    allCourses: Course[]
    tenantId: string
    tenantSlug: string
}

export function CourseAssignmentGrid({ employeeId, allCourses, tenantId, tenantSlug }: CourseAssignmentGridProps) {
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Load initial assignments when employeeId changes
    useEffect(() => {
        if (!employeeId) return 
        
        async function load() {
            setLoading(true)
            const ids = await getEmployeeAssignments(employeeId, tenantId)
            setAssignedIds(new Set(ids))
            setLoading(false)
        }
        
        load()
    }, [employeeId, tenantId])

    const handleToggle = (courseId: string, checked: boolean) => {
        const next = new Set(assignedIds)
        if (checked) next.add(courseId)
        else next.delete(courseId)
        setAssignedIds(next)
    }

    const handleSave = async () => {
        setSaving(true)
        const result = await saveAssignments(employeeId, Array.from(assignedIds), tenantId, tenantSlug)
        setSaving(false)
        
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Assignments saved successfully")
        }
    }

    if (!employeeId) {
        return <div className="text-center text-muted-foreground py-10 border rounded-md">Please select an employee to view assignments</div>
    }

    if (loading) {
        return <div className="py-10 text-center">Loading assignments...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assign Courses</h3>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allCourses.map(course => {
                    const isChecked = assignedIds.has(course.id)
                    return (
                        <Card key={course.id} className={isChecked ? "border-blue-500 bg-blue-50/10" : ""}>
                            <CardHeader className="flex flex-row items-start space-y-0 pb-2 space-x-3">
                                <Checkbox 
                                    id={`course-${course.id}`} 
                                    checked={isChecked}
                                    onCheckedChange={(c) => handleToggle(course.id, c as boolean)}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor={`course-${course.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                        {course.title}
                                    </Label>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {course.description || "No description"}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
             {allCourses.length === 0 && <div className="text-muted-foreground text-sm">No courses available.</div>}
        </div>
    )
}
