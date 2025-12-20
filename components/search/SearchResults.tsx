'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Library, Folder, History, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function SearchResults({ results, tenantSlug }: { results: any, tenantSlug: string }) {
    const hasResults = results.courses.length > 0 || results.modules.length > 0 || results.content.length > 0

    if (!hasResults) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                <p className="text-gray-500">No matches found for your search.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-8">
            {results.courses.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Library className="w-5 h-5 text-blue-600" />
                        Courses ({results.courses.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {results.courses.map((c: any) => (
                            <Link key={c.id} href={`/t/${tenantSlug}/admin/courses/${c.id}`}>
                                <Card className="hover:border-primary transition-colors cursor-pointer group">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                                            {c.title}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {results.modules.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Folder className="w-5 h-5 text-amber-600" />
                        Modules ({results.modules.length})
                    </h2>
                    <div className="space-y-2">
                        {results.modules.map((m: any) => (
                            <Link key={m.id} href={`/t/${tenantSlug}/admin/courses/${m.course_id}/modules`} className="block">
                                <div className="p-3 border rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between group">
                                    <span className="text-sm font-medium">{m.title}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {results.content.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        Content Items ({results.content.length})
                    </h2>
                    <div className="space-y-2">
                        {results.content.map((i: any) => (
                            <Link key={i.id} href={`/t/${tenantSlug}/admin/modules/${i.module_id}/content`} className="block">
                                <div className="p-3 border rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between group">
                                    <span className="text-sm font-medium">{i.title}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
