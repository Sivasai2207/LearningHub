import { Module } from '@/types/db'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function ModuleList({ modules }: { modules: Module[] }) {
    if (modules.length === 0) {
        return <div className="text-muted-foreground italic">No modules available yet.</div>
    }

    return (
        <div className="space-y-4">
            {modules.map((module) => (
                <Link 
                    key={module.id} 
                    href={`/employee/modules/${module.id}`}
                    className="block p-4 border rounded-lg bg-white hover:border-blue-500 hover:shadow-sm transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                                    Module {module.sort_order}
                                </span>
                                <h3 className="font-medium text-lg text-gray-900">{module.title}</h3>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{module.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </Link>
            ))}
        </div>
    )
}
